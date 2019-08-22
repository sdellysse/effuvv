const { exists } = require("fs/promises")
const merge = require("deepmerge")
const mkdirp = require("mkdirp-promise")
const { readFile } = require("fs/promises")
const { writeFile } = require("fs/promises")

module.exports.initialState = {
    conf: {
        path: "/effuvv",
        pathname: "/effuvv/effuvv_conf.js",
    },

    record: {
        path: "/.effuvv",
        pathname: "/.effuvv/effuvv_record.json",
        version: 1,
        initialState:
        {
            WARNING: "!!!!!!!!! THIS FILE IS SYSTEM-GENERATED. DO NOT HAND EDIT !!!!!!!!!",
            version: 1,
            files: {},
            packages: {},
            services: [],
            usernames: [],
        }
    },

    changes: {
        files: [],
        packages: {
            added: {},
            removed: {},
            updated: {},
        },
        users: {
            added: {},
            removed: {},
            updated: {},
        },
        services: {
            enabled: {},
            disabled: {},
            status: {},
            restarted: {},
        },
    },
}

exports.ensureSetup = async (state) => {
    await mkdirp(state.record.path)

    if (! (await exists(state.record.pathname)) ) {
        await writeFile(JSON.stringify(state.record.initialState))
    }
}

exports.record = {
    get: async (state) => {
        const content = JSON.parse(await readFile(state.record.pathname))
        if (content.version !== state.record.version) {
            throw new Error("record version not expected")
        }

        return content
    },

    set: async(state, content) => {
        await writeFile(state.record.pathname, JSON.stringify(content))
    },

    use: async (state, fn) => {
        const oldContent = await exports.record.get(state)
        const newContent = await fn(oldContent)
        if ((newContent !== undefined) && (newContent !== oldContent)) {
            await exports.record.set(state, newContent)
        }
    }
}

exports.changes = {
    file: {
        touch: (state, pathname) => ({
            ...state,
            changes: {
                ...state.changes,
                files: state.changes.files
                    .filter(pn => pathname !== pn)
                    .concat([ pathname ])
                ,
            },
        }),
    },

    packages: {
        added: (state, name, version) => merge(state, {
            changes: {
                packages: {
                    added: {
                        [name]: version,
                    },
                },
            },
        }),

        removed: (state, name, version) => merge(state, {
            changes: {
                packages: {
                    removed: {
                        [name]: version,
                    },
                },
            },
        }),

        updated: (state, name, from, to) => merge(state, {
            changes: {
                packages: {
                    updated: {
                        [name]: { from, to },
                    },
                },
            },
        }),
    },

    users: {
        // TODO
    },

    services: {
        // TODO
    },
}
