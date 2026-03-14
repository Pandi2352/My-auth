import UAParser = require("ua-parser-js");

/**
 * UserAgentHelper - Comprehensive User-Agent parsing and device detection utility
 *
 * Provides advanced user agent parsing capabilities including:
 * - Device type detection (mobile, tablet, desktop)
 * - Browser information and version detection
 * - Operating system identification
 * - Bot and crawler detection
 * - Device capabilities and features
 * - Platform-specific checks
 *
 * Uses ua-parser-js library for robust parsing.
 * Singleton pattern ensures single instance across application.
 *
 * @example
 * ```typescript
 * import { UserAgentHelper } from '@skillmine-dev/code-utils';
 *
 * const helper = UserAgentHelper.Instance;
 *
 * // Get device info
 * const info = helper.getDeviceInfo(req.headers['user-agent']);
 *
 * // Check device type
 * if (helper.isMobile(userAgent)) {
 *     // Serve mobile content
 * }
 *
 * // Check browser
 * if (helper.isChrome(userAgent)) {
 *     // Use Chrome-specific features
 * }
 * ```
 */
export class UserAgentHelper {
    private static _instance: UserAgentHelper;

    /**
     * Gets the singleton instance of UserAgentHelper
     *
     * @returns {UserAgentHelper} Singleton instance
     *
     * @example
     * ```typescript
     * const helper = UserAgentHelper.Instance;
     * ```
     */
    static get Instance(): UserAgentHelper {
        if (!this._instance) {
            this._instance = new UserAgentHelper();
        }
        return this._instance;
    }

    // ============================================================================
    // CORE PARSING
    // ============================================================================

    /**
     * Parses user agent string and returns detailed device information
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {IResult} Parsed device information including browser, OS, device, engine, CPU
     *
     * @example
     * ```typescript
     * const info = helper.getDeviceInfo('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...');
     * // {
     * //   browser: { name: 'Mobile Safari', version: '14.0', major: '14' },
     * //   device: { vendor: 'Apple', model: 'iPhone', type: 'mobile' },
     * //   os: { name: 'iOS', version: '14.0' },
     * //   engine: { name: 'WebKit', version: '605.1.15' },
     * //   cpu: { architecture: undefined }
     * // }
     * ```
     */
    getDeviceInfo(user_agent: string): UAParser.IResult {
        const parser = new UAParser.UAParser(user_agent);
        return parser.getResult();
    }

    /**
     * Gets a simplified device information object with common properties
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {Object} Simplified device info
     *
     * @example
     * ```typescript
     * const info = helper.getSimplifiedDeviceInfo(userAgent);
     * // {
     * //   isMobile: true,
     * //   isTablet: false,
     * //   isDesktop: false,
     * //   isBot: false,
     * //   browser: 'Chrome',
     * //   browserVersion: '120.0',
     * //   os: 'Android',
     * //   osVersion: '13',
     * //   device: 'Samsung Galaxy S21'
     * // }
     * ```
     */
    getSimplifiedDeviceInfo(user_agent: string): {
        isMobile: boolean;
        isTablet: boolean;
        isDesktop: boolean;
        isBot: boolean;
        browser: string;
        browserVersion: string;
        os: string;
        osVersion: string;
        device: string;
        deviceType: string;
        deviceVendor: string;
        deviceModel: string;
    } {
        const parsed = this.getDeviceInfo(user_agent);

        return {
            isMobile: this.isMobile(user_agent),
            isTablet: this.isTablet(user_agent),
            isDesktop: this.isDesktop(user_agent),
            isBot: this.isBot(user_agent),
            browser: parsed.browser.name || 'Unknown',
            browserVersion: parsed.browser.version || '',
            os: parsed.os.name || 'Unknown',
            osVersion: parsed.os.version || '',
            device: parsed.device.model || 'Unknown',
            deviceType: parsed.device.type || 'desktop',
            deviceVendor: parsed.device.vendor || '',
            deviceModel: parsed.device.model || ''
        };
    }

    // ============================================================================
    // DEVICE TYPE DETECTION
    // ============================================================================

    /**
     * Checks if the user agent represents a mobile device
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if mobile device
     *
     * @example
     * ```typescript
     * if (helper.isMobile(userAgent)) {
     *     res.redirect('/mobile');
     * }
     * ```
     */
    isMobile(user_agent: string): boolean {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.type === 'mobile';
    }

    /**
     * Checks if the user agent represents a tablet device
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if tablet device
     *
     * @example
     * ```typescript
     * if (helper.isTablet(userAgent)) {
     *     // Serve tablet-optimized layout
     * }
     * ```
     */
    isTablet(user_agent: string): boolean {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.type === 'tablet';
    }

