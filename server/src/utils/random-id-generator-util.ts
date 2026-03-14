import * as uuid from "uuid";
export class RandomNumberGenerator {
    static getRandomNumber(length: number = 6): string {
        let paddedValue = "1".padEnd(length, "0");
        let paddedMaxValue = "8".padEnd(length, "9");
        // genrate given n digit random number
        var number = Math.floor(Math.random() * Number(paddedMaxValue)) + Number(paddedValue);
        return number.toString();
    }
    static getUniqueId(): string {
        return uuid.v4();
    }
}