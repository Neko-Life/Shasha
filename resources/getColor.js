'use strict';

/**
 * Get color by name
 * @param {String | Number} name - Name of color | Hex | Number
 * @returns {String | Number} Color hex | Color number
 */
module.exports = function getColor(name) {
    if (!name) return;
    if (typeof name === 'number') {
        if (name === 16777215) {
            return 16777214;
        } else {
            return name;
        }
    }
    switch (name) {
        case 'rosy brown':
            return 12357519;
        case 'magenta':
            return 16711935;
        case 'navy blue':
            return 128;
        case 'teal':
            return 32896;
        case 'ruby':
            return 15277667;
        case 'green':
            return '00ff00';
        case 'red':
            return 'ff0000';
        case 'pink':
            return 'ff94f2';
        case 'yellow':
            return 'f1e40f';
        case 'orange':
            return 'ff8c00';
        case 'brown':
            return 'a0522d';
        case 'blue':
            return 3447003;
        case 'light blue':
            return '0fffff';
        case 'cyan':
            return '0fffff';
        case 'purple':
            return '803c9d';
        case 'peach':
            return 'faa775';
        case 'black':
            return '000000';
        case 'white':
            return 16777214;
        default: {
            if (/\D/.test(name)) {
                if (name.startsWith("#")) name = name.slice(1);
                return name;
            } else {
                const n = parseInt(name, 10);
                if (n >= 16777215) return 16777214;
                return n;
            }
        }
    }
}