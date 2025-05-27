const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const dbo = require('../db/conn');

const port = process.env.PORT || 5000;

// Connect to database before starting the server
dbo.connectToServer().then((success) => {
  if (!success) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}).catch(err => {
  console.error('Error starting server:', err);
  process.exit(1)
});
