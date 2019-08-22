"use strict";

const mkdirp     = require("fs.extra").mkdirp;
const path       = require("path");
const writeFile  = require("util").promisify(require("fs").writeFile);
const workingDir = require("./working_dir.js");

const pathname = `${ workingDir }/systemstate.json`;
Object.assign(exports, {
  WARNING: "!!!!!!!!! THIS FILE IS SYSTEM-GENERATED. DO NOT HAND EDIT !!!!!!!!!",
  version: 1,
  files: {},
  packages: {},
  services: [],
  usernames: [],
});

exports.save = async () => {
  await mkdirp(workingDir);
  await writeFile(pathname, JSON.stringify(exports, null, 2), { encoding: "utf8" });
};

exports.load = async () => {
  await mkdirp(workingDir);

  try {
    return Object.assign(exports, require(pathname));
  } catch (_e) {
    console.log("SYSTEMSTATE: WARNING: No systemstate file; continuing with default value");
    return exports;
  }
};
