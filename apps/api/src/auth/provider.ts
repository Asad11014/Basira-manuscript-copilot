/**
 * authProvider seam (§14). The login flow resolves a provider by key and calls
 * `authenticate`. The MVP ships only `password`; SSO/SAML are added later as new
 * providers + one registry line, with no change to call sites.
 */
export interface AuthProvider {
  key: string;
  /** Verify credentials and return the authenticated user's id, or throw. */
  authenticate(input: {
    email: string;
    password: string;
  }): Promise<{ userId: string }>;
}

const providers = new Map<string, AuthProvider>();

export function registerAuthProvider(provider: AuthProvider): void {
  providers.set(provider.key, provider);
}

export function resolveAuthProvider(key = 'password'): AuthProvider {
  const provider = providers.get(key);
  if (!provider) throw new Error(`Unknown auth provider: ${key}`);
  return provider;
}
