/**
 * This function is run before pacman. Try to keep this minimal, but put things
 * than can affect pacman here. Things like pacman configuration, host, and time
 * configuration.
 */

exports.beforePackages = async ({ install, run, changes }) => {
  await install([
    "/etc/pacman.conf",
    "/etc/pacman.d/mirrorlist",
  ])
}

/**
 * This list contains all the packages that the system should have after a
 * successful sync. Package groups (such as base, base-devel, or xorg) should
 * use the `{ group: "base" }` format. External packages, as in ones that are
 * managed either manually or by an external tool such as pacaur or yaourt
 * should be put here. This will ensure that these packages and their
 * dependencies are left untouched.
 */
exports.packages = [
  { external: "effuvv"},
  { group: "base" },
  //{ group: "base-devel" },
]

/**
 * This function is run after pacman. Put the rest of the system configuration
 * in this.
 */
exports.afterPackages = async ({ install, run, changes }) => {
  await install([
  ])
}

/**
 * This function is run after the afterPackages hook. To get the values for
 * hashedPassword, run effuvv-mkpasswd and paste the values here. It is
 * imperative to not modify these users/groups outside this configuration. Both
 * of the following passwords are "foo".
 */
exports.usersAndGroups = {
  users: {
    root: {
      //encryptedPassword: "$6$gHolADlWgcbf4QkG$3Pt.bqHP2yMo9hhiMDQvMENjIpwnn8w.NjIEfhPl17j5oUQoZjlt/t3YOLhFzSHCU7r4tFYREqMSTVn/weVoj1",
    },

    //shawn: {
    //  encryptedPassword: "$6$gHolADlWgcbf4QkG$3Pt.bqHP2yMo9hhiMDQvMENjIpwnn8w.NjIEfhPl17j5oUQoZjlt/t3YOLhFzSHCU7r4tFYREqMSTVn/weVoj1",
    //  groups: [ "wheel" ],
    //},
  },
};

/**
 * This is run after the usersAndGroups hook. This list contains all of the
 * systemd services that should be enabled. It is imperative to not enable/start
 * or disable/stop services outside of this hook.
 */
exports.services = [
  //"fstrim.timer",
]
