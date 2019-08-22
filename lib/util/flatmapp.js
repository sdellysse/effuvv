"use strict";

const mapp = require("./mapp.js");

module.exports = async (list, iterator) => (await mapp(list, iterator)).reduce((acc, i) => acc.concat(i), []);
