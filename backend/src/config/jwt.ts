import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

function requireJwtKey(key: 'JWT_SECRET' | 'JWT_PUBLIC_KEY'): string {
  const value = process.env[key];

  if (!value || !value.trim()) {
    throw new Error(`${key} must be set to a non-empty value`);
  }

  return value;
}

const JWT_SECRET = requireJwtKey('JWT_SECRET');
const JWT_PUBLIC_KEY = requireJwtKey('JWT_PUBLIC_KEY');
const ACCESS_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']) || '15 minutes';
const REFRESH_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']) || '7 days';

export function signAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: ACCESS_EXPIRES_IN,
  };
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    options
  );
}

export function signRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: REFRESH_EXPIRES_IN,
  };
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

