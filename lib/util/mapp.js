"use strict";

module.exports = async (list, iterator) => (await Promise.all(list.map(iterator)));
