import crypto from 'crypto';

export function uuid(): string {
  return crypto.randomBytes(16).toString('hex');
}
