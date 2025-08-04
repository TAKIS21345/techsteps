// Tests for AES-256 Encryption Service
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncryptionService, getEncryptionService, resetEncryptionService } from '../EncryptionService';

describe('EncryptionService - AES-256 Implementation', () => {
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    resetEncryptionService();
    encryptionService = getEncryptionService();
    await encryptionService.initialize();
  });

  afterEach(() => {
    resetEncryptionService();
  });

  describe('AES-256 Configuration', () => {
    it('should enforce AES-256 encryption configuration', () => {
      expect(() => {
        new EncryptionService({
          algorithm: 'AES-GCM',
          keySize: 128, // Should fail - not 256
          mode: 'GCM'
        });
      }).toThrow('Encryption service requires AES-256 (256-bit key size)');
    });

    it('should enforce AES algorithm', () => {
      expect(() => {
        new EncryptionService({
          algorithm: 'DES', // Should fail - not AES
          keySize: 256,
          mode: 'GCM'
        });
      }).toThrow('Encryption service requires AES algorithm');
    });

    it('should accept valid AES-256 configuration', () => {
      expect(() => {
        new EncryptionService({
          algorithm: 'AES-GCM',
          keySize: 256,
          mode: 'GCM'
        });
      }).not.toThrow();
    });
  });

  describe('Data Encryption and Decryption', () => {
    it('should encrypt and decrypt string data correctly', async () => {
      const originalData = 'Sensitive senior user data';
      
      const encrypted = await encryptionService.encryptData(originalData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.length).toBeGreaterThan(0);
      
      const decrypted = await encryptionService.decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt object data correctly', async () => {
      const originalObject = {
        userId: 'senior-user-123',
        personalInfo: {
          name: 'John Doe',
          age: 75,
          preferences: {
            fontSize: 'large',
            highContrast: true
          }
        },
        sensitiveData: 'Medical information'
      };
      
      const encrypted = await encryptionService.encryptObject(originalObject);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      
      const decrypted = await encryptionService.decryptObject(encrypted);
      expect(decrypted).toEqual(originalObject);
    });

    it('should handle empty strings', async () => {
      const emptyString = '';
      
      const encrypted = await encryptionService.encryptData(emptyString);
      const decrypted = await encryptionService.decryptData(encrypted);
      
      expect(decrypted).toBe(emptyString);
    });

    it('should handle special characters and unicode', async () => {
      const specialData = 'Special chars: àáâãäåæçèéêë 中文 العربية 🔒🛡️';
      
      const encrypted = await encryptionService.encryptData(specialData);
      const decrypted = await encryptionService.decryptData(encrypted);
      
      expect(decrypted).toBe(specialData);
    });
  });

  describe('PII Encryption', () => {
    it('should encrypt PII with metadata', async () => {
      const piiData = {
        ssn: '123-45-6789',
        medicalRecord: 'Diabetes Type 2',
        emergencyContact: '+1-555-0123'
      };
      
      const encryptedPII = await encryptionService.encryptPII(piiData, 'medical_info');
      
      expect(encryptedPII.encryptedData).toBeDefined();
      expect(encryptedPII.metadata.dataType).toBe('medical_info');
      expect(encryptedPII.metadata.encrypted).toBe(true);
      expect(encryptedPII.metadata.algorithm).toBe('AES-GCM');
      expect(encryptedPII.hash).toBeDefined();
    });

    it('should decrypt PII and verify integrity', async () => {
      const originalPII = {
        personalInfo: 'Sensitive senior data',
        medicalHistory: ['Hypertension', 'Arthritis']
      };
      
      const encryptedPII = await encryptionService.encryptPII(originalPII, 'health_data');
      const decryptedPII = await encryptionService.decryptPII(encryptedPII);
      
      expect(decryptedPII).toEqual(originalPII);
    });

    it('should detect data integrity violations', async () => {
      const originalPII = { data: 'test' };
      const encryptedPII = await encryptionService.encryptPII(originalPII, 'test_data');
      
      // Tamper with the hash
      encryptedPII.hash = 'tampered_hash';
      
      await expect(encryptionService.decryptPII(encryptedPII))
        .rejects.toThrow('Data integrity verification failed');
    });
  });

  describe('Hash Generation and Verification', () => {
    it('should generate consistent hashes', async () => {
      const data = 'Test data for hashing';
      
      const hash1 = await encryptionService.generateHash(data);
      const hash2 = await encryptionService.generateHash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should verify hash integrity', async () => {
      const data = 'Data to verify';
      const hash = await encryptionService.generateHash(data);
      
      const isValid = await encryptionService.verifyHash(data, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await encryptionService.verifyHash('Modified data', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = encryptionService.generateSecureToken();
      const token2 = encryptionService.generateSecureToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should generate tokens of specified length', () => {
      const shortToken = encryptionService.generateSecureToken(16);
      const longToken = encryptionService.generateSecureToken(64);
      
      // Base64 encoding increases length, so we check relative sizes
      expect(longToken.length).toBeGreaterThan(shortToken.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      const uninitializedService = new EncryptionService();
      
      await expect(uninitializedService.encryptData('test'))
        .rejects.toThrow('Encryption service not initialized');
    });

    it('should handle decryption of invalid data', async () => {
      await expect(encryptionService.decryptData('invalid_encrypted_data'))
        .rejects.toThrow('Data decryption failed');
    });

    it('should handle malformed base64 data', async () => {
      await expect(encryptionService.decryptData('not_base64_data!@#'))
        .rejects.toThrow('Data decryption failed');
    });
  });

  describe('Security Features', () => {
    it('should use different IVs for each encryption', async () => {
      const data = 'Same data encrypted twice';
      
      const encrypted1 = await encryptionService.encryptData(data);
      const encrypted2 = await encryptionService.encryptData(data);
      
      // Same data should produce different encrypted outputs due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same original data
      const decrypted1 = await encryptionService.decryptData(encrypted1);
      const decrypted2 = await encryptionService.decryptData(encrypted2);
      
      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });

    it('should handle large data sets', async () => {
      // Test with large data (1MB string)
      const largeData = 'x'.repeat(1024 * 1024);
      
      const encrypted = await encryptionService.encryptData(largeData);
      const decrypted = await encryptionService.decryptData(encrypted);
      
      expect(decrypted).toBe(largeData);
      expect(decrypted.length).toBe(1024 * 1024);
    });
  });

  describe('Memory Security', () => {
    it('should provide secure wipe functionality', () => {
      const sensitiveData = 'Sensitive information';
      
      // Test secure wipe (limited effectiveness in JavaScript)
      expect(() => {
        encryptionService.secureWipe(sensitiveData);
      }).not.toThrow();
    });

    it('should handle array buffer secure wipe', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      
      encryptionService.secureWipe(buffer);
      
      // Buffer should be zeroed out
      expect(Array.from(buffer)).toEqual([0, 0, 0, 0, 0]);
    });
  });

  describe('Performance', () => {
    it('should encrypt and decrypt within reasonable time', async () => {
      const data = 'Performance test data';
      
      const startTime = performance.now();
      
      const encrypted = await encryptionService.encryptData(data);
      const decrypted = await encryptionService.decryptData(encrypted);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(decrypted).toBe(data);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});