const fs = require("fs");
const path = require("path");

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, meta = {}) {
    const logEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta,
    };

    const logString = JSON.stringify(logEntry) + "\n";

    // Console output
    const coloredMessage = this.getColoredMessage(level, message);
    console.log(coloredMessage);

    // File output
    const logFile = path.join(
      this.logDir,
      `${new Date().toISOString().split("T")[0]}.log`,
    );
    fs.appendFileSync(logFile, logString);
  }

  getColoredMessage(level, message) {
    const colors = {
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      debug: "\x1b[36m", // Cyan
    };
    const reset = "\x1b[0m";
    return `${colors[level] || colors.info}[${level.toUpperCase()}]${reset} ${message}`;
  }

  info(message, meta) {
    this.log("info", message, meta);
  }

  warn(message, meta) {
    this.log("warn", message, meta);
  }

  error(message, meta) {
    this.log("error", message, meta);
  }

  debug(message, meta) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, meta);
    }
  }
}

module.exports = new Logger();
