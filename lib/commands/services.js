"use strict";

const changes     = require("../singletons/changes.js");
const exec        = require("util").promisify(require("child_process").exec);
const systemstate = require("../singletons/systemstate.js");

module.exports = async (names) => {
  const servicesToStart = [];
  for (const name of names) {
    if (!systemstate.services.includes(name)) {
      console.log(`SERVICE-ENABLE: ${ name }`);
      await exec(`systemctl enable  ${ name }`);
      servicesToStart.push(name);

      changes.services.enabled[name] = true;
    }
  }

  const servicesToStop = [];
  for (const name of systemstate.services) {
    if (!names.includes(name)) {
      console.log(`SERVICE-DISABLE: ${ name }`);
      await exec(`systemctl disable  ${ name }`);
      servicesToStop.push(name);

      changes.services.disabled[name] = true;
    }
  }

  systemstate.services = names;
  await systemstate.save();

  // We separated the enable/disable and the start/stop here to make the stops
  // the last thing execute, to guard against the case where the display manager
  // get stopped and this script was running in an xterm. 
  for (const name of servicesToStart) {
    await exec(`systemctl start ${ name }`);
  }
  for (const name of servicesToStop) {
    await exec(`systemctl stop ${ name }`);
  }
};
