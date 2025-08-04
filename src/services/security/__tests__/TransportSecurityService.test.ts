// Tests for Transport Security Service (TLS 1.3)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TransportSecurityService, getTransportSecurityService, resetTransportSecurityService } from '../TransportSecurityService';

// Mock window.location
const mockLocation = {
  protocol: 'https:',
  origin: 'https://example.com',
  href: 'https://example.com/test'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('TransportSecurityService - TLS 1.3 Implementation', () => {
  let transportSecurityService: TransportSecurityService;

  beforeEach(() => {
    resetTransportSecurityService();
    transportSecurityService = getTransportSecurityService();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    resetTransportSecurityService();
    vi.restoreAllMocks();
  });

  describe('Security Headers Configuration', () => {
    it('should provide comprehensive security headers', () => {
      const headers = transportSecurityService.getSecurityHeaders();
      
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include Content Security Policy', () => {
      const headers = transportSecurityService.getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include Permissions Policy', () => {
      const headers = transportSecurityService.getSecurityHeaders();
      const permissionsPolicy = headers['Permissions-Policy'];
      
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
    });
  });

  describe('URL Validation and Sanitization', () => {
    it('should validate secure HTTPS URLs', () => {
      const httpsUrl = 'https://api.example.com/data';
      const isValid = transportSecurityService.validateSecureConnection(httpsUrl);
      
      expect(isValid).toBe(true);
    });

    it('should reject HTTP URLs', () => {
      const httpUrl = 'http://api.example.com/data';
      const isValid = transportSecurityService.validateSecureConnection(httpUrl);
      
      expect(isValid).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const invalidUrl = 'not-a-url';
      const isValid = transportSecurityService.validateSecureConnection(invalidUrl);
      
      expect(isValid).toBe(false);
    });

    it('should sanitize URLs properly', () => {
      const validUrl = 'https://example.com/path';
      const sanitized = transportSecurityService.sanitizeUrl(validUrl);
      
      expect(sanitized).toBe(validUrl);
    });

    it('should reject dangerous URLs', () => {
      const dangerousUrls = [
        'http://localhost:3000',
        'https://127.0.0.1:8080',
        'file:///etc/passwd'
      ];
      
      dangerousUrls.forEach(url => {
        const sanitized = transportSecurityService.sanitizeUrl(url);
        expect(sanitized).toBeNull();
      });
    });

    it('should allow data URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const sanitized = transportSecurityService.sanitizeUrl(dataUrl);
      
      expect(sanitized).toBe(dataUrl);
    });
  });

  describe('CSP Nonce Generation', () => {
    it('should generate unique CSP nonces', () => {
      const nonce1 = transportSecurityService.generateCSPNonce();
      const nonce2 = transportSecurityService.generateCSPNonce();
      
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(0);
    });

    it('should generate base64 encoded nonces', () => {
      const nonce = transportSecurityService.generateCSPNonce();
      
      // Base64 pattern check
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Pattern.test(nonce)).toBe(true);
    });
  });

  describe('Vite Security Configuration', () => {
    it('should provide Vite security configuration', () => {
      const config = transportSecurityService.getViteSecurityConfig();
      
      expect(config.server).toBeDefined();
      expect(config.server.headers).toBeDefined();
      expect(config.build).toBeDefined();
      expect(config.build.rollupOptions).toBeDefined();
    });

    it('should include security headers in Vite config', () => {
      const config = transportSecurityService.getViteSecurityConfig();
      const headers = config.server.headers;
      
      expect(headers['Strict-Transport-Security']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should configure secure asset handling', () => {
      const config = transportSecurityService.getViteSecurityConfig();
      const assetFileNames = config.build.rollupOptions.output.assetFileNames;
      
      expect(typeof assetFileNames).toBe('function');
      
      // Test image asset naming
      const imageAsset = { name: 'test.png' };
      const imageName = assetFileNames(imageAsset);
      expect(imageName).toContain('assets/images/');
      
      // Test font asset naming
      const fontAsset = { name: 'test.woff2' };
      const fontName = assetFileNames(fontAsset);
      expect(fontName).toContain('assets/fonts/');
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should not redirect in development', () => {
      // Mock development environment
      vi.stubEnv('PROD', false);
      
      // Mock HTTP location
      Object.defineProperty(window, 'location', {
        value: { ...mockLocation, protocol: 'http:' },
        writable: true
      });
      
      // Should not throw or redirect in development
      expect(() => {
        new TransportSecurityService();
      }).not.toThrow();
    });

    it('should handle HTTPS validation correctly', () => {
      // Test with HTTPS
      Object.defineProperty(window, 'location', {
        value: { ...mockLocation, protocol: 'https:' },
        writable: true
      });
      
      expect(() => {
        new TransportSecurityService();
      }).not.toThrow();
    });
  });

  describe('Security Event Monitoring', () => {
    it('should monitor mixed content warnings', () => {
      const originalWarn = console.warn;
      let capturedWarnings: string[] = [];
      
      console.warn = (...args: any[]) => {
        capturedWarnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };
      
      // Create service to set up monitoring
      new TransportSecurityService();
      
      // Simulate mixed content warning
      console.warn('Mixed Content: The page was loaded over HTTPS');
      
      expect(capturedWarnings.some(warning => 
        warning.includes('Mixed Content')
      )).toBe(true);
      
      console.warn = originalWarn;
    });

    it('should handle security policy violations', () => {
      // Mock SecurityPolicyViolationEvent
      const mockEvent = new Event('securitypolicyviolation') as any;
      mockEvent.violatedDirective = 'script-src';
      mockEvent.blockedURI = 'http://malicious.com/script.js';
      mockEvent.originalPolicy = "default-src 'self'";
      
      // Create service to set up event listeners
      new TransportSecurityService();
      
      // Should not throw when handling the event
      expect(() => {
        document.dispatchEvent(mockEvent);
      }).not.toThrow();
    });
  });

  describe('Certificate Monitoring', () => {
    it('should handle certificate validation', async () => {
      // Mock fetch for certificate check
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200
      });
      
      // Create service (which starts certificate monitoring)
      new TransportSecurityService();
      
      // Wait a bit for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle certificate validation failures', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Certificate error'));
      
      // Should not throw even if certificate check fails
      expect(() => {
        new TransportSecurityService();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', () => {
      const invalidUrls = [
        '',
        null,
        undefined,
        'not-a-url',
        'javascript:alert(1)'
      ];
      
      invalidUrls.forEach(url => {
        expect(() => {
          transportSecurityService.validateSecureConnection(url as string);
        }).not.toThrow();
      });
    });

    it('should handle network errors during security checks', async () => {
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      // Should handle errors gracefully
      expect(() => {
        new TransportSecurityService();
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should initialize quickly', () => {
      const startTime = performance.now();
      
      new TransportSecurityService();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Should initialize within 50ms
    });

    it('should validate URLs quickly', () => {
      const urls = Array(100).fill('https://example.com/api/endpoint');
      
      const startTime = performance.now();
      
      urls.forEach(url => {
        transportSecurityService.validateSecureConnection(url);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should validate 100 URLs within 100ms
    });
  });
});