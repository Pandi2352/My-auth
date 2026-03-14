import * as nodemailer from "nodemailer";
import { TransportOptions } from "nodemailer";
import { HttpStatus } from "../reponseUtils/httpStatus";
import { ErrorEntity } from "../reponseUtils/ErrorEntity";
import { CommonEmailSendEntity } from "./entity/CommonEmailSendEntity";

export class SMTPEmailer {

    private static _instance: SMTPEmailer;

    static get Instance() {
        if (!this._instance) {
            this._instance = new SMTPEmailer();
        }
        return this._instance;
    }

    async sendEmail(commonEmailSendEntity: CommonEmailSendEntity): Promise<nodemailer.SentMessageInfo> {
        const config = commonEmailSendEntity.email_config;

        if (!config) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: "invalid_request",
                error_description: "email config not found",
            });
        }

        if (!config.host_name) {
            throw new ErrorEntity({
                http_code: HttpStatus.BAD_REQUEST,
                error: "invalid_request",
                error_description: `host_name not found for ${config.provider}`,
            });
        }

        const transportOptions: TransportOptions = {
            host: config.host_name,
            port: config.host_port || 587,
            secure: config.host_port === 465,
            auth: config.client_id
                ? {
                    user: config.client_id,
                    pass: config.client_secret,
                }
                : undefined,
        } as TransportOptions;

        const transporter = nodemailer.createTransport(transportOptions);

        let fromEmail = commonEmailSendEntity.from || config.from;

        if (commonEmailSendEntity.from_name) {
            fromEmail = `${commonEmailSendEntity.from_name} <${fromEmail}>`;
        }

        const mailOptions: nodemailer.SendMailOptions = {
            from: fromEmail,
            to: commonEmailSendEntity.to,
            cc: commonEmailSendEntity.cc,
            bcc: commonEmailSendEntity.bcc,
            subject: commonEmailSendEntity.subject,
            html: commonEmailSendEntity.html,
            text: commonEmailSendEntity.text,
            attachments: commonEmailSendEntity.attachments || [],
            replyTo: commonEmailSendEntity.reply_to,
        };

        const response = await transporter.sendMail(mailOptions);
        console.log("Email sent:", response.messageId);
        return response;
    }
}
