'use strict';

const { Command } = require("../../classes/Command");
const ListServerCmd = require("./list-server");

module.exports = class FindMutualCmd extends Command {
    constructor(interaction) {
        super(interaction, {
            name: "find-mutual"
        });
    }
    async run(inter, { user }) {
        return new ListServerCmd(inter).run(inter, user?.user);
    }
}