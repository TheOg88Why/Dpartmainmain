const fs = require("fs")
const path = require("path")

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

const logger = {
  info: (message, meta = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      ...meta,
    }

    console.log(`[INFO] ${logEntry.timestamp}: ${message}`)

    if (process.env.NODE_ENV === "production") {
      fs.appendFileSync(path.join(logsDir, "app.log"), JSON.stringify(logEntry) + "\n")
    }
  },

  error: (message, error = null, meta = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : null,
      ...meta,
    }

    console.error(`[ERROR] ${logEntry.timestamp}: ${message}`, error)

    if (process.env.NODE_ENV === "production") {
      fs.appendFileSync(path.join(logsDir, "error.log"), JSON.stringify(logEntry) + "\n")
    }
  },

  warn: (message, meta = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      ...meta,
    }

    console.warn(`[WARN] ${logEntry.timestamp}: ${message}`)

    if (process.env.NODE_ENV === "production") {
      fs.appendFileSync(path.join(logsDir, "app.log"), JSON.stringify(logEntry) + "\n")
    }
  },
}

module.exports = logger
