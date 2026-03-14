export const databaseConfig = () => {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGODB_DB_NAME || "nestjs_app";

    return {
        uri: `${uri}/${dbName}`,
        autoIndex: process.env.NODE_ENV !== "production",
    };
};