    /**
     * Checks if the user agent represents a desktop/laptop device
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if desktop device
     *
     * @example
     * ```typescript
     * if (helper.isDesktop(userAgent)) {
     *     // Serve full desktop experience
     * }
     * ```
     */
    isDesktop(user_agent: string): boolean {
        const parsed = this.getDeviceInfo(user_agent);
        return !parsed.device.type || parsed.device.type === 'desktop';
    }

    /**
     * Checks if the user agent represents a TV/smartTV device
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if TV device
     *
     * @example
     * ```typescript
     * if (helper.isSmartTV(userAgent)) {
     *     // Serve TV-optimized interface
     * }
     * ```
     */
    isSmartTV(user_agent: string): boolean {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.type === 'smarttv';
    }

    /**
     * Checks if the user agent represents a wearable device
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if wearable device
     *
     * @example
     * ```typescript
     * if (helper.isWearable(userAgent)) {
     *     // Serve minimal wearable interface
     * }
     * ```
     */
    isWearable(user_agent: string): boolean {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.type === 'wearable';
    }

    /**
     * Gets the device type as a string
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Device type: 'mobile', 'tablet', 'desktop', 'smarttv', 'wearable', etc.
     *
     * @example
     * ```typescript
     * const type = helper.getDeviceType(userAgent);
     * console.log(`Device type: ${type}`); // "mobile"
     * ```
     */
    getDeviceType(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.type || 'desktop';
    }

    // ============================================================================
    // BROWSER DETECTION
    // ============================================================================

    /**
     * Gets the browser name
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Browser name (e.g., 'Chrome', 'Firefox', 'Safari')
     *
     * @example
     * ```typescript
     * const browser = helper.getBrowserName(userAgent);
     * console.log(browser); // "Chrome"
     * ```
     */
    getBrowserName(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.browser.name || 'Unknown';
    }

    /**
     * Gets the browser version
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Browser version
     *
     * @example
     * ```typescript
     * const version = helper.getBrowserVersion(userAgent);
     * console.log(version); // "120.0.0.0"
     * ```
     */
    getBrowserVersion(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.browser.version || '';
    }

    /**
     * Gets the browser major version number
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {number} Major version number
     *
     * @example
     * ```typescript
     * const major = helper.getBrowserMajorVersion(userAgent);
     * console.log(major); // 120
     * ```
     */
    getBrowserMajorVersion(user_agent: string): number {
        const parsed = this.getDeviceInfo(user_agent);
        return parseInt(parsed.browser.major || '0', 10);
    }

    /**
     * Checks if the browser is Chrome
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Chrome browser
     *
     * @example
     * ```typescript
     * if (helper.isChrome(userAgent)) {
     *     // Use Chrome-specific features
     * }
     * ```
     */
    isChrome(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'Chrome' || browser === 'Chrome Mobile' || browser === 'Chromium';
    }

    /**
     * Checks if the browser is Firefox
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Firefox browser
     *
     * @example
     * ```typescript
     * if (helper.isFirefox(userAgent)) {
     *     // Firefox-specific handling
     * }
     * ```
     */
    isFirefox(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'Firefox' || browser === 'Firefox Mobile';
    }

    /**
     * Checks if the browser is Safari
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Safari browser
     *
     * @example
     * ```typescript
     * if (helper.isSafari(userAgent)) {
     *     // Safari-specific handling
     * }
     * ```
     */
    isSafari(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'Safari' || browser === 'Mobile Safari';
    }

    /**
     * Checks if the browser is Edge
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Edge browser
     *
     * @example
     * ```typescript
     * if (helper.isEdge(userAgent)) {
     *     // Edge-specific handling
     * }
     * ```
     */
    isEdge(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'Edge' || browser === 'Edge Mobile';
    }

    /**
     * Checks if the browser is Internet Explorer
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if IE browser
     *
     * @example
     * ```typescript
     * if (helper.isIE(userAgent)) {
     *     res.send('Please upgrade your browser');
     * }
     * ```
     */
    isIE(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'IE' || browser === 'IEMobile';
    }

    /**
     * Checks if the browser is Opera
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Opera browser
     *
     * @example
     * ```typescript
     * if (helper.isOpera(userAgent)) {
     *     // Opera-specific handling
     * }
     * ```
     */
    isOpera(user_agent: string): boolean {
        const browser = this.getBrowserName(user_agent);
        return browser === 'Opera' || browser === 'Opera Mini' || browser === 'Opera Mobile';
    }

    // ============================================================================
    // OPERATING SYSTEM DETECTION
    // ============================================================================

