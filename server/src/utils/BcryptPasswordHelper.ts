import * as bcrypt from "bcrypt";

export class BcryptPasswordHelper {
    private static _instance: BcryptPasswordHelper;

    static get Instance() {
        if (!this._instance) {
            this._instance = new BcryptPasswordHelper();
        }
        return this._instance;
    }

    private _salt_round = process.env.BCRYPT_SALT_ROUND ? Number(process.env.BCRYPT_SALT_ROUND) : 8;
    async generateBcryptPassword(password: string): Promise<string> {
        const hash_password = await bcrypt.hash(password, this._salt_round);
        return Promise.resolve(hash_password);
    }
    async compareBcryptPassword(password: string, hash: string): Promise<boolean> {
        const hash_password = await bcrypt.compare(password, hash);
        return Promise.resolve(hash_password);
    }
}