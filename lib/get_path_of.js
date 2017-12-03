"use strict";

const exists       = require("./util/exists.js");
const profilePaths = require("./singletons/profile_paths.js");
const zip          = require("./util/zip.js");

module.exports = async (name) => {
  const paths = profilePaths.map(path => `${ path }/${ name }`);
  const tested = zip(
    paths,
    await Promise.all(paths.map(exists.fileOrSymlink))
  );

  const found = 
    tested
    .filter(([ _path, exists ]) => !!exists)
    .map(([ path, _exists ]) => path)
    [0]
  ;

  return found;
};
