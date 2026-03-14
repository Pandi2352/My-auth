export interface EmailConfig {
    provider: string;
    host_name: string;
    host_port: number;
    client_id?: string;
    client_secret?: string;
    from: string;
}
