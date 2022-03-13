"use strict";

let nekosBest = require("./nekos-best.js");
const { logDev } = require("../debug");
const lewds = require("./lewds");
const nekoslife = require("./nekoslife");
const { join } = require("path");
const { mkdirSync, readdirSync, createWriteStream } = require("fs");
const { default: axios } = require("axios");

/**
 * @typedef {"lewds.api" | "nekos.best" | "nekos.life.sfw" | "nekos.life.nsfw"} ShaAPIs
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

    if (api === "nekos.best") {
        if (nekosBest === null)
            nekosBest = require("./nekos-best.js");
        const url = await nekosBest.fetchRandom(query);
        // if (url.source_url) url.source_url = decodeURIComponent(url.source_url);
        if (raw) res = url;
        else res = url.results[0].url;
        makeErrMes("Can't fetch image from nekos.best");
        save(join(__dirname, "../../nekosBest"), url.results[0].url, url.data);
    } else if (api === "lewds.api") {
        const get = await lewds.nsfw(query);
        res = get.result || get;
        if (get.error !== "False")
            makeErrMes("Oops sorry no room left, can't " + query + " today 😔😔😔");
    } else if (api === "nekos.life.sfw") {
        const url = await nekoslife.sfw[query]({ text });
        if (raw) res = url;
        else res = url.url;
        makeErrMes("Can't fetch sfw from nekos.life");
    } else if (api === "nekos.life.nsfw") {
        const url = await nekoslife.nsfw[query]({ text });
        if (raw) res = url;
        else res = url.url;
        makeErrMes("Can't fetch nsfw from nekos.life");
    }

    return { res, APIError };
}

async function save(path, url) {
    if (!path || !url) return;
    let listF;
    const splitted = url.split("/");
    const dir = path + "/" + splitted[splitted.length - 3] + splitted[splitted.length - 2];
    try { listF = readdirSync(dir); } catch { mkdirSync(dir, { recursive: true }); }
    const name = splitted[splitted.length - 1];
    if (listF?.includes(name)) return;
    const data = await axios.get(url, { headers: { "User-Agent": "nekos-best.js / 5.0.0" }, responseType: "stream" });
    if (!data.data) return;
    data.data.pipe(createWriteStream(dir + "/" + name));
}
