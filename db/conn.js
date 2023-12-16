require('dotenv').config();


const { MongoClient } = require("mongodb");
const Db = process.env.API_URI
const client = new MongoClient(Db, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});
 
var _db;


module.exports = {
    connectToServer: async function (callback) {
  
      try {
        await client.connect();
      } catch (e) {
        console.error(e);
      }
  
      _db = client.db("foodBasket");

      return (_db === undefined ? false : true);
    },
    getDb: function () {
      return _db;
    },
  };