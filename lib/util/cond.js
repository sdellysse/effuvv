"use strict";

module.exports = (conditions) => {
  for (const [ condFn, bodyFn ] of conditions) {
    if (condFn()) {
      return bodyFn();
    }
  }
};
