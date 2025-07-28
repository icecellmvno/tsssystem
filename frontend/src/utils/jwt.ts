export interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

export function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) {
    return true;
  }

  // Check if token is expired (with 5 minute buffer)
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 5 * 60; // 5 minutes in seconds
  return payload.exp < (currentTime + bufferTime);
}

export function getTokenExpirationTime(token: string): Date | null {
  const payload = parseJWT(token);
  if (!payload) {
    return null;
  }
  return new Date(payload.exp * 1000);
}

export function getTimeUntilExpiration(token: string): number {
  const payload = parseJWT(token);
  if (!payload) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - currentTime);
} 