    /**
     * Gets the operating system name
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} OS name (e.g., 'Windows', 'iOS', 'Android', 'Mac OS')
     *
     * @example
     * ```typescript
     * const os = helper.getOSName(userAgent);
     * console.log(os); // "Android"
     * ```
     */
    getOSName(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.os.name || 'Unknown';
    }

    /**
     * Gets the operating system version
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} OS version
     *
     * @example
     * ```typescript
     * const version = helper.getOSVersion(userAgent);
     * console.log(version); // "13.0"
     * ```
     */
    getOSVersion(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.os.version || '';
    }

    /**
     * Checks if the OS is Windows
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Windows OS
     *
     * @example
     * ```typescript
     * if (helper.isWindows(userAgent)) {
     *     // Windows-specific code
     * }
     * ```
     */
    isWindows(user_agent: string): boolean {
        const os = this.getOSName(user_agent);
        return os === 'Windows' || os === 'Windows Phone' || os === 'Windows Mobile';
    }

    /**
     * Checks if the OS is macOS
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if macOS
     *
     * @example
     * ```typescript
     * if (helper.isMacOS(userAgent)) {
     *     // macOS-specific code
     * }
     * ```
     */
    isMacOS(user_agent: string): boolean {
        const os = this.getOSName(user_agent);
        return os === 'Mac OS';
    }

    /**
     * Checks if the OS is iOS
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if iOS
     *
     * @example
     * ```typescript
     * if (helper.isIOS(userAgent)) {
     *     // iOS-specific code
     * }
     * ```
     */
    isIOS(user_agent: string): boolean {
        const os = this.getOSName(user_agent);
        return os === 'iOS';
    }

    /**
     * Checks if the OS is Android
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Android
     *
     * @example
     * ```typescript
     * if (helper.isAndroid(userAgent)) {
     *     // Android-specific code
     * }
     * ```
     */
    isAndroid(user_agent: string): boolean {
        const os = this.getOSName(user_agent);
        return os === 'Android';
    }

    /**
     * Checks if the OS is Linux
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Linux
     *
     * @example
     * ```typescript
     * if (helper.isLinux(userAgent)) {
     *     // Linux-specific code
     * }
     * ```
     */
    isLinux(user_agent: string): boolean {
        const os = this.getOSName(user_agent);
        return os === 'Linux' || os === 'Ubuntu' || os === 'Debian' || os === 'Fedora';
    }

    // ============================================================================
    // BOT DETECTION
    // ============================================================================

    /**
     * Checks if the user agent is a bot/crawler
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if bot/crawler
     *
     * @example
     * ```typescript
     * if (helper.isBot(userAgent)) {
     *     // Return cached/simplified response
     * }
     * ```
     */
    isBot(user_agent: string): boolean {
        const ua = user_agent.toLowerCase();
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'crawling',
            'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
            'yandexbot', 'facebookexternalhit', 'linkedinbot', 'embedly',
            'twitterbot', 'slackbot', 'telegrambot', 'whatsapp',
            'pingdom', 'monitor', 'checker', 'validator'
        ];

