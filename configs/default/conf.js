exports.beforePackages = async ({ install }) => install([
  "/etc/pacman.conf",
  "/etc/pacman.d/mirrorlist",
]);

module.exports.packages = [
  "base",
  "base-devel",
  "git",
  "openssh",
];


exports.afterPackages = async ({ install, run }) => {
  await install([
    "/etc/mkiniticpio.conf",
    "/etc/default/grub",
  ]);

  await run("mkinitcpio -p linux");
  await run("grub-mkconfig -o /boot/grub/grub.cfg");
};

exports.services = [
  "NetworkManager.service",
  "fstrim.timer",
];
