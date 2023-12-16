const app = require('./app');

// const express = require("express");


const port = process.env.PORT || 5000;

// app.use(express.json());
// app.use(require("./routes/record"));
// get driver connection

app.listen(port, async () => {
  const dbo = require("../db/conn");

  // perform a database connection when server starts
  await dbo.connectToServer(function (err) {
    if (err) console.error(err);
  });
  console.log(`Server is running on port: ${port}`);
});

