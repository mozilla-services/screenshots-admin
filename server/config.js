/* Note: do not use ES6 features here, we need to use this module from the build system before translation */
const convict = require("convict");
const envc = require("envc");

// Populate `process.env` with overrides from environment-specific `.env`
// files as a side effect. See `https://npmjs.org/envc` for more info.
envc({booleans: true});

const conf = convict({
  port: {
    doc: "The Screenshots admin server port",
    format: "port",
    default: 10088,
    env: "PORT",
    arg: "port"
  },
  db: {
    user: {
      doc: "The Postgres user",
      format: String,
      default: process.env.USER,
      env: "RDS_USERNAME",
      arg: "db-user"
    },
    password: {
      doc: "The Postgres password",
      format: String,
      default: "",
      env: "RDS_PASSWORD",
      arg: "db-pass"
    },
    host: {
      doc: "The Postgres server host and port",
      format: String,
      default: "localhost:5432",
      env: "RDS_HOSTNAME",
      arg: "db-host"
    },
    dbname: {
      doc: "The Postgres database",
      format: String,
      default: "",
      env: "RDS_NAME",
      arg: "db-name"
    },
    pool: {
      connectionTimeoutMillis: {
        doc: "Number of milliseconds to wait before timing out when connecting a new db client",
        format: "int",
        default: 5000,
        env: "PG_POOL_CLIENT_TIMEOUT",
        arg: "pg-pool-client-timeout"
      },
      idleTimeoutMillis: {
        doc: "Number of milliseconds of idle before a db client is disconnected",
        format: "int",
        default: 10000,
        env: "PG_POOL_CLIENT_IDLE",
        arg: "pg-pool-client-idle"
      },
      max: {
        doc: "Maximum number of clients in the connection pool",
        format: "int",
        default: 10,
        env: "PG_POOL_CLIENT_LIMTI",
        arg: "pg-pool-client-limit"
      }
    }
  },
  log: {
    lint: {
      doc: "Whether to lint usage of log messages",
      format: Boolean,
      default: false,
      env: "LOG_LINT",
      arg: "log-lint"
    },
    level: {
      doc: "Log level to emit",
      format: String,
      default: "info",
      env: "LOG_LEVEL",
      arg: "log-level"
    }
  },
  statsdPrefix: {
    doc: "Prefix for statsd messages, also indicates we should use statsd",
    format: String,
    default: "",
    env: "STATSD_PREFIX",
    arg: "statsd-prefix"
  },
});

conf.validate({ allowed: "strict" });

module.exports = conf;
