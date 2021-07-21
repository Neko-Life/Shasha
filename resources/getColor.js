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
        case 'yellow':
            return 'f1e40f';
        case 'orange':
            return 'ff8c00';
        case 'blue':
            return 3447003;
        case 'light blue':
            return '0fffff';
        case 'black':
            return '000000';
        case 'white':
            return 16777214;
        case 'cyan':
            return '0fffff';
        case 'Blue':
            return '00bfff';
        case 'azure':
            return '007fff';
        case 'sapphire':
            return '0f52ba';
        case 'ultramarine':
            return '120a8f';
        case 'wheat':
            return 'f5deb3';
        case 'tan':
            return 'd2b48c';
        case 'rosybrown':
            return 'bc8f8f';
        case 'brown':
            return 'a0522d';
        case 'umber':
            return '826644';
        case 'tea green':
            return 'd0f0c0';
        case 'pale green':
            return '98fb98';
        case 'erin':
            return '00ff40';
        case 'mantis':
            return '74c365';
        case 'dark green':
            return '355e3b';
        case 'khaki':
            return 'c3b091';
        case 'peach':
            return 'faa775';
        case 'coral':
            return 'ff7f50';
        case 'orange':
            return 'ff8c00';
        case 'persimmon':
            return 'b45e06';
        case 'mimi pink':
            return 'ffdae9';
        case 'amaranth':
            return 'f19cbb';
        case 'pink purple':
            return 'e62aed';
        case 'red violet':
            return 'c71585';
        case 'raspberry':
            return 'e30b5c';
        case 'thistle':
            return 'd8bfd8';
        case 'orchid':
            return 'da70d6';
        case 'amethyst':
            return '9966cc';
        case 'purple':
            return '803c9d';
        case 'eminence':
            return '6c3082';
        case 'misty roses':
            return 'ffe4e1';
        case 'pink':
            return 'ffc0cb';
        case 'bright pink':
            return 'ff91a4';
        case 'crimson':
            return 'dc143c';
        case 'dark Red':
            return '8b0000';
        case 'champagne':
            return 'f7e7ce';
        case 'cream':
            return 'fffdd0';
        case 'gold':
            return 'ffd700';
        case 'dark yellow':
            return '999900';
        case 'olive':
            return '808000';
        case 'silver':
            return 'c0c0c0';
        case 'gray':
            return 'a9a9a9';
        case 'dark gray':
            return 808080;
        case 'dim gray':
            return 696969;
        case 'midnight':
            return '000001';
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