import { config } from '../lib/config.js';
import { forbidden } from '../http/errors.js';
import type { AuthUser } from '../auth/context.js';

const parseList = (s: string): string[] =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Adapter keys that are licence-restricted (e.g. the non-commercial Muharaf model). */
export function restrictedTranscribeAdapters(): string[] {
  return parseList(config.RESTRICTED_TRANSCRIBE_ADAPTERS);
}

export function isRestrictedAdapter(key: string | null | undefined): boolean {
  return !!key && restrictedTranscribeAdapters().includes(key);
}

export function isDemoUser(user: AuthUser): boolean {
  return (
    config.DEMO_USER_EMAIL.length > 0 &&
    user.email.toLowerCase() === config.DEMO_USER_EMAIL.toLowerCase()
  );
}

/**
 * Resolve which transcribe adapter a request may use, enforcing licence gating.
 *
 * - Restricted adapters (e.g. the non-commercial Muharaf model) are usable ONLY
 *   by the demo user; any other user requesting one is forbidden.
 * - The demo user, when not naming an adapter, is routed to DEMO_TRANSCRIBE_ADAPTER
 *   (so the demo defaults to the gated model) if one is configured.
 * - Everyone else falls back to the global default (returns undefined).
 *
 * This is the single chokepoint: the non-commercial model can never be invoked
 * by a commercial user, and its outputs therefore only ever exist in the demo org.
 */
export function resolveTranscribeAdapterKey(
  user: AuthUser,
  requested?: string,
): string | undefined {
  const demo = isDemoUser(user);

  if (requested) {
    if (isRestrictedAdapter(requested) && !demo) {
      throw forbidden(
        'This transcription model is restricted to the demo account and may not be used commercially',
      );
    }
    return requested;
  }

  if (demo && config.DEMO_TRANSCRIBE_ADAPTER) {
    return config.DEMO_TRANSCRIBE_ADAPTER;
  }
  return undefined; // job uses the global default (config.TRANSCRIBE_ADAPTER)
}
