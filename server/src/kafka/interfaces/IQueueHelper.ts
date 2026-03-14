
export interface IQueueHelper {
    add(queueName: string, data: any, jobName?: string): Promise<void>;
    process(
        queueName: string,
        callback: (
            topic: string,
            partition: number,
            message: any,
            heartbeat: () => Promise<void>,
            pause: () => () => void,
            commitOffsets: (topic: string, partition: number, offset: string) => Promise<void>
        ) => Promise<void>,
        consumer_options?: any
    ): void;
    ensureTopics(topics: string[]): Promise<void>;
    disconnectProducer(): Promise<void>;
    disconnectConsumers(): Promise<void>;
}
