"use strict";

const profileName = require("./profile_name.js");
const configDir   = require("./config_dir.js");

module.exports = `${ configDir }/profiles/${ profileName }/farch_conf.js`;
