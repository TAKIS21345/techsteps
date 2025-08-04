// Encryption Service for Data Protection
import { EncryptionConfig, KeyManagementConfig } from '../../types/security';

export class EncryptionService {
  private config: EncryptionConfig;
  private keyConfig: KeyManagementConfig;
  private cryptoKey: CryptoKey | null = null;

  constructor(config?: EncryptionConfig, keyConfig?: KeyManagementConfig) {
    this.config = config || {
      algorithm: 'AES-GCM',
      keySize: 256,
      mode: 'GCM'
    };
    
    this.keyConfig = keyConfig || {
      provider: 'firebase',
      keyRotationInterval: 90,
      backupKeys: true
    };

    // Validate AES-256 configuration
    this.validateEncryptionConfig();
  }

  /**
   * Validate that encryption configuration meets AES-256 requirements
   */
  private validateEncryptionConfig(): void {
    if (this.config.keySize !== 256) {
      throw new Error('Encryption service requires AES-256 (256-bit key size)');
    }
    
    if (!this.config.algorithm.includes('AES')) {
      throw new Error('Encryption service requires AES algorithm');
    }

    console.log('✓ AES-256 encryption configuration validated');
  }

  /**
   * Initialize encryption service with master key
   */
  async initialize(): Promise<void> {
    try {
      // Generate or retrieve master key
      this.cryptoKey = await this.getMasterKey();
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  async encryptData(data: string): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        this.cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Return base64 encoded result
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Decode base64
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: iv
        },
        this.cryptoKey,
        encrypted
      );

      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Encrypt object data
   */
  async encryptObject(obj: Record<string, any>): Promise<string> {
    const jsonString = JSON.stringify(obj);
    return this.encryptData(jsonString);
  }

  /**
   * Decrypt object data
   */
  async decryptObject<T>(encryptedData: string): Promise<T> {
    const jsonString = await this.decryptData(encryptedData);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Generate hash for data integrity verification
   */
  async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * Verify data integrity using hash
   */
  async verifyHash(data: string, hash: string): Promise<boolean> {
    const computedHash = await this.generateHash(data);
    return computedHash === hash;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  /**
   * Encrypt PII data with additional metadata
   */
  async encryptPII(data: any, dataType: string): Promise<EncryptedPII> {
    const timestamp = new Date().toISOString();
    const metadata = {
      dataType,
      encrypted: true,
      timestamp,
      algorithm: this.config.algorithm
    };

    const encryptedData = await this.encryptObject({
      data,
      metadata
    });

    return {
      encryptedData,
      metadata,
      hash: await this.generateHash(JSON.stringify(data))
    };
  }

  /**
   * Decrypt PII data and verify integrity
   */
  async decryptPII(encryptedPII: EncryptedPII): Promise<any> {
    const decrypted = await this.decryptObject(encryptedPII.encryptedData);
    
    // Verify data integrity
    const isValid = await this.verifyHash(
      JSON.stringify(decrypted.data),
      encryptedPII.hash
    );

    if (!isValid) {
      throw new Error('Data integrity verification failed');
    }

    return decrypted.data;
  }

  /**
   * Get or generate master encryption key
   */
  private async getMasterKey(): Promise<CryptoKey> {
    // In production, this would retrieve from secure key management service
    // For now, generate a key (in real implementation, this should be persistent)
    return await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keySize
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Rotate encryption keys (for scheduled key rotation)
   */
  async rotateKeys(): Promise<void> {
    // Implementation would depend on key management provider
    console.log('Key rotation initiated');
    // Generate new key
    // Re-encrypt critical data with new key
    // Update key references
    // Archive old key securely
  }

  /**
   * Securely wipe sensitive data from memory
   */
  secureWipe(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string data (limited effectiveness in JS)
      data = '\0'.repeat(data.length);
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Clear buffer
      if (data instanceof Uint8Array) {
        data.fill(0);
      }
    }
  }
}

// Types for encrypted PII
interface EncryptedPII {
  encryptedData: string;
  metadata: {
    dataType: string;
    encrypted: boolean;
    timestamp: string;
    algorithm: string;
  };
  hash: string;
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}

export function resetEncryptionService(): void {
  encryptionServiceInstance = null;
}