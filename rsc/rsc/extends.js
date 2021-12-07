// 'use strict';

// const { logDev } = require("../debug");

// const EXTEND_TYPES = {
//     channel: {
//         editSnipe: [],
//         secondLastMessage: null
//     },
//     message: {
//         previousMessage: null
//     }
// }

// /**
//  * 
//  * @param {*} instance 
//  * @param {keyof EXTEND_TYPES} type 
//  */
// module.exports = (instance, type) => {
//     if (!EXTEND_TYPES[type]) throw new TypeError("No extension for type " + type);
//     for (const k in EXTEND_TYPES[type]) {
//         if (instance[k] !== undefined) continue;
//         const res = Reflect.defineProperty(instance, k, {
//             value: EXTEND_TYPES[type][k],
//             configurable: true,
//             enumerable: true
//         });
//         if (!res) throw new Error(`Can't define property ${k} in typeof ${type}`);
//         logDev(`Defined ${k} in typeof ${type}`);
//     }
// }