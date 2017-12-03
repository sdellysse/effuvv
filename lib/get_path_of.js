"use strict";

const configDir = require("./singletons/config_dir.js");
const exists    = require("./util/exists.js");

module.exports = async (name) => {
  const pathname = `${ configDir }/${ name }`;
  if (await exists.fileOrSymlink(pathname)) {
    return pathname;
  }
}
