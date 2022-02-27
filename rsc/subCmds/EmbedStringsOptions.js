"use strict";

module.exports = [
    {
        type: 3,
        name: "edit",
        description: "Embed in a message to edit",
    },
    {
        type: 3,
        name: "json",
        description: "Use message embed JSON",
    },
    {
        type: 3,
        name: "title",
        description: "Embed title",
    },
    {
        type: 3,
        name: "description",
        description: "Embed description",
    },
    {
        type: 3,
        name: "author-name",
        description: "Embed author name",
    },
    {
        type: 3,
        name: "author-icon",
        description: "Embed author icon URL",
    },
    {
        type: 3,
        name: "author-url",
        description: "Embed author URL",
    },
    {
        type: 3,
        name: "image",
        description: "Embed image",
    },
    {
        type: 3,
        name: "thumbnail",
        description: "Embed thumbnail",
    },
    {
        type: 3,
        name: "color",
        description: "Embed color",
    },
    {
        type: 3,
        name: "footer-text",
        description: "Embed footer text",
    },
    {
        type: 3,
        name: "footer-icon",
        description: "Embed footer icon URL",
    },
    {
        type: 3,
        name: "content",
        description: "Message text content, provide `EMPTY` to clear when editing",
    },
    {
        type: 3,
        name: "url",
        description: "Embed title URL",
    },
    {
        type: 3,
        name: "attachments",
        description: "Embed attachments [URL]",
    },
    {
        type: 3,
        name: "timestamp",
        description: "Embed timestamp",
    },
    {
        type: 7,
        name: "channel",
        description: "Destination channel",
        channel_types: [0, 5, 10, 12, 11, 6],
    },
    {
        type: 3,
        name: "field-name",
        description: "Embed field name",
    },
    {
        type: 3,
        name: "field-text",
        description: "Embed field text",
    },
    {
        type: 3,
        name: "field-inline",
        description: "Set this field inline",
        choices: [
            {
                name: "yes",
                value: "1"
            },
            {
                name: "no",
                value: "0"
            }
        ]
    },
    {
        type: 4,
        name: "edit-field",
        description: "Edit field in this position (number). Make sure to provide `field-property` options",
    },
    {
        type: 3,
        name: "field-datas",
        description: "Field datas message",
    },
    {
        type: 3,
        name: "remove",
        description: "One or more of `a`(author), `f`(fields), `fo`(footer) separated with ` `(space)",
    }
]
