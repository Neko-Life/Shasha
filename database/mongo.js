'use strict';

const { mongoServer } = require("../config.json");
const { MongoClient } = require("mongodb");
const dbClient = new MongoClient(mongoServer,{
    useUnifiedTopology: true
});

dbClient.connect(e => {
    if (e) {
        console.error(e);
        return process.exit();
    }
    dbClient.slaveOk();
    console.log("Database connected!");
});

const database = dbClient.db("Shasha");

/**
 * @type {dbClient: MongoClient, database: Db}
 */
module.exports = { dbClient, database }
