"use strict";

const changes      = require("../singletons/changes.js");
const configDir    = require("../singletons/config_dir.js");
const copy         = require("../util/copy.js");
const exists       = require("../util/exists.js");
const memoizeAsync = require("../util/memoize_async.js");
const md5          = require("md5");
const readFile     = require("util").promisify(require("fs").readFile);
const systemstate  = require("../singletons/systemstate.js");
const zip          = require("../util/zip.js");

const getPathOf = async (name) => {
  const pathname = `${ configDir }/${ name }`;
  if (await exists.fileOrSymlink(pathname)) {
    return pathname;
  }
}

const isSymlink = (function () {
  const lstat = require("util").promisify(require("fs").lstat);
  return async function isSymlink (...args) {
    try {
      return (await lstat(...args)).isSymbolicLink();
    } catch (e) {
      return false;
    }
  };
})();

const getSymlinkTarget = (function () {
  const readlink = require("util").promisify(require("fs").readlink);
  return async function getSymlinkTarget (pathname) {
    return await readlink(pathname, { encoding: "utf8" });
  };
})();

const getFingerprintOf = async (filename) => {
  if (await isSymlink(filename)) {
    return {
      symlink: true,
      target: await getSymlinkTarget(filename),
    };
  } else {
    const buffer = await readFile(filename);
    return {
      length: buffer.length,
      md5:    md5(buffer),
    };
  }
};

const fingerprintsEqual = (l, r) => (l.symlink === r.symlink) && (l.target === r.target) && (l.length === r.length) && (l.md5 === r.md5);

module.exports = async (names) => {
  await Promise.all(
    zip(await Promise.all(names.map(getPathOf)), names)
    .map(async ([ from, to ]) => {
      if (from == null) {
        throw new Error(`missing source file ${ to }`);
      }

      const fingerprint = await getFingerprintOf(from);
      const isInRecord = () => !!systemstate.files[to];
      const toExists = memoizeAsync(() => exists.fileOrSymlink(to));
      const toFingerprint = memoizeAsync(() => getFingerprintOf(to));
      const toMatchesRecord = memoizeAsync(async () => fingerprintsEqual(await toFingerprint(), systemstate.files[to]));
      const toMatchesFrom = memoizeAsync(async () => fingerprintsEqual(await toFingerprint(), fingerprint));

      if (isInRecord() && (await toExists()) && (await toMatchesRecord()) && (await toMatchesFrom())) {
        console.log(`INSTALL(${ to }): no change`);
      } else {
        if(0){
        } else if (isInRecord() && !(await toExists())) {
          console.log(`INSTALL(${ to }): WARNING: old file expected on system but not found; creating from ${ from }`);
        } else if (isInRecord() && (await toExists()) && !(await toMatchesRecord())) {
          console.log(`INSTALL(${ to }): WARNING: old file on system does not match record; replacing with ${ from }`);
        } else if (isInRecord() && (await toExists()) && (await toMatchesRecord()) && !(await toMatchesFrom())) {
          console.log(`INSTALL(${ to }): replacing with ${ from }`);
        } else if (!isInRecord() && !(await toExists())) {
          console.log(`INSTALL(${ to }): creating from ${ from }`);
        } else if (!isInRecord() && (await toExists()) && !(await toMatchesFrom())) {
          console.log(`INSTALL(${ to }): WARNING: old file is in system but not in record; replacing with ${ from }`);
        } else if (!isInRecord() && (await toExists()) && (await toMatchesFrom())) {
          console.log(`INSTALL(${ to }): WARNING: old file is same as ${ from } but does not exist in record; replacing with ${ from }`);
        } else {
          throw new Error(`unexpected case in install: ${ JSON.stringify({
            from,
            to,
            toExists: (await toExists()),
            fromFingerprint: fingerprint,
            toFingerprint: {
              record: systemstate.files[to] || null,
              actual: (
                (await toExists())
                ? (await toFingerprint())
                : null
              ),
            },
          }, null, 4) }`);
        }

        console.log(`COPYING: ${ from } -> ${ to }`);
        await copy(from, to);

        changes.files[to] = true;
        systemstate.files[to] = fingerprint;
      }
    })
  );

  await systemstate.save();
};
