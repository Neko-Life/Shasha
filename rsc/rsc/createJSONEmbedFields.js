'use strict';

// Valid argument looks like "field[index][props]" in camelCase - field1Name
module.exports = async (inter, fields, minus = 0) => {
    await inter.deferReply();
    let fieldsArr = [];
    for (const U in fields) {
        const iN = U.slice("field".length);
        const i = iN.match(/^\d+/);
        const N = iN.slice(i[0].length);
        const index = parseInt(i[0], 10) - 1 - minus;
        if (!fieldsArr[index]) fieldsArr[index] = {};
        if (N === "Name") fieldsArr[index].n = fields[U].value;
        else if (N === "Text") fieldsArr[index].v = fields[U].value;
        else if (N === "Inline" && ["yes", "true", "y", "1"]
            .includes(fields[U].value.trim().toLowerCase()))
            fieldsArr[index].i = 1;
    }
    const ret = [];
    for (const U of fieldsArr) {
        if (!U) continue;
        ret.push(U);
    }
    return ret;
}