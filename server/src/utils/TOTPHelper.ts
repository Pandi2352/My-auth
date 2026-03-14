var speakeasy = require('speakeasy');
export class TOTPHelper {
    private static _instance: TOTPHelper;

    static get Instance() {
        if (!this._instance) {
            this._instance = new TOTPHelper();
        }
        return this._instance;
    }
    generateWithLength(): string {
        var secret = speakeasy.generateSecret({
            length: 20
        });
        return secret.base32;
    }
    generate(): string {
        var secret = speakeasy.generateSecret({
        });
        return secret.base32;
    }

    generateSecretObj(): string {
        var secret_obj = speakeasy.generateSecret({
        });
        return secret_obj;
    }

    validate(token: string, key: string): boolean {
        var verified = speakeasy.totp.verify({
            secret: key,
            encoding: 'base32',
            token: token,
        });
        return verified;
    }

    validateWithWindow(token: string, key: string, window: number): boolean {
        var verified_with_window = speakeasy.totp.verify({
            secret: key,
            encoding: 'base32',
            token: token,
            window: window
        });
        return verified_with_window;
    }
    getTOTP(key: string): string {
        var token = speakeasy.totp({
            secret: key,
            encoding: 'base32'
        });
        return token;
    }

    createOTPAuthURL(secret: string, label: string, encoding: string, issuer: string) {
        const otp_auth_url = speakeasy.otpauthURL({ secret, label, encoding, issuer });
        return otp_auth_url;
    }
}
