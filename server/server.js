const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const config = require("./config").getProperties();
const logging = require("./logging");
const db = require("./db");
const { URL } = require("url");

// Despite what someone might query, this is the fewest number of domains
// we'll return when aggregating:
const ABSOLUTE_MINIMUM_TOP_DOMAINS = 100;

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

/** Error-catching wrapper for our handlers */
function wrap(func) {
  return function(req, res, ...args) {
    let result = func(req, res, ...args);
    result.catch((error) => {
      res.status(500).send(`Error: ${error}\n${error.stack}`);
      console.error("Error:", error);
      console.error(error.stack);
    });
  };
}

/** Gets a shotId, given a full shot URL, a shot ID, or an image URL */
async function shotIdFromTerm(term) {
  term = term.replace(/^https?:\/\/[^/]+/i, "");
  if (term.startsWith("/images")) {
    let imageId = term.replace(/^\/images\/+/, "");
    // Then it's a link to an image, so we have to look up the image...
    let rows = await db.select(`
      SELECT shotid
      FROM images
      WHERE id = $1
    `, [imageId]);
    if (!rows.length) {
      return null;
    }
    term = rows[0].shotid;
  }
  term = term.replace(/^\/+/, "");
  return term;
}

app.get("/lookup-shot", wrap(async (req, res) => {
  let shotId = await shotIdFromTerm(req.query.term);
  if (!shotId) {
    res.status(404).send("No shot or image found");
    return;
  }
  let rows = await db.select(`
    SELECT id, deviceid, created, value, url, expire_time, deleted, title, block_type
    FROM data
    WHERE id = $1
  `, [shotId]);
  if (!rows.length) {
    res.status(404).send("No shot found");
    return;
  }
  let row = rows[0];
  let json = null;
  if (row.value) {
    json = JSON.parse(row.value);
  }
  res.send({
    shotId: row.id,
    deviceId: row.deviceid,
    created: row.created,
    json,
    url: row.url,
    expire_time: String(row.expire_time),
    deleted: row.deleted,
    title: row.title,
    block_type: row.block_type,
  });
}));

app.get("/lookup-device", wrap(async (req, res) => {
  let deviceId = req.query.deviceId;
  let rows = await db.select(`
    SELECT id, accountid, last_addon_version, last_login, created, session_count
    FROM devices
    WHERE id = $1
  `, [deviceId]);
  if (!rows.length) {
    res.status(404).send("Not found");
    return;
  }
  let row = rows[0];
  let shots = await db.select(`
    SELECT id, created, title, url, block_type
    FROM data
    WHERE deviceid = $1
  `, [deviceId]);
  let shotCount = shots.length;
  shots = shots.map(row => {
    return {
      id: row.id,
      created: String(row.created),
      title: row.title,
      url: row.url,
      block_type: row.block_type,
    };
  });
  res.send({
    deviceId,
    accountId: row.accountid,
    last_addon_version: row.last_addon_version,
    last_login: row.last_login,
    created: String(row.created),
    session_count: row.session_count,
    shotCount,
    shots,
  });
}));

app.post("/block-device", wrap(async (req, res) => {
  let deviceId = req.body.deviceId;
  if (!deviceId) {
    res.status(404).send("Not found");
    return;
  }
  res.status(500).send("block-device is not yet implemented");
}));

app.post("/block-shot", wrap(async (req, res) => {
  let shotId = await shotIdFromTerm(req.body.term);
  let reason = req.body.reason; // Could be none, dmca, usererror, illegal, illegal-quaratine
  if (!shotId) {
    res.status(404).send("Not found");
    return;
  }
  if (!["none", "dmca", "usererror"].includes(reason)) {
    res.status(400).send("Bad block reason");
    return;
  }
  let rows = await db.select(`
    SELECT id
    FROM data
    WHERE id = $1
  `, [shotId]);
  if (!rows.length) {
    res.send(404).send("Not found");
    return;
  }
  await db.transaction(async (client) => {
    if (reason === "usererror") {
      await db.queryWithClient(client, `
        UPDATE data
        SET block_type = 'dmca', expire_time = NOW()
        WHERE id = $1
      `, [shotId]);
    } else if (reason === "none") {
      await db.queryWithClient(client, `
        UPDATE data
        SET block_type = 'none'
        WHERE id = $1
      `, [shotId]);
    } else {
      await db.queryWithClient(client, `
        UPDATE data
        SET block_type = 'dmca'
        WHERE id = $1
      `, [shotId]);
    }
  });
  res.send(shotId);
}));

app.post("/query-top-domains", wrap(async (req, res) => {
  let {includeBeta, startDate, endDate, numberOfDomains, requiredDomains} = req.body;
  if (requiredDomains < ABSOLUTE_MINIMUM_TOP_DOMAINS) {
    res.status(400).send("No less than 100 domains are allowed");
    return;
  }
  let channelRestriction = "firefox_channel = 'nightly'";
  if (includeBeta) {
    channelRestriction = `(${channelRestriction} OR firefox_channel = 'beta')`;
  }
  let rows = await db.select(`
    SELECT
      url AS origin,
      COUNT(*) AS counter
    FROM data
    WHERE
      ${channelRestriction}
      AND created >= $1::DATE
      AND created <= $2::DATE
    GROUP BY origin
    HAVING COUNT(*) >= $3
    ORDER BY COUNT(*) DESC
    LIMIT $4;
  `, [startDate, endDate, requiredDomains, numberOfDomains]);
  let topDomains = rows.map((r) => {
    let origin = r.origin;
    let domain;
    if (!origin) {
      domain = "unset";
    } else {
      try {
        domain = (new URL(origin)).hostname;
      } catch (e) {
        domain = "invalid";
      }
    }
    return {domain, count: parseInt(r.counter, 10)};
  });
  res.send({topDomains});
}));

// Monitoring endpoint. Note version.json is generated by CI.
app.use("/__version__", express.static(path.join(__dirname, "version.json")));

// Monitoring endpoint. Verifies this app is up and accessible.
app.get("/__lbheartbeat__", function(req, res) {
  res.sendStatus(200);
});

// Monitoring endpoint. Verifies this app is up and can connect to the database.
app.get("/__heartbeat__", async function(req, res) {
  try {
    await db.select(`SELECT value FROM property WHERE key = 'patch'`);
    res.sendStatus(200);
  } catch (ex) {
    res.sendStatus(500);
  }
});

/* General 404 handler: */
app.use(function(req, res, next) {
  res.status(404).send("Not found");
});

const server = http.createServer(app);
console.info(`Listening on http://localhost:${config.port}`);
server.listen(config.port);
