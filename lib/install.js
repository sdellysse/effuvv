"use strict"

const actuallyExists = require("./util/actually-exists.js")
const exactCopy = require("./util/exact-copy.js")

const getRecordPathOf = (state, pathname) =>

module.exports = async ({ logger, state }, pathnames) => Bluebird.resolve(pathnames)
    .map(async (pathname) => ({
        pathname,
        indexPrint: (await fingerprints.generate(pathname)),
        stagePrint: (await fingerprints.generate(`${ state.record.path }/${ pathname }`)),
    }))
    .each(item => {
        if (false) {
        } else if (fingerprints.equal(item.indexPrint, item.stagePrint)) {
            logger.debug(`INSTALL(${ item.pathname }): prints match`)
        } else if (false) {
            ///stuff
        }
    })
