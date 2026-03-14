import { ConfigPathResolver } from "../config-resolver-util/ConfigPathResolver";
import { IAddress } from "./entity/IAddress";
import { IGeoPosition } from "./entity/IGeoPosition";

const { IP2Location } = require("ip2location-nodejs");

export class IPToLocationUtils {

    private static _instance: IPToLocationUtils;

    static get Instance() {
        if (!this._instance) {
            this._instance = new IPToLocationUtils();
        }
        return this._instance;
    }

    private ip2location: any;

    constructor() {
        this.ip2location = new IP2Location();
        const isFreeVersion = (process.env.IP_TO_LOCATION_TYPE || "free") === "free";
        const file_path = isFreeVersion
            ? ConfigPathResolver.Instance.resolveResourcePath("data/location-db/free.BIN")
            : ConfigPathResolver.Instance.resolveResourcePath("data/location-db/pro.BIN");
        this.ip2location.open(file_path);
    }

    private __cache_list: Map<string, IAddress> = new Map();

    findAddressByIp(ip: string): IAddress | null {
        try {
            if (this.__cache_list.has(ip)) {
                return this.__cache_list.get(ip)!;
            }

            if (!this.ip2location) {
                return null;
            }

            const result = this.ip2location.getAll(ip);
            const data = {} as IAddress;
            const geoPosition = {} as IGeoPosition;

            for (const key in result) {
                const value = result[key]?.toString() ?? "";
                if (this.isInvalidValue(value)) {
                    continue;
                }

                switch (key) {
                    case "countryShort":
                        data.country_short = result[key];
                        break;
                    case "countryLong":
                        data.country = result[key];
                        break;
                    case "region":
                        data.region = result[key];
                        break;
                    case "city":
                        data.locality = result[key];
                        break;
                    case "zipCode":
                        data.postal_code = result[key];
                        break;
                    case "district":
                        data.district = result[key];
                        break;
                    case "latitude":
                        const lat = Number(result[key]);
                        if (!isNaN(lat)) {
                            geoPosition.lat = lat;
                        }
                        break;
                    case "longitude":
                        const lng = Number(result[key]);
                        if (!isNaN(lng)) {
                            geoPosition.lng = lng;
                        }
                        break;
                }
            }

            if (geoPosition.lat !== undefined && geoPosition.lng !== undefined) {
                data.geo_position = geoPosition;
            }

            data.source = "ip2location";
            data.formatted = this.buildFormattedAddress(data);
            data.createdTime = new Date();
            data.updatedTime = new Date();

            this.__cache_list.set(ip, data);
            return data;
        } catch (e) {
            console.error("IPToLocationUtils.findAddressByIp error:", e);
            return null;
        }
    }

    clearCache(): void {
        this.__cache_list.clear();
    }

    private isInvalidValue(value: string): boolean {
        return value.startsWith("This method is not applicable")
            || value.startsWith("MISSING_FILE")
            || value.startsWith("?")
            || value.startsWith("-")
            || value === "";
    }

    private buildFormattedAddress(data: IAddress): string {
        const parts: string[] = [];
        if (data.street_address) parts.push(data.street_address);
        if (data.locality) parts.push(data.locality);
        if (data.district) parts.push(data.district);
        if (data.region) parts.push(data.region);
        if (data.postal_code) parts.push(data.postal_code);
        if (data.country) parts.push(data.country);
        return parts.join(", ");
    }
}
