"use strict";

const changes     = require("../singletons/changes.js");
const exec        = require("util").promisify(require("child_process").exec);
const systemstate = require("../singletons/systemstate.js");

module.exports = async (name) => {
  if (systemstate.services.includes(name)) {
    console.error(`RESTART-SERVICE: ${ name }`);
    await exec(`systemctl restart ${ name }`);
    changes.services.restarted[name] = true;
  }
};
