// Known OAuth2 provider defaults — authorize, token, and profile URLs + scope separator + profile field mappings
export interface ProviderConfig {
    authorize_url: string;
    token_url: string;
    profile_url: string;
    default_scopes: string[];
    scope_separator: string;
    profile_map: {
        id: string;
        email: string;
        name: string;
        avatar: string;
    };
}

export const PROVIDER_DEFAULTS: Record<string, ProviderConfig> = {
    google: {
        authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_url: 'https://oauth2.googleapis.com/token',
        profile_url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        default_scopes: ['email', 'profile'],
        scope_separator: ' ',
        profile_map: { id: 'id', email: 'email', name: 'name', avatar: 'picture' },
    },
    github: {
        authorize_url: 'https://github.com/login/oauth/authorize',
        token_url: 'https://github.com/login/oauth/access_token',
        profile_url: 'https://api.github.com/user',
        default_scopes: ['user:email', 'read:user'],
        scope_separator: ' ',
        profile_map: { id: 'id', email: 'email', name: 'name', avatar: 'avatar_url' },
    },
    facebook: {
        authorize_url: 'https://www.facebook.com/v19.0/dialog/oauth',
        token_url: 'https://graph.facebook.com/v19.0/oauth/access_token',
        profile_url: 'https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)',
        default_scopes: ['email', 'public_profile'],
        scope_separator: ',',
        profile_map: { id: 'id', email: 'email', name: 'name', avatar: 'picture.data.url' },
    },
    microsoft: {
        authorize_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        profile_url: 'https://graph.microsoft.com/v1.0/me',
        default_scopes: ['openid', 'email', 'profile', 'User.Read'],
        scope_separator: ' ',
        profile_map: { id: 'id', email: 'mail', name: 'displayName', avatar: '' },
    },
    linkedin: {
        authorize_url: 'https://www.linkedin.com/oauth/v2/authorization',
        token_url: 'https://www.linkedin.com/oauth/v2/accessToken',
        profile_url: 'https://api.linkedin.com/v2/userinfo',
        default_scopes: ['openid', 'profile', 'email'],
        scope_separator: ' ',
        profile_map: { id: 'sub', email: 'email', name: 'name', avatar: 'picture' },
    },
    twitter: {
        authorize_url: 'https://twitter.com/i/oauth2/authorize',
        token_url: 'https://api.twitter.com/2/oauth2/token',
        profile_url: 'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
        default_scopes: ['tweet.read', 'users.read'],
        scope_separator: ' ',
        profile_map: { id: 'data.id', email: '', name: 'data.name', avatar: 'data.profile_image_url' },
    },
    apple: {
        authorize_url: 'https://appleid.apple.com/auth/authorize',
        token_url: 'https://appleid.apple.com/auth/token',
        profile_url: '',
        default_scopes: ['name', 'email'],
        scope_separator: ' ',
        profile_map: { id: 'sub', email: 'email', name: 'name', avatar: '' },
    },
};

// Helper to resolve nested object paths like "picture.data.url"
export function getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
