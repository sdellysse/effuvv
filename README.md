Don't use on an existing installation. Theoretically, it can work, but
theoretically I could become a millionaire.

## What is effuvv?

`effuvv` is "functional arch". It allows (and requires) you to express your arch
linux installation in the terms of a function of a configuration.  Essentially,
you have a set of configuration files that you would normally edit, such as
/effuvv/etc/fstab and /effuvv/etc/default/grub, and a main config file, 
`/effuvv/effuvv_config.js` that specifies how everything should be bound together,
and a tool, `effuvv-sync`, that makes sure the system reflects your
configuration.

# WARNING
# WARNING

This is super pre-alpha stuff. I'm using it on my systems, but seriously new
bugs are being found every day. It's usable, but only if you wanna tinker.
Hopefully one day I can remove this warning but I don't know if it'll come. That
being said, it's not that scary once you get the hang of it.


### Prior art / Rationale

NixOS is a big influence in this project. NixOS makes the functional operating
system perfect; that is, everything fits perfectly into the NixOS world. The
downside of this perfection is that it's not an easy to transfer an existing
linux skill set into working NixOS skills. 

I wanted a tool that let me express my archlinux system in terms of a single set
of configuration files / directives, similar to NixOS, but one that didn't
require me to throw away all the time and energy that has gone into building
such a great distro like Arch.

## Tutorial

Arch Install Guide: `https://wiki.archlinux.org/index.php/installation_guide`

Follow the Arch Install Guide up to the part about `pacstrap`. Do
`pacstrap /mnt base` (just `base`, nothing more as we want to only have the most
minimal outside-of-effuvv system possible), and then chroot into the new install.
Immediately do this:

```
# cd /tmp
# curl -L http://effuvv-pkg.shawndellysse.com -o effuvv.tar.xz
# pacman -U effuvv.tar.xz
# rm effuvv.tar.xz
# effuvv-init
```

Now effuvv is intalled on your system. `effuvv-init` has created an extremely
basic skeleton configuration. Now we're going to follow the next few steps of
the install guide, but showing how they're done in effuvv.

First step, let's deviate from the guide for a moment and install `vim`. We're
doing this now to both show the packaged installation workflow and also to fix
the fact that Arch sets `$EDITOR` to that by default, even though it's not
installed by default. Run 

```
# EDITOR=vi effuvv-edit -c
```

to open the effuvv configuration in `vi`.

Scroll down to the `packages` array, and add `"vim",` to the end of the array:

```
exports.packages = [
  {external: "effuvv"},
  {group: "base"},
  //{group: "base-devel"},

  "vim",
]
```

Note the quotes and the trailing comma in `"vim",`. The quotes are necessary,
and while the trailing comma isn't necessary, it makes it easier to add more
entries later without having to remember to add the comma to the last entry so
unless you have a strong opinion otherwise I suggest you add it. You can also
take this time to uncomment the `base-devel` group if you like. Note the special
syntax for specifying packages groups that should be on the system, and ignore
the `external` clause for now, we'll get to that later. (TODO Later Text:
`external` clauses mark packages that aren't controlled by this tool. Examples
are effuvv, which was installed from a url, and AUR packages. You need to add
them here so that effuvv doesn't remove them or their dependencies when
`effuvv-sync` is ran.)

Close `vi` and run `effuvv-sync`. This is the only effuvv command that alters your
system. This execution of it should see that you want `vim` to be installed, and
right now it isn't, and it should bring the system in line with what your
configuration demands.

### Fstab

The next step in the guide is to append some generated stuff to the fstab. In
effuvv, we don't touch anything outside /effuvv or /home (or other state
directories), so let's pull fstab into our config.

```
# effuvv-edit -n /etc/fstab
```

`effuvv-edit` copies a file from the system into the correct place of the config
(in this case it gets placed in `/effuvv/etc/fstab`) and lets you edit the file.
In this case, we don't want to edit the file right now, so we pass `-n` to tell
it not to run `$EDITOR`.

Exit the chroot and append the generated entries to our config:

```
# genfstab -U /mnt >> /mnt/effuvv/etc/fstab
```

Re-enter the chroot and check the file.

```
# effuvv-edit /etc/fstab
```

Now we need to tell the configuration to install this file. Run

```
# effuvv-edit -c
```

and in the `install` array of the `afterPackages` clause, add the file:

```
exports.afterPackages = async ({ install, run, changes }) => {
  await install([
    "/etc/fstab",
  ])
}
```

This goes in the `afterPackages` clause due to it not being something that
pacman needs set up to run. Generally, most file installs will go here, with
only things like pacman configs, networking, timezones / locales, etc will go
in the `beforePackages` clause.

### Time Zone

Next step in the guide is to set the time zone. For this, we don't want to copy
a file from the system:

```
# ln -sf /usr/share/zoneinfo/Region/City "$( effuvv-edit -d -p /etc/localtime )"
```

This line creates a symlink to the City you specify into the right location in
the configuration. `effuvv-edit -d -p`'s `-d` doesn't actually copy the file from
the system but instead just gets the configuration's directory structure ready,
and the `-p` prints the location of where the file would be in the configuration
instead of attempting to edit it. We combine this with shell subsitition for 
nicety.

Don't forget, we need to add it to the `beforePackages` clause:

```
exports.beforePackages = async ({ install, run, changes }) => {
  await install([
    "/etc/pacman.conf",
    "/etc/pacman.d/mirrorlist",
    "/etc/localtime",
  ])

  if (changes.files["/etc/localtime"]) {
    await run("hwclock --systohc")
  }
}
```

What's this if-clause you ask? Looking at the Arch install guide, after
installing `/etc/localtime`, you want to run a command. This if-clause checks to
see if the file got installed (it will get installed this first run, but it
won't get re-installed on subsequent runs unless the file in the configuration
is changed).

### Locale
Let's repeat the same process for the locale. I'm going to do less hand-holding
here now that we have the pattern down.

Copy the file to the configuration and make your changes:

```
# effuvv-edit /etc/locale.gen
# effuvv-edit /etc/locale.conf
```

Update the `beforePackages` clause:

```
exports.beforePackages = async ({ install, run, changes }) => {
  await install([
    "/etc/pacman.conf",
    "/etc/pacman.d/mirrorlist",
    "/etc/localtime",
    "/etc/locale.gen",
    "/etc/locale.conf",
  ])

  if (changes.files["/etc/localtime"]) {
    await run("hwclock --systohc")
  }
  if (changes.files["/etc/locale.gen"]) {
    await run("locale-gen")
  }
}
```

### Hostname

Note that if the file doesn't exist on the system, `effuvv-edit` will create one
in the configuration:

```
# effuvv-edit /etc/hostname
# effuvv-edit /etc/hosts
```

Add both of these files to the `beforePackages` clause.

### Network Configuration

Should be able to tackle this yourself now

### Initramfs

How I handle this is like this, if you need to have a custom initramfs:

```
# effuvv-edit /etc/mkinitcpio.conf
```

`afterPackages` clause looks something like this:

```
exports.afterPackages = async ({ install, run, changes }) => {
  await install([
    // stuff...
    "/etc/mkinitcpio.conf",
  ])

  if (changes.files["/etc/mkinitcpio.conf"]) {
    await run("mkinitcpio -p linux")
  }
}
```

This way the initramfs will only be rebuilt if you change the source file.

### Users and Passwords

Okay this is pretty cool. Included in effuvv is a tool that generated encrypted
password strings, `effuvv-mkpasswd`. Protip: to get that big string into the 
configuration without copy and paste, close your editor and do:

```
# effuvv-mkpasswd >> /effuvv/effuvv_conf.js
# effuvv-edit -c
```

The password hash will now be at the end of the file. Move that string up inside
the quotes in the right stanza to set the password of a user.

```
exports.usersAndGroups = {
  users: {
    root: {
      encryptedPassword: "sdfhuyiurwyeiurywuioeryuioqyuiysdouivyxuozicyvuoiysu",
    },
    
    shawn: {
       encryptedPassword: "wuqeporiuqicxuvppisaufwepiuvpuzxpioupwe",
       groups: [ "wheel" ],
    },
  },
}
```

`effuvv-sync` will then make sure that the users in the system match the users in
the configuration.

### Boot loader

Grub EFI example:

```
exports.packages = [
  // stuff...
  "grub",
  "efibootmgr",
]

exports.afterPackages = async ({ install, run, changes }) => {
  // stuff...

  if (changes.packages.added["grub"]) {
    await run("grub-install --target=x86_64-efi --efi-directory=/boot --booloader-id=grub")
    await run("grub-mkconfig -o /boot/grub/grub.cfg")
  }
}
```

This will install `grub` package and on package-install, install grub as the
boot loader. This can be easily extended to have a grub config file managed by
the configuration, and have these commands run whenever it's installed or those
are changed as well:

```
exports.afterPackages = async ({ install, run, changes }) => {
  await install([
    // stuff...
    "/etc/default/grub",
  ])

  if (changes.packages.added["grub"]) {
    await run("grub-install --target=x86_64-efi --efi-directory=/boot --booloader-id=grub")
  }
  if (changes.files["/etc/default/grub"]) {
    await run("grub-mkconfig -o /boot/grub/grub.cfg")
  }
}
```

### Sudoers

```
# EDITOR="visudo -f" effuvv-edit /etc/sudoers
```


### Services

To start and enable-at-start a service, add it to the `services` clause:

```
exports.services = [
   "NetworkManager.service",
   "lightdm.service",
]
```

To stop and disable-at-start a service, remove it from the clause.
