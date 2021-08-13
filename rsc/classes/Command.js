'use strict';

class Command {
    /**
     * @param {{name: string, description: string}} data
     */
    constructor(interaction, data) {
        this.interaction = interaction;
        this.name = data.name;
        this.description = data.description;
    }
}

module.exports = { Command }