require("dotenv").config();

const { MongoClient } = require("mongodb");

const Db = process.env.ATLAS_URI;
// process.env.API_URI ||
const client = new MongoClient(Db, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

let _db;

module.exports = {
  async connectToServer() {
    try {
      await client.connect();
    } catch (e) {
      console.error(e);
    }

    _db = client.db("foodBasket");

    return _db !== undefined;
  },
  getDb() {
    return _db;
  },
};
