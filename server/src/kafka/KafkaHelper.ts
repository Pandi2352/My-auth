// KafkaHelper.ts
import { Consumer, Kafka, Producer } from 'kafkajs';
import * as net from 'net';
import * as tls from 'tls';
import { QueueType } from './enum/QueueType';
import { IQueueConfig } from './interfaces/IQueueConfig';
import { IQueueHelper } from './interfaces/IQueueHelper';

export class KafkaHelper implements IQueueHelper {
    private kafka: Kafka;
    private producer: Producer;
    private consumers: Map<string, Consumer> = new Map();

    private _is_producer_connected: boolean = false;

    constructor(private config: IQueueConfig) {
        if (config.queueType !== QueueType.KAFKA || !config.kafka) {
            throw new Error('Invalid configuration for Kafka');
        }

        // Read timeout configuration from environment or use defaults
        const connectionTimeout = parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '30000');
        const requestTimeout = parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '60000');
        const retries = parseInt(process.env.KAFKA_RETRY_RETRIES || '8');
        const initialRetryTime = parseInt(process.env.KAFKA_RETRY_INITIAL_RETRY_TIME || '300');

        const kafka_config: any = {
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            connectionTimeout,
            requestTimeout,
            // TCP KeepAlive to prevent idle connection closure by Kafka broker
            // Broker default connections.max.idle.ms is 9 minutes - keepalive prevents this
            socketFactory: ({ host, port, ssl, onConnect }: any) => {
                const socket = ssl
                    ? tls.connect({ host, port, ...ssl, servername: host }, onConnect)
                    : net.connect({ host, port }, onConnect);

                // Enable TCP keepalive - sends probes to keep connection alive during idle periods
                const keepAliveInterval = parseInt(process.env.KAFKA_KEEPALIVE_INTERVAL_MS || '60000');
                socket.setKeepAlive(true, keepAliveInterval);

                // Disable socket timeout (0 = infinite, connection managed by keepalive probes)
                socket.setTimeout(0);

                console.log(`[KafkaHelper] TCP socket created with keepalive: ${keepAliveInterval}ms for ${host}:${port}`);

                return socket;
            },
            retry: {
                retries,
                initialRetryTime,
                maxRetryTime: 30000,
                multiplier: 2,
                restartOnFailure: async (e: any) => {
                    // Restart on transient errors
                    const transientErrors = [
                        'ETIMEDOUT',
                        'ECONNREFUSED',
                        'ECONNRESET',
                        'ENOTFOUND',
                        'ENETUNREACH',
                        'Connection timeout',
                        'Connection error'
                    ];
                    const isTransient = transientErrors.some(err => e.message?.includes(err));
                    return Promise.resolve(isTransient);
                }
            }
        };

        // Handle SASL authentication
        if (config.kafka.sasl) {
            kafka_config.sasl = config.kafka.sasl;
            // Add SSL configuration if provided
            if (config.kafka.ssl) {
                kafka_config.ssl = config.kafka.ssl;
            }
        } else if (config.kafka.awsMskIam) {
            // AWS MSK IAM authentication
            console.log('[KafkaHelper] Configuring AWS MSK IAM authentication...');
            kafka_config.ssl = config.kafka.ssl || {
                rejectUnauthorized: true
            };
            kafka_config.sasl = {
                mechanism: 'oauthbearer',
                oauthBearerProvider: this.createAwsMskIamProvider(config.kafka.awsMskIam)
            };
            console.log('[KafkaHelper] AWS MSK IAM config:', {
                ssl: kafka_config.ssl,
                mechanism: kafka_config.sasl.mechanism,
                region: config.kafka.awsMskIam.region
            });
        } else {
            // Add SSL configuration if provided (non-SASL case)
            if (config.kafka.ssl) {
                kafka_config.ssl = config.kafka.ssl;
            }
        }

        this.kafka = new Kafka(kafka_config);
        this.producer = this.kafka.producer();
    }

    private createAwsMskIamProvider(awsConfig: { region: string; accessKeyId?: string; secretAccessKey?: string; sessionToken?: string }) {
        return async () => {
            try {
                console.log('[KafkaHelper] Generating AWS MSK IAM token...');
                // Dynamically import AWS SDK modules
                const { generateAuthToken } = await import('aws-msk-iam-sasl-signer-js');

                // Build auth token options
                const authOptions: any = {
                    region: awsConfig.region
                };

                // If credentials are provided in config, use them directly
                // Otherwise, generateAuthToken will use the AWS credential provider chain
                if (awsConfig.accessKeyId && awsConfig.secretAccessKey) {
                    console.log('[KafkaHelper] Using provided AWS credentials');
                    authOptions.accessKeyId = awsConfig.accessKeyId;
                    authOptions.secretAccessKey = awsConfig.secretAccessKey;

                    if (awsConfig.sessionToken) {
                        authOptions.sessionToken = awsConfig.sessionToken;
                    }
                } else {
                    console.log('[KafkaHelper] Using AWS credential provider chain');
                }

                console.log('[KafkaHelper] Auth options:', { region: authOptions.region, hasAccessKey: !!authOptions.accessKeyId });
                const authTokenPayload = await generateAuthToken(authOptions);
                console.log('[KafkaHelper] Token generated successfully');

                return {
                    value: authTokenPayload.token,
                };
            } catch (error) {
                console.error('[KafkaHelper] Error generating AWS MSK IAM token:', error);
                throw error;
            }
        };
    }

    private async ensureProducerConnected(): Promise<void> {
        if (this._is_producer_connected) {
            return;
        }
        await this.producer.connect();
        this._is_producer_connected = true;
        return Promise.resolve(void 0);
    }

    private getTopicName(topic: string): string {
        return topic;
    }

    async add(topic: string, data: any): Promise<void> {

        const topic_name = this.getTopicName(topic);

        await this.ensureProducerConnected();
        await this.producer.send({
            topic: topic_name,
            messages: [{ value: JSON.stringify(data) }],
        });
        return Promise.resolve(void 0);
    }

    async process(
        topic: string,
        callback: (
            topic: string,
            partition: number,
            message: any,
            heartbeat: () => Promise<void>,
            pause: () => () => void,
            commitOffsets: (topic: string, partition: number, offset: string) => Promise<void>
        ) => Promise<void>,
        consumer_options?: any
    ): Promise<void> {
        const topic_name = this.getTopicName(topic);
        if (this.consumers.has(topic_name)) {
            return;
        }

        // Read consumer timeout configuration from environment or use defaults
        const sessionTimeout = parseInt(process.env.KAFKA_SESSION_TIMEOUT || '45000');
        const rebalanceTimeout = parseInt(process.env.KAFKA_REBALANCE_TIMEOUT || '60000');
        const heartbeatInterval = parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL || '5000');

        const consumer = this.kafka.consumer({
            groupId: `${topic_name}-group`,
            sessionTimeout,
            rebalanceTimeout,
            heartbeatInterval,
            maxWaitTimeInMs: 1000,
            retry: {
                retries: 8,
                initialRetryTime: 300,
                maxRetryTime: 30000
            },
            ...consumer_options
        });
        await consumer.connect();
        await consumer.subscribe({ topic: topic_name, fromBeginning: true });

        await consumer.run({
            autoCommit: false,
            eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
                if (message.value) {
                    try {
                        const commitOffsets = async (topic: string, partition: number, offset: string) => {
                            await consumer.commitOffsets([{ topic, partition, offset: `${Number(offset) + 1}` }]);
                        };
                        await callback(
                            topic,
                            partition,
                            message,
                            heartbeat,
                            pause,
                            commitOffsets
                        );
                    } catch (error) {
                        console.error(`Error processing message from topic ${topic}:`, error);
                    }
                }
            },
        });

        consumer.on('consumer.crash', (e) => console.error(`Consumer for topic ${topic} crashed`, e));
        this.consumers.set(topic_name, consumer);
    }

    async ensureTopics(topics: string[]): Promise<void> {
        // Kafka auto-creates topics by default, but we can explicitly create them for better control
        try {
            const admin = this.kafka.admin();
            await admin.connect();

            // Check which topics already exist
            const existingTopics = await admin.listTopics();
            const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));

            if (topicsToCreate.length > 0) {
                await admin.createTopics({
                    topics: topicsToCreate.map(topic => ({
                        topic,
                        numPartitions: 1, // Default partition count
                        replicationFactor: 1, // Default replication factor
                    }))
                });

                console.log(`Kafka topics created: ${topicsToCreate.join(', ')}`);
            } else {
                console.log('All Kafka topics already exist.');
            }

            await admin.disconnect();
        } catch (error) {
            console.warn('Kafka ensureTopics warning:', error);
            // Don't throw error as Kafka can auto-create topics on first message
        }
    }

    async disconnectProducer(): Promise<void> {
        await this.producer.disconnect();
        this._is_producer_connected = false;
        return Promise.resolve(void 0);
    }

    async disconnectConsumers(): Promise<void> {
        await Promise.all(Array.from(this.consumers.values()).map(consumer => consumer.disconnect()));
        return Promise.resolve(void 0);
    }
}