import { QueueType } from "../enum/QueueType";

export interface IQueueConfig {
    queueType: QueueType;
    bullmq?: {
        connection: string;
    };
    kafka?: {
        clientId: string;
        brokers: string[];
        ssl?: any;
        sasl?: {
            mechanism: string;
            username?: string;
            password?: string;
            oauthBearerProvider?: () => Promise<{ value: string }>;
        };
        awsMskIam?: {
            region: string;
            accessKeyId?: string;
            secretAccessKey?: string;
            sessionToken?: string;
        };
    };
    qstash?: {
        token: string;
        url?: string;
        enableTelemetry?: boolean;
    };
    pubsub?: {
        projectId: string;
        keyFilename?: string;
        credentials?: any;
        flowControl?: {
            maxBytes?: number;
            maxMessages?: number;
        };
    };
}