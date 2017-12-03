"use strict";

const configDir   = require("./config_dir.js");
const profileName = require("./profile_name.js");

module.exports = [];

const addLine = (profileName) => {
  if (profileName === "default") {
    module.exports.push(`${ configDir }/profiles/default`);
  } else {
    const dir = `${ configDir }/profiles/${ profileName }`;
    module.exports.push(dir);

    const confPathname = `${ dir }/farch_conf.js`;
    addLine(require(confPathname).parent || "default");
  }
};
addLine(profileName);
