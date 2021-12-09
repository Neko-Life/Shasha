'use strict';

const { mongoServer } = require("../config.json");
const { MongoClient } = require("mongodb");
const dbName = process.dev ? "ShashaDev" : "Shasha";
const dbClient = new MongoClient(process.env.MONGO_HOST || mongoServer, {
    useUnifiedTopology: true,
    directConnection: true,
    appName: dbName
});

dbClient.connect(e => {
    if (e) {
        console.error(e);
        process.exit(1);
    }
    console.log(`Database "${dbName}" connected!`);
});

const database = dbClient.db(dbName);

module.exports = { dbClient, database }