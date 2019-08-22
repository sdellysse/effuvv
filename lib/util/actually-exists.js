"use strict";

// TODO document why this file needs to exist; I think it's due to subtle
// differences between fs.exists and lstat, probably due to broken symlinks

const { lstat }  = require("fs/promises")

module.exports = async (pathname) => {
  try {
    await lstat(pathname);
    return true;
  } catch (e) {
    return false;
  }
};
