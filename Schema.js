const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27018";
const dbName = "dev";
const client = new MongoClient(url);

const SCHEMA = {
  _id: "Bank",
  _metadata: {
    class_permissions: {},
    indexes: { _id: { _id: 1 } },
  },
  objectId: "string",
  createdAt: "date",
  updatedAt: "date",
};

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");
    const db = client.db(dbName);
    const result = await db.collection("_SCHEMA").insertOne(SCHEMA);

    console.log(result);
  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
