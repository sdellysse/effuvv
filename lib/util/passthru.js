"use strict";

const spawn = require("child_process").spawn;

module.exports = (cmd) => new Promise((resolve, reject) => {
  const proc = spawn(cmd, [], {
    shell: true,
    stdio: "inherit",
  });

  proc.on("close", code => {
    if (code === 0) {
      return resolve();
    } else {
      return reject({ code });
    }
  });

  proc.on("error", reject);
});
