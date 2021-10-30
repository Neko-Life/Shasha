'use strict';

const { mongoServer } = require("../config.json");
const { MongoClient } = require("mongodb");
const dbClient = new MongoClient(process.env.MONGO_HOST || mongoServer, {
    useUnifiedTopology: true,
    directConnection: true,
    appName: "Shasha"
});

dbClient.connect(e => {
    if (e) {
        console.error(e);
        process.exit(1);
    }
    console.log("Database connected!");
});

const database = dbClient.db("Shasha");

module.exports = { dbClient, database }