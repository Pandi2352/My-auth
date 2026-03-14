import * as path from "path";

export class ConfigPathResolver {

    private static _instance: ConfigPathResolver;

    static get Instance() {
        if (!this._instance) {
            this._instance = new ConfigPathResolver();
        }
        return this._instance;
    }

    private _basePath: string;

    constructor() {
        this._basePath = process.env.CONFIG_BASE_PATH || process.cwd();
    }

    resolvePath(relativePath: string): string {
        return path.resolve(this._basePath, relativePath);
    }

    resolveResourcePath(relativePath: string): string {
        return path.resolve(this._basePath, relativePath);
    }
}
