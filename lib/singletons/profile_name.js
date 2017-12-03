"use strict";

const existsSync    = require("fs").existsSync;
const readFileSync  = require("fs").readFileSync;
const configDir     = require("./config_dir.js");

if (0) {
} else if (existsSync(`${ configDir }/system_profile`)) {
  module.exports = readFileSync(`${ configDir }/system_profile`, "utf8").split("\n")[0];
} else {
  module.exports = "default";
}
