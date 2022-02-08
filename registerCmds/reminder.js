"use strict";

module.exports = {
    name: "reminder",
    description: "Reminder for your super tight schedules",
    options: [
        {
            type: 1,
            name: "remind",
            description: "I can remind you about your gf birthday",
            options: [
                {
                    type: 3,
                    name: "about",
                    description: "`my gf 69th birthday`",
                    required: true
                },
                {
                    type: 3,
                    name: "at",
                    description: "Provide somethin like `November 29, 2069 11:04:20 PM` or `in 69m420s`",
                    required: true
                },
                {
                    type: 3,
                    name: "timezone",
                    description: "Your gf timezone. Default to Greenland",
                    autocomplete: true,
                },
                {
                    type: 7,
                    name: "channel",
                    description: "Send your reminder here",
                    channel_types: [0, 5, 10, 12, 11, 6],
                }
            ]
        }
    ]
}