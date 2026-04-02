export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
}

export class UserAgentHelper {
  private static _instance: UserAgentHelper;

  static get Instance(): UserAgentHelper {
    if (!this._instance) {
      this._instance = new UserAgentHelper();
    }
    return this._instance;
  }

  /**
   * Parses user agent string into detailed device, browser and OS information.
   * Satisfies requirements for NotificationService and SessionService.
   */
  getSimplifiedDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();
    
    let browser = 'Unknown Browser';
    let browserVersion = '';
    let os = 'Unknown OS';
    let osVersion = '';
    let device = '';
    let deviceType = 'Desktop';

    // Simple Browser Detection
    if (ua.includes('edge') || ua.includes('edg/')) {
      browser = 'Edge';
      const match = ua.match(/edg(?:e)?\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('opr/') || ua.includes('opera')) {
      browser = 'Opera';
      const match = ua.match(/(?:opr|opera)\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('chrome')) {
      browser = 'Chrome';
      const match = ua.match(/chrome\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
      const match = ua.match(/firefox\/([\d.]+)/);
      if (match) browserVersion = match[1];
    } else if (ua.includes('safari')) {
      browser = 'Safari';
      const match = ua.match(/version\/([\d.]+)/);
      if (match) browserVersion = match[1];
    }

    // Simple OS Detection
    if (ua.includes('win')) {
      os = 'Windows';
      if (ua.includes('nt 10.0')) osVersion = '10/11';
      else if (ua.includes('nt 6.3')) osVersion = '8.1';
      else if (ua.includes('nt 6.2')) osVersion = '8';
      else if (ua.includes('nt 6.1')) osVersion = '7';
    } else if (ua.includes('mac')) {
      os = 'macOS';
      const match = ua.match(/os x ([\d._]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
      deviceType = 'Mobile';
      const match = ua.match(/android ([\d.]+)/);
      if (match) osVersion = match[1];
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
      deviceType = 'Mobile';
      const match = ua.match(/os ([\d._]+)/);
      if (match) osVersion = match[1].replace(/_/g, '.');
    }

    // Device Type Refinement
    if (ua.includes('mobile')) deviceType = 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';

    // Device Name Placeholder
    device = os;

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      deviceType,
    };
  }

  /**
   * Alias for getSimplifiedDeviceInfo.
   */
  parse(userAgent: string): DeviceInfo {
    return this.getSimplifiedDeviceInfo(userAgent);
  }

  // Static wrappers for backward compatibility
  static getSimplifiedDeviceInfo(userAgent: string): DeviceInfo {
    return this.Instance.getSimplifiedDeviceInfo(userAgent);
  }

  static parse(userAgent: string): DeviceInfo {
    return this.Instance.parse(userAgent);
  }
}
