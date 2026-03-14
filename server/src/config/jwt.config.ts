export const jwtConfig = () => ({
    access_secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-me',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refresh_expires_in_remember: process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER || '30d',
    // Numeric versions for JwtSignOptions (seconds)
    access_expires_in_sec: Number(process.env.JWT_ACCESS_EXPIRES_IN_SEC) || 900,       // 15m
    refresh_expires_in_sec: Number(process.env.JWT_REFRESH_EXPIRES_IN_SEC) || 604800,  // 7d
    refresh_expires_in_remember_sec: Number(process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_SEC) || 2592000, // 30d
});
