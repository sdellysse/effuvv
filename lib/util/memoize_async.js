"use strict";

module.exports = function memoizeAsync (cb) {
  let cache = undefined;
  return async () => {
    if (cache === undefined) {
      cache = await cb();
    }
    return cache;
  };
};
