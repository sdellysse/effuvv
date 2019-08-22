"use strict";

const changes     = require("../singletons/changes.js");
const cond        = require("../util/cond.js");
const exec        = require("util").promisify(require("child_process").exec);
const flatmapp    = require("../util/flatmapp.js");
const mapp        = require("../util/mapp.js");
const passthru    = require("../util/passthru.js");
const systemstate = require("../singletons/systemstate.js");
const zip         = require("../util/zip.js");

const stf = (str, delim) => str.split(delim).map(s => s.trim()).filter(s => s.length > 0);

const areWeOnline = async () => {
  try {
    await exec(`pacman -Sy`);
    return true;
  } catch (e) {
    return false;
  }
};

const allPackages = () => pipe.a("pacman -Q", [
  [ exec ],
  [ ".", "stdout" ],
  [ stf, "\n" ],
  [ reduce, {}, (acc, line) => {
    const [ name, version ] = line.split(" ");
    return {
      ...acc,
      [name]: version,
    };
  } ],
]);


const groupToPackages = async (group) => {
  const output = await (async () => {
    try {
      return (await exec(`pacman -Sg ${ group }`)).stdout;
    } catch (_e) {
      return `${ group } ${ group }`;
    }
  })();

  return pipe(output, [
    [ stf, "\n" ],
    [ "map", s => stf(s, " ") ],
    [ "map", ([ _groupName, packageName ]) => packageName ],
  ]);
};

const depsOf = async (name) => {
  return (await exec(`pactree -u ${ name }`))
    .stdout
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0)
  ;
};

const filterMapOnKey = (objects, keyName) =>
  objects.filter(item => item[keyName]).map(item => item[keyName])
;

module.exports = async (defs) => {
  if (!(await areWeOnline())) {
    console.log("WARNING: network offline / pacman not working. Skipping packages.");
    return;
  }

  defs = defs.map(def => {
    if (typeof def === "string") {
      return { package: def };
    } else {
      return def;
    }
  });

  const generateDefaultDefOptions = () => ({
    external: false,
    without: [],
  });
  const clearedDefs = defs.map(def => {
    if (typeof(def) === "string") {
      return [def, generateDefaultDefOptions()];
    }

    if (Array.isArray(def) && def.length === 2 && typeof(def[0]) === "string") {
      return def;
    }

    throw new Error(`bad def: ${ JSON.stringify(def) }`);
  });

  const expandedGroupDefs = await flatmapp(clearedDefs, async ([ name, opts ]) => {
    const names = await groupToPackages(name);
    return names
      .filter(n => cond([
        [ () => !opts.without,                     () => true ],
        [ () => typeof(opts.without) === "string", () => n !== opts.without ],
        [ () => Array.isArray(opts.without),       () => !opts.without.includes(n) ],
      ]))
      .map(n => ([ n, opts ]))
    ;
  })

  const internalPackageNames = expandedGroupDefs.filter(([ _name, opts ]) => !opts.external);
  const externalPackageNames = expandedGroupDefs.filter(([ _name, opts ]) =>  opts.external);

  const allPackagesBeforeChanges = await allPackages();

  const installCommand = `pacman -Syu --needed --noconfirm ${ internalPackageNames.join(" ") }`;
  console.log(`PACMAN-INSTALL-COMMAND: ${ installCommand }`);
  await passthru(installCommand);

  const packagesToKeepLookup = {};
  {
    for (const packageName of internalPackageNames) {
      packagesToKeepLookup[packageName] = true;
    }

    for (const packageName of Object.keys(packagesToKeepLookup)) {
      for (const depName of (await depsOf(packageName))) {
        packagesToKeepLookup[depName] = true;
      }
    }

    for (const packageName of externals) {
      packagesToKeepLookup[packageName] = true;

      try {
        for (const depName of (await depsOf(packageName))) {
          packagesToKeepLookup[depName] = true;
        }
      } catch (_e) {
        console.log(`PACKAGE-LOOKUP-DEPS: WARNING: error looking up deps for EXTERNAL(${ packageName }); ignoring`);
      }
    }
  };

  const packagesToRemove = Object.keys(await allPackages()).filter(packageName => packagesToKeepLookup[packageName] !== true);
  if (packagesToRemove.length > 0) {
    const removeCommand = `pacman -Rdd --noconfirm ${ packagesToRemove.join(" ") }`;
    console.log(`PACMAN-REMOVE-COMMAND: ${ removeCommand }`);
    await passthru(removeCommand);
  }

  const allPackagesAfterChanges = await allPackages();

  for (const name of Object.keys(allPackagesAfterChanges)) {
    if (allPackagesBeforeChanges[name] == null) {
      console.log(`PACKAGE-INSTALLED: ${ name }@${ allPackagesAfterChanges[name] }`);
      changes.packages.added[name] = allPackagesAfterChanges[name];
    }
    if (allPackagesBeforeChanges[name] != null && allPackagesBeforeChanges[name] !== allPackagesAfterChanges[name]) {
      const from = allPackagesBeforeChanges[name];
      const to   = allPackagesAfterChanges[name];

      console.log(`PACKAGE-UPGRADED: ${ name }: ${ from } -> ${ to }`);
      changes.packages.updated[name] = { from, to };
    }
  }
  for (const name of Object.keys(allPackagesBeforeChanges)) {
    if (allPackagesAfterChanges[name] == null) {
      console.log(`PACKAGE-REMOVED: ${ name }@${ allPackagesBeforeChanges[name] }`);
      changes.packages.removed[name] = allPackagesBeforeChanges[name];
    }
  }

  systemstate.packages = allPackagesAfterChanges;
  await systemstate.save();
};
