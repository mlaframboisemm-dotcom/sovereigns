import fs from 'fs';
import crypto from 'crypto';

/**
 * Ledger Mutex & Security Wrapper
 * Implements a strict write-lock, sequential queue, and AES-256 encryption/decryption for ledger_db.json.
 */
export class LedgerMutex {
  private static queue: Promise<any> = Promise.resolve();

  /**
   * Enqueues an operation that writes to ledger_db.json.
   * Ensures that execution is strictly sequential and atomic.
   */
  static async runLocked<T>(operation: () => Promise<T>): Promise<T> {
    const res = new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
    return res;
  }

  /**
   * Encrypt ledger data using AES-256-CBC
   */
  static encryptLedgerData(data: any): string {
    const encryptionKey = process.env.SOVEREIGN_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      return JSON.stringify(data, null, 2);
    }
    
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(encryptionKey.slice(0, 32), 'hex').length === 32 
        ? Buffer.from(encryptionKey.slice(0, 32), 'hex')
        : crypto.pbkdf2Sync(encryptionKey, 'sovereign_ledger_salt', 100000, 32, 'sha256');
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (err) {
      console.error('[Ledger] Encryption failed, storing unencrypted:', err);
      return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Decrypt ledger data using AES-256-CBC
   */
  static decryptLedgerData(encrypted: string): any {
    const encryptionKey = process.env.SOVEREIGN_ENCRYPTION_KEY;
    if (!encryptionKey || !encrypted.includes(':')) {
      return JSON.parse(encrypted);
    }
    
    try {
      const [ivHex, cipherHex] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = Buffer.from(encryptionKey!.slice(0, 32), 'hex').length === 32
        ? Buffer.from(encryptionKey!.slice(0, 32), 'hex')
        : crypto.pbkdf2Sync(encryptionKey!, 'sovereign_ledger_salt', 100000, 32, 'sha256');
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(cipherHex, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      
      return JSON.parse(decrypted);
    } catch (err) {
      console.error('[Ledger] Decryption failed, attempting plaintext parse:', err);
      return JSON.parse(encrypted);
    }
  }
}
