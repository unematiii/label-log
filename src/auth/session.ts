import * as SecureStore from 'expo-secure-store';

const ApiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://127.0.0.1:3000';
const RefreshTokenKey = 'auth.refreshToken';

export type AuthTokens = {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly retryAfter?: string | null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type SessionSnapshot = {
  isLoading: boolean;
  isAuthenticated: boolean;
};

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let snapshot: SessionSnapshot = { isLoading: true, isAuthenticated: false };

const listeners = new Set<() => void>();

function emit(next: SessionSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionSnapshot() {
  return snapshot;
}

async function parseError(response: Response, fallback: string) {
  let body: { code?: string; message?: string } | undefined;

  try {
    body = (await response.json()) as typeof body;
  } catch {
    // The server did not return JSON.
  }

  return new ApiError(
    body?.message ?? fallback,
    response.status,
    body?.code,
    response.headers.get('Retry-After')
  );
}

async function saveTokens(tokens: AuthTokens) {
  // Persist the rotated token before exposing the new access token
  await SecureStore.setItemAsync(RefreshTokenKey, tokens.refreshToken);

  refreshToken = tokens.refreshToken;
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = Date.now() + tokens.expiresIn * 1000;

  emit({ isLoading: false, isAuthenticated: true });
}

export async function clearSession() {
  accessToken = null;
  accessTokenExpiresAt = 0;
  refreshToken = null;

  try {
    await SecureStore.deleteItemAsync(RefreshTokenKey);
  } finally {
    emit({ isLoading: false, isAuthenticated: false });
  }
}

export async function requestLoginCode(email: string) {
  const response = await fetch(`${ApiBaseUrl}/auth/code/request`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (response.status !== 202) {
    throw await parseError(response, 'Could not request a login code');
  }
}

export async function verifyLoginCode(email: string, code: string) {
  const response = await fetch(`${ApiBaseUrl}/auth/code/verify`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    throw await parseError(response, 'Could not verify the login code');
  }

  await saveTokens((await response.json()) as AuthTokens);
}

async function performRefresh() {
  if (!refreshToken) {
    throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const response = await fetch(`${ApiBaseUrl}/auth/token/refresh`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const error = await parseError(response, 'Could not refresh the session');
    if (response.status === 401) await clearSession();
    throw error;
  }

  const tokens = (await response.json()) as AuthTokens;
  await saveTokens(tokens);

  return tokens.accessToken;
}

async function refreshAccessToken(tokenThatFailed?: string) {
  if (tokenThatFailed && accessToken && tokenThatFailed !== accessToken) {
    return accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function restoreSession() {
  try {
    refreshToken = await SecureStore.getItemAsync(RefreshTokenKey);
    if (!refreshToken) {
      emit({ isLoading: false, isAuthenticated: false });
      return;
    }
    await refreshAccessToken();
  } catch {
    await clearSession();
  }
}

export async function authenticatedFetch(input: string, init?: RequestInit) {
  let token = accessToken;

  // Refresh shortly before expiry, while still allowing restoration to happen.
  if (!token || Date.now() >= accessTokenExpiresAt - 30_000) {
    token = await refreshAccessToken(token ?? undefined);
  }

  const send = (bearer: string) =>
    fetch(input, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers).entries()),
        Authorization: `Bearer ${bearer}`,
      },
    });

  let response = await send(token);
  if (response.status === 401) {
    token = await refreshAccessToken(token);
    response = await send(token);
  }

  return response;
}
