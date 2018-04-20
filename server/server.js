const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const config = require("./config").getProperties();
const logging = require("./logging");

logging.installConsoleHandler();

const app = express();
app.set("trust proxy", true);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use("/", express.static(path.join(__dirname, "static")));

app.get("/", express.static(path.join(__dirname, "static/index.html")));

app.use(function(error, req, res, next) {
  res.status(500).type("text").send(`General error: ${error}\n${error.stack}`);
});

/* General 404 handler: */
app.use(function(req, res, next) {
  res.status(404).send("Not found");
});

const server = http.createServer(app);
console.info(`Listening on http://localhost:${config.port}`);
server.listen(config.port);
