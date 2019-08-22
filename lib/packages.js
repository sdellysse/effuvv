
module.exports = async ({ log, state }, defs) => {
    if (!(await packages.updateDatabase())) {
        log.error("pacman database update error. halting packge processing")
        return false
    }

    const defaultDefOpts = {
        external: false,
        without: [],
    }
    const thingy = defs
        .map(def => (
            (typeof(def) === "string")
            ? ([ def, {} ])
            : (def)
        ))
        .map(def => {
            if (true
                && (Array.isArray(def))
                && (def.length === 2)
                && (typeof(def[0]) === "string")
            ) {
                return def
            } else {
                throw new Error("malformed package def")
            }
        })
        .flatMap(
