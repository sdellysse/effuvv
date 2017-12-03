"use strict";
/**
 * We use this function instead of something like fsextra.copy as I could not
 * find a way to copy a broken symlink other than this.
 */

const exec = require("util").promisify(require("child_process").exec);

/**
 * Under arch-chroot we can't modify /etc/resolv.conf. 
 */
const resolvconfError = `cp: cannot remove '/etc/resolv.conf': Device or resource busy`;
const resolvconfExplanation = 
`WARNING: Error while replacing '/etc/resolv.conf'. If you're running this under
'arch-chroot', then there is nothing to worry about, though you need to re-run
this command after rebooting to fully apply system changes. If you're not in 
'arch-chroot', you fucked.`;

module.exports = async function copy (from, to) {
  try {
    return await exec(`cp --no-dereference --preserve=all "${ from }" "${ to }"`);
  } catch (e) {
    if (e.stderr.trim() === resolvconfError) {
      console.log(resolvconfExplanation);
    } else {
      throw e;
    }
  }
};