        return botPatterns.some(pattern => ua.includes(pattern));
    }

    /**
     * Checks if the user agent is a search engine bot
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if search engine bot
     *
     * @example
     * ```typescript
     * if (helper.isSearchBot(userAgent)) {
     *     // Allow indexing
     * }
     * ```
     */
    isSearchBot(user_agent: string): boolean {
        const ua = user_agent.toLowerCase();
        const searchBots = [
            'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'
        ];

        return searchBots.some(bot => ua.includes(bot));
    }

    /**
     * Gets the bot name if it's a known bot
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string | null} Bot name or null if not a bot
     *
     * @example
     * ```typescript
     * const bot = helper.getBotName(userAgent);
     * if (bot) console.log(`Bot detected: ${bot}`);
     * ```
     */
    getBotName(user_agent: string): string | null {
        const ua = user_agent.toLowerCase();
        const bots: Record<string, string> = {
            'googlebot': 'Googlebot',
            'bingbot': 'Bingbot',
            'slurp': 'Yahoo Slurp',
            'duckduckbot': 'DuckDuckBot',
            'baiduspider': 'Baiduspider',
            'yandexbot': 'YandexBot',
            'facebookexternalhit': 'Facebook Bot',
            'twitterbot': 'Twitterbot',
            'linkedinbot': 'LinkedInBot'
        };

        for (const [key, name] of Object.entries(bots)) {
            if (ua.includes(key)) {
                return name;
            }
        }

        return this.isBot(user_agent) ? 'Unknown Bot' : null;
    }

    // ============================================================================
    // DEVICE VENDOR AND MODEL
    // ============================================================================

    /**
     * Gets the device vendor/manufacturer
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Device vendor (e.g., 'Apple', 'Samsung', 'Google')
     *
     * @example
     * ```typescript
     * const vendor = helper.getDeviceVendor(userAgent);
     * console.log(vendor); // "Apple"
     * ```
     */
    getDeviceVendor(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.vendor || '';
    }

    /**
     * Gets the device model
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Device model (e.g., 'iPhone', 'Galaxy S21')
     *
     * @example
     * ```typescript
     * const model = helper.getDeviceModel(userAgent);
     * console.log(model); // "iPhone"
     * ```
     */
    getDeviceModel(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.device.model || '';
    }

    /**
     * Checks if the device is from Apple
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if Apple device
     *
     * @example
     * ```typescript
     * if (helper.isAppleDevice(userAgent)) {
     *     // Apple-specific features
     * }
     * ```
     */
    isAppleDevice(user_agent: string): boolean {
        const vendor = this.getDeviceVendor(user_agent);
        const os = this.getOSName(user_agent);
        return vendor === 'Apple' || os === 'iOS' || os === 'Mac OS';
    }

    /**
     * Checks if the device is iPhone
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if iPhone
     *
     * @example
     * ```typescript
     * if (helper.isIPhone(userAgent)) {
     *     // iPhone-specific UI
     * }
     * ```
     */
    isIPhone(user_agent: string): boolean {
        const model = this.getDeviceModel(user_agent);
        const ua = user_agent.toLowerCase();
        return model === 'iPhone' || ua.includes('iphone');
    }

    /**
     * Checks if the device is iPad
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if iPad
     *
     * @example
     * ```typescript
     * if (helper.isIPad(userAgent)) {
     *     // iPad-specific layout
     * }
     * ```
     */
    isIPad(user_agent: string): boolean {
        const model = this.getDeviceModel(user_agent);
        const ua = user_agent.toLowerCase();
        return model === 'iPad' || ua.includes('ipad');
    }

    // ============================================================================
    // RENDERING ENGINE
    // ============================================================================

    /**
     * Gets the browser rendering engine name
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Engine name (e.g., 'WebKit', 'Blink', 'Gecko')
     *
     * @example
     * ```typescript
     * const engine = helper.getEngineName(userAgent);
     * console.log(engine); // "Blink"
     * ```
     */
    getEngineName(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.engine.name || '';
    }

    /**
     * Gets the rendering engine version
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Engine version
     *
     * @example
     * ```typescript
     * const version = helper.getEngineVersion(userAgent);
     * console.log(version); // "537.36"
     * ```
     */
    getEngineVersion(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.engine.version || '';
    }

    // ============================================================================
    // FEATURE DETECTION & CAPABILITIES
    // ============================================================================

    /**
     * Checks if the device/browser likely supports touch
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if likely supports touch
     *
     * @example
     * ```typescript
     * if (helper.isTouchDevice(userAgent)) {
     *     // Enable touch gestures
     * }
     * ```
     */
    isTouchDevice(user_agent: string): boolean {
        return this.isMobile(user_agent) || this.isTablet(user_agent);
    }

    /**
     * Gets CPU architecture if available
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} CPU architecture (e.g., 'amd64', 'arm')
     *
     * @example
     * ```typescript
     * const cpu = helper.getCPUArchitecture(userAgent);
     * console.log(cpu); // "amd64"
     * ```
     */
    getCPUArchitecture(user_agent: string): string {
        const parsed = this.getDeviceInfo(user_agent);
        return parsed.cpu.architecture || '';
    }

    /**
     * Checks if the browser is a WebView (embedded browser)
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {boolean} True if WebView
     *
     * @example
     * ```typescript
     * if (helper.isWebView(userAgent)) {
     *     // App-specific behavior
     * }
     * ```
     */
    isWebView(user_agent: string): boolean {
        const ua = user_agent.toLowerCase();
        return ua.includes('webview') ||
            ua.includes('wv') ||
            (ua.includes('mobile') && !ua.includes('safari'));
    }

    /**
     * Creates a user agent hash for tracking/fingerprinting
     *
     * @param {string} user_agent - The User-Agent header string
     * @returns {string} Hash string
     *
     * @example
     * ```typescript
     * const hash = helper.getUserAgentHash(userAgent);
     * // Use for device fingerprinting
     * ```
     */
    getUserAgentHash(user_agent: string): string {
        let hash = 0;
        for (let i = 0; i < user_agent.length; i++) {
            const char = user_agent.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}
