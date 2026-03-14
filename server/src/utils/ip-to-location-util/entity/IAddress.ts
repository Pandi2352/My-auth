import { IGeoPosition } from "./IGeoPosition";

export interface IAddress {
    _id: string;
    id: string;
    formatted: string;
    street_address: string;
    locality: string;
    district: string;
    region: string;
    postal_code: string;
    country: string;
    country_short: string;
    geo_position: IGeoPosition;
    source: string;
    createdTime: Date;
    updatedTime: Date;
    migration_fl: boolean;
}
