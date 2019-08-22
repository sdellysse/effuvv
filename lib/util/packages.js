exports.update = async () => {
    try {
        await exec(`pacman -Syy`)
        return true
    } catch (_e) {
        return false
    }
}

exports.all = async () => (await exec("pacman -Q"))
    .stdout
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length)
    .map(line => {
        const [ name, version ] = line.split(" ")
        return { name, version }
    })
    .reduce(
        (acc, { name, version }) => ({ ...acc, [name]: version }),
        {}
    )
