const parseServer = require("parse-server").ParseServer;
const express = require("express");
require("dotenv").config();
const app = express();
const path = require("path");
const port = process.env.port ?? 1337;
/**Parse Server Base Configiration BEGIN **/
const config = {
  databaseURI: process.env.databaseUri || "mongodb+srv://dev:test@cluster0.uv8qiau.mongodb.net/dev?retryWrites=true&w=majority",
  cloud: path.resolve(__dirname, "./cloud/main.js"),
  appId: process.env.appId || "app",
  masterKey: process.env.masterKey || "master",
  restAPIKey: process.env.restAPIKey || "rest",
  serverURL: process.env.serverURL || "http://localhost:1337/parse",
  javascriptKey: process.env.javascriptKey || "jskey",
};
console.log(config);
const api = new parseServer(config);
/**Parse Server Base Configiration END **/
app.use("/parse", api);

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
