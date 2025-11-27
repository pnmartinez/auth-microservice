import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';
const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

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

