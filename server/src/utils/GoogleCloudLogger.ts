import * as winston from "winston";

export class GoogleCloudLogger {

    private static _instance: GoogleCloudLogger;

    static get Instance() {
        if (!this._instance) {
            this._instance = new GoogleCloudLogger();
        }
        return this._instance;
    }

    loggingWinston: winston.transport;

    constructor() {
        const { LoggingWinston } = require("@google-cloud/logging-winston");
        this.loggingWinston = new LoggingWinston({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
            logName: process.env.GOOGLE_CLOUD_LOG_NAME || "application-log",
        });
    }
}
