import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * AES-256-GCM encryption for credentials at rest.
 * The key is sourced from the ENCRYPTION_KEY env var (64 hex chars => 32 bytes).
 * If the key is missing or malformed, a fallback derived from JWT_SECRET is used
 * with a logged warning — production deployments should always set ENCRYPTION_KEY.
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('ENCRYPTION_KEY');
    if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) {
      this.key = Buffer.from(raw, 'hex');
    } else {
      const fallbackSeed =
        config.get<string>('JWT_SECRET') || 'flowforge-dev-fallback-key';
      this.key = crypto.createHash('sha256').update(fallbackSeed).digest();
      this.logger.warn(
        'ENCRYPTION_KEY missing or not 64 hex chars; using a derived fallback. ' +
          'Set ENCRYPTION_KEY in production!',
      );
    }
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, tagHex, encHex] = payload.split(':');
    if (!ivHex || !tagHex || !encHex) {
      throw new Error('Malformed encrypted payload');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString('utf8');
  }

  encryptObject(obj: Record<string, unknown>): string {
    return this.encrypt(JSON.stringify(obj));
  }

  decryptObject<T = Record<string, unknown>>(payload: string): T {
    return JSON.parse(this.decrypt(payload)) as T;
  }
}
