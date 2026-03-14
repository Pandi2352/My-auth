import { EmailAttachment } from "./EmailAttachment";
import { EmailConfig } from "./EmailConfig";

export interface CommonEmailSendEntity {
    email_config: EmailConfig;
    from?: string;
    from_name?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
    reply_to?: string;
}
