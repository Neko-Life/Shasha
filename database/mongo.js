'use strict';

const { mongoServer } = require("../config.json");
const { MongoClient, Db } = require("mongodb");
const dbClient = new MongoClient(process.env.MONGO_HOST || mongoServer, {
    useUnifiedTopology: true
});

dbClient.connect(e => {
    if (e) {
        return console.error(e);
    }
    console.log("Database connected!");
});

const database = dbClient.db("Shasha");

/**
 * @type {dbClient: MongoClient, database: Db}
 */
module.exports = { dbClient, database }
