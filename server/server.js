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

app.get("/lookup-shot", (req, res) => {
  let term = req.query.term;
  res.send({
    shotId: "a-shot-id",
    deviceId: "a-device-id",
    title: "A shot title",
    created: String(new Date()),
    json: {sampleJson: "something"},
  });
});

app.get("/lookup-device", (req, res) => {
  let deviceId = req.query.deviceId;
  if (!deviceId) {
    res.status(404).send("Not found");
    return;
  }
  res.send({
    deviceId,
    created: String(new Date()),
    shotCount: 5,
    shots: [
      {
        id: "a-shot-id",
        title: "A shot title",
        created: String(new Date()),
      }
    ]
  });
});

app.post("/block-device", (req, res) => {
  let deviceId = req.body.deviceId;
  if (!deviceId) {
    res.status(404).send("Not found");
    return;
  }
  res.send("OK");
});

app.post("/block-shot", (req, res) => {
  let term = req.body.term;
  let reason = req.body.reason; // Could be dmca, usererror, illegal, illegal-quaratine
  if (!term) {
    res.status(404).send("Not found");
    return;
  }
  res.send("a-shot-id");
});

/* General 404 handler: */
app.use(function(req, res, next) {
  res.status(404).send("Not found");
});

const server = http.createServer(app);
console.info(`Listening on http://localhost:${config.port}`);
server.listen(config.port);
