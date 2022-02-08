// "use strict";

// const { TimedPunishment } = require("../classes/TimedPunishment");

// const GUILDFNS = {
//     dbLoad: r => {
//         if (!r.eventChannels) r.eventChannels = {};
//         if (!r.settings) r.settings = {};
//         if (!r.cached) r.cached = {};
//         let infractions = new Map(),
//             timedPunishments = new Map();
//         if (r.infractions)
//             for (const U in r.infractions) {
//                 infractions.set(U, r.infractions[U]);
//             }
//         if (r.timedPunishments)
//             for (const U in r.timedPunishments) {
//                 const tr = new TimedPunishment(r.timedPunishments[U]);
//                 tr.setDataDuration(tr.duration.invoked, tr.duration.until);
//                 if (!tr.userID) continue;
//                 timedPunishments.set(tr.userID + "/" + tr.type, tr);
//             }
//         r.infractions = infractions;
//         r.timedPunishments = timedPunishments;
//         return r;
//     }
// }

// module.exports = { GUILDFNS }