const { lstat } = require("fs/promises")
const { readlink } = require("fs/promises")

exports.isSymlink = async (pathname) {
    try {
        (await lstat(pathname)).isSymbolicLink()
    } catch (_e) {
        return false
    }
}

exports.getTarget = readlink
