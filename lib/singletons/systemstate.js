"use strict";

const mkdirp     = require("fs.extra").mkdirp;
const path       = require("path");
const writeFile  = require("util").promisify(require("fs").writeFile);
const workingDir = require("./working_dir.js");

const pathname = `${ workingDir }/systemstate.json`;
Object.assign(exports, {
  WARNING: "!!!!!!!!! THIS FILE IS SYSTEM-GENERATED. DO NOT HAND EDIT !!!!!!!!!",
  files: {},
  packages: {},
  services: [],
  usernames: [],
});


exports.save = async () => {
  await mkdirp(path.parse(pathname).dir);
  await writeFile(pathname, JSON.stringify(exports, null, 2), { encoding: "utf8" });
};
exports.load = async () => {
  try {
    return Object.assign(exports, require(pathname));
  } catch (_e) {
    console.log("SYSTEMSTATE: WARNING: No systemstate file; continuing with default value");
    return exports;
  }
};
