'uuse strict';

const { fetchNeko } = require("nekos-best.js");
const { logDev } = require("../debug");
const lewds = require("./lewds");
const nekoslife = require("./nekoslife");

/**
 * @typedef {"lewds" | "nekosbest" | "nekoslife.sfw" | "nekoslife.nsfw"} ShaAPIs
 * 
 * @param {string} query 
 * @param {ShaAPIs} api
 * @param {boolean} raw - return whole result
 * @param {string} text - nekos.life if require text
 * @returns 
 */
module.exports = async (query, api, raw, text) => {
    logDev(query, api, raw, text);
    if (!api) throw new Error("No api provided");
    let res, APIError;

    function makeErrMes(mes, setErr) {
        if (!setErr && res) return;
        APIError = mes;
    }

    if (api === "nekosbest") {
        const url = await fetchNeko(query);
        if (raw) res = url;
        else res = url.url;
        makeErrMes("Can't fetch image from nekos.best");
    } else if (api === "lewds") {
        res = await lewds.nsfw(query);
        makeErrMes("Oops sorry no room left, can't " + query + " today 😔😔😔");
    } else if (api === "nekoslife.sfw") {
        const url = await nekoslife.sfw[query]({ text });
        if (raw) res = url;
        else res = url.url;
        makeErrMes("Can't fetch sfw from nekos.life");
    } else if (api === "nekoslife.nsfw") {
        const url = await nekoslife.nsfw[query]({ text });
        if (raw) res = url;
        else res = url.url;
        makeErrMes("Can't fetch nsfw from nekos.life");
    }

    return { res, APIError };
}