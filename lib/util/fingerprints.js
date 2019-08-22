exports.generate = async (pathname) => {
    if (false) {
    } else if (!(await actuallyExists(pathname))) {
        return {
            exists: false
        }
    } else if (await symlinks.isSymlink(pathname)) {
        return {
            exists: true,
            symlink: true,
            target: (await symlinks.getTarget(pathname)),
        }
    } else {
        // add permissions and ownership and ctime and mtime info
        const buffer = await readFile(pathname)
        return {
            exists: true,
            symlink: false,
            length: buffer.length,
            md5: md5(buffer),
        }
    }
}

exports.equals = (l, r) => deepEqual(l, r)
