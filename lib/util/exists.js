"use strict";

const exists = require("util").promisify(require("fs").exists);
const lstat  = require("util").promisify(require("fs").lstat);

exports.file = (pathname) => exists(pathname);
exports.fileOrSymlink = async function fileOrSymlink (pathname) {
  try {
    await lstat(pathname);
    return true;
  } catch (e) {
    return false;
  }
};
