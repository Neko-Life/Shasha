'use strict';

module.exports = {
    name: "util",
    description: "Anything utility",
    options: [
        {
            type: 1,
            name: "translate",
            description: "Translate from alien languages",
            options: [
                {
                    type: 3,
                    name: "text",
                    description: "Text to translate",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "lang-to",
                    description: "To this language (default to `english`)",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "lang-from",
                    description: "From this language (if you want to specify the source language)",
                    autocomplete: true,
                },
                {
                    type: 3,
                    name: "message",
                    description: "Translate this message: `<link>`, `<Id>`, `l` or `last`",
                }
            ]
        },
        {
            type: 1,
            name: "define",
            description: "Define a word or term. Powered by Urban Dictionary",
            options: [
                {
                    type: 3,
                    name: "term",
                    description: "Term to define",
                    autocomplete: true,
                }
            ]
        }
    ]
}