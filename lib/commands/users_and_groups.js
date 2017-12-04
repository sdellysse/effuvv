"use strict";

const changes     = require("../singletons/changes.js");
const exec        = require("util").promisify(require("child_process").exec);
const systemstate = require("../singletons/systemstate.js");
const readFile    = require("util").promisify(require("fs").readFile);

const parseShadow = (contents) => contents
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => {
    const [
      username,
      encryptedPassword,
      lastchanged,
      minimum,
      maximum,
      warn,
      inactive,
      expire
    ] = line.split(":");

    return {
      username,
      encryptedPassword: encryptedPassword === "x" ? null : encryptedPassword,
      lastchanged:       lastchanged       === ""  ? null : parseInt(lastchanged, 10),
      minimum:           minimum           === ""  ? null : parseInt(minimum, 10),
      maximum:           maximum           === ""  ? null : parseInt(maximum, 10),
      warn:              warn              === ""  ? null : parseInt(warn, 10),
      inactive:          inactive          === ""  ? null : parseInt(inactive, 10),
      expire:            expire            === ""  ? null : parseInt(expire, 10),
    };
  })
;

const parsePasswd = (contents) => contents
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => {
    const [
      username,
      _x,
      uid,
      gid,
      comment,
      homeDir,
      shell
    ] = line.split(":");

    return {
      username,
      uid: uid === "" ? null : parseInt(uid, 10),
      gid: gid === "" ? null : parseInt(gid, 10),
      comment,
      homeDir,
      shell,
    };
  })
;

const parseGroups = (contents) => contents
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => {
    const [
      name,
      _password,
      id,
      usernames
    ] = line.split(":");

    return {
      name,
      id: id === "" ? null : parseInt(id, 10),
      usernames: usernames.split(",").filter(it => it.trim().length > 0),
    };
  })
;

const getUsersFromFiles = (shadowFile, passwdFile, groupsFile) => {
  const users = {
    byName: {},
    byUid:  {},
  };

  for (const line of shadowFile) {
    users.byName[line.username] = Object.assign(users.byName[line.username] || {}, {
      username:          line.username,
      encryptedPassword: line.encryptedPassword,
    });
  }
  for (const line of passwdFile) {
    users.byName[line.username] = Object.assign(users.byName[line.username] || {}, {
      uid:     line.uid,
      gid:     line.gid,
      gids:    [],
      comment: line.comment,
      homeDir: line.homeDir,
      shell:   line.shell,
    });
  }
  for (const line of groupsFile) {
    for (const username of line.usernames) {
      users.byName[username].gids.push(line.id);
    }
  }

  for (const username of Object.keys(users.byName)) {
    users.byUid[users.byName[username].uid] = users.byName[username];
  }

  return users;
};

const getGroupsFromFile = (groupsFile) => {
  const groups = {
    byName: {},
    byGid:  {},
  };

  for (const line of groupsFile) {
    groups.byName[line.name] = {
      name:      line.name,
      gid:       line.id,
      usernames: line.usernames,
    };
  }

  for (const groupname of Object.keys(groups.byName)) {
    groups.byGid[groups.byName[groupname].gid] = groups.byName[groupname];
  }

  return groups;
};

module.exports = async function usersAndGroups ({
  users: userDefs,
  groups: groupDefs,
}) {
  for (const username of Object.keys(userDefs)) {
    const defaults = {
      createHome: true,
    };
    userDefs[username] = Object.assign({}, defaults, userDefs[username]);
  }

  for (const username of systemstate.usernames) {
    if (username !== "root") {
      if (!Object.keys(userDefs).includes(username)) {
        console.log(`USER-REMOVE: ${ username }`);
        await exec(`userdel -f -r ${ username }`);
        changes.users.removed[username] = true;
      }
    }
  }

  for (const username of Object.keys(userDefs)) {
    if (username !== "root") {
      if (!systemstate.usernames.includes(username)) {
        const def = userDefs[username];

        const createHomeS = def.createHome                      ? `-m`                              : "";
        const shellS      = def.shell !== undefined             ? `-s ${ def.shell}`                : "";
        const groupsS     = def.groups.length > 0               ? `-G ${ def.groups.join(",") }`    : "";
        const passwordS   = def.encryptedPassword !== undefined ? `-p '${ def.encryptedPassword }'` : "";

        console.log(`USER-ADD: ${ username }`);
        await exec(`useradd ${ username } ${ createHomeS } ${ shellS } ${ groupsS }`);
        changes.users.added[username] = true;
      }
    }
  }

  systemstate.usernames = Object.keys(userDefs);
  await systemstate.save();

  const shadowFile = parseShadow(await readFile("/etc/shadow", { encoding: "utf8" }));
  const passwdFile = parsePasswd(await readFile("/etc/passwd", { encoding: "utf8" }));
  const groupsFile = parseGroups(await readFile("/etc/group",  { encoding: "utf8" }));

  const users  = getUsersFromFiles(shadowFile, passwdFile, groupsFile);
  const groups = getGroupsFromFile(groupsFile);

  for (const username of Object.keys(userDefs)) {
    const def  = userDefs[username];
    const user = users.byName[username];

    if (def.encryptedPassword !== undefined) {
      if (def.encryptedPassword !== user.encryptedPassword) {
        console.log(`USER(${ username }): PASSWORD-CHANGED`);
        await exec(`usermod -p '${ def.encryptedPassword }' ${ username }`);
        changes.users.updated[username] = Object.assign(changes.users.updated[username] || {}, {
          encryptedPassword: true,
        });
      }
    }

    if (def.shell !== undefined) { 
      if (def.shell !== user.shell) {
        console.log(`USER(${ username }): SHELL-CHANGED: ${ user.shell } -> ${ def.shell }`);
        await exec(`usermod -s ${ def.shell } ${ username }`);
        changes.users.updated[username] = Object.assign(changes.users.updated[username] || {}, {
          shell: true,
        });
      }
    }

    if (def.groups !== undefined) {
      const defGroups  = def.groups.sort().join(",");
      const userGroups = user.gids.map(gid => groups.byGid[gid].name).sort().join(",");

      if (defGroups !== userGroups) {
        console.log(`USER(${ username }): GROUPS-CHANGED: ${ userGroups } -> ${ defGroups }`);
        await exec(`usermod -G '${ defGroups }' ${ username }`);
        changes.users.updated[username] = Object.assign(changes.users.updated[username] || {}, {
          groups: true,
        });
      }
    }
  }
};
