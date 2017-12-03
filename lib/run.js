"use strict";

const passthru = require("./util/passthru.js");

module.exports = (cmd) => {
  console.log(`RUN: ${ cmd }`);
  return passthru(cmd);
};
