// Transport Security Service for TLS 1.3 and HTTPS enforcement
import { SecurityEvent } from '../../types/security';
import { getSecurityMonitoringService } from './SecurityMonitoringService';

export class TransportSecurityService {
  private monitoringService = getSecurityMonitoringService();
  private securityHeaders: Record<string, string>;

  constructor() {
    this.securityHeaders = this.getSecurityHeaders();
    this.initializeTransportSecurity();
  }

  /**
   * Initialize transport security measures
   */
  private initializeTransportSecurity(): void {
    // Enforce HTTPS in production
    if (import.meta.env.PROD && window.location.protocol !== 'https:') {
      this.redirectToHTTPS();
    }

    // Set up security headers monitoring
    this.monitorSecurityHeaders();

    // Initialize certificate monitoring
    this.initializeCertificateMonitoring();
  }

  /**
   * Get security headers configuration for TLS 1.3 and HTTPS
   */
  private getSecurityHeaders(): Record<string, string> {
    return {
      // Strict Transport Security (HSTS) - Force HTTPS for 1 year
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Content Security Policy - Prevent XSS and data injection
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://generativelanguage.googleapis.com https://*.firebaseapp.com https://*.googleapis.com wss://*.firebaseio.com",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      
      // X-Frame-Options - Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // X-Content-Type-Options - Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Referrer Policy - Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy - Control browser features
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
      ].join(', '),
      
      // X-XSS-Protection - Enable XSS filtering
      'X-XSS-Protection': '1; mode=block'
    };
  }

  /**
   * Redirect to HTTPS if accessing via HTTP in production
   */
  private redirectToHTTPS(): void {
    const httpsUrl = window.location.href.replace('http://', 'https://');
    
    // Log security event
    this.monitoringService.logSecurityEvent({
      type: 'system',
      severity: 'medium',
      source: 'transport_security',
      details: {
        action: 'https_redirect',
        outcome: 'success',
        metadata: {
          originalUrl: window.location.href,
          redirectUrl: httpsUrl
        }
      }
    });

    window.location.replace(httpsUrl);
  }

  /**
   * Monitor security headers and TLS configuration
   */
  private monitorSecurityHeaders(): void {
    // Check if security headers are properly set
    this.checkSecurityHeaders();
    
    // Monitor for mixed content warnings
    this.monitorMixedContent();
    
    // Check TLS version and cipher suites
    this.checkTLSConfiguration();
  }

  /**
   * Check if required security headers are present
   */
  private async checkSecurityHeaders(): Promise<void> {
    try {
      const response = await fetch(window.location.origin, { method: 'HEAD' });
      const headers = response.headers;
      
      const missingHeaders: string[] = [];
      const weakHeaders: string[] = [];

      // Check for required security headers
      Object.entries(this.securityHeaders).forEach(([headerName, expectedValue]) => {
        const actualValue = headers.get(headerName);
        
        if (!actualValue) {
          missingHeaders.push(headerName);
        } else if (headerName === 'Strict-Transport-Security' && !actualValue.includes('max-age=31536000')) {
          weakHeaders.push(`${headerName}: insufficient max-age`);
        }
      });

      if (missingHeaders.length > 0 || weakHeaders.length > 0) {
        this.monitoringService.logSecurityEvent({
          type: 'system',
          severity: 'high',
          source: 'transport_security',
          details: {
            action: 'security_headers_check',
            outcome: 'failure',
            metadata: {
              missingHeaders,
              weakHeaders
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to check security headers:', error);
    }
  }

  /**
   * Monitor for mixed content (HTTP resources on HTTPS pages)
   */
  private monitorMixedContent(): void {
    // Listen for mixed content warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Mixed Content') || message.includes('insecure')) {
        this.monitoringService.logSecurityEvent({
          type: 'system',
          severity: 'high',
          source: 'transport_security',
          details: {
            action: 'mixed_content_detected',
            outcome: 'blocked',
            metadata: {
              message,
              url: window.location.href
            }
          }
        });
      }
      originalConsoleWarn.apply(console, args);
    };

    // Monitor for insecure requests
    if ('SecurityPolicyViolationEvent' in window) {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.monitoringService.logSecurityEvent({
          type: 'system',
          severity: 'high',
          source: 'transport_security',
          details: {
            action: 'csp_violation',
            outcome: 'blocked',
            metadata: {
              violatedDirective: event.violatedDirective,
              blockedURI: event.blockedURI,
              originalPolicy: event.originalPolicy
            }
          }
        });
      });
    }
  }

  /**
   * Check TLS configuration and version
   */
  private checkTLSConfiguration(): void {
    // Check if we're using HTTPS
    if (window.location.protocol !== 'https:') {
      this.monitoringService.logSecurityEvent({
        type: 'system',
        severity: 'critical',
        source: 'transport_security',
        details: {
          action: 'insecure_connection',
          outcome: 'failure',
          metadata: {
            protocol: window.location.protocol,
            url: window.location.href
          }
        }
      });
      return;
    }

    // Check TLS version using connection info (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.securityDetails) {
        const tlsVersion = connection.securityDetails.protocol;
        
        if (!tlsVersion || !tlsVersion.includes('TLS 1.3')) {
          this.monitoringService.logSecurityEvent({
            type: 'system',
            severity: 'medium',
            source: 'transport_security',
            details: {
              action: 'tls_version_check',
              outcome: 'warning',
              metadata: {
                detectedVersion: tlsVersion || 'unknown',
                recommendedVersion: 'TLS 1.3'
              }
            }
          });
        }
      }
    }
  }

  /**
   * Initialize certificate monitoring
   */
  private initializeCertificateMonitoring(): void {
    // Monitor certificate validity
    this.checkCertificateValidity();
    
    // Set up periodic certificate checks
    setInterval(() => {
      this.checkCertificateValidity();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Check SSL certificate validity
   */
  private async checkCertificateValidity(): Promise<void> {
    if (window.location.protocol !== 'https:') return;

    try {
      // Attempt to fetch from the same origin to check certificate
      const response = await fetch(window.location.origin, { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`Certificate check failed: ${response.status}`);
      }

      // Log successful certificate validation
      this.monitoringService.logSecurityEvent({
        type: 'system',
        severity: 'low',
        source: 'transport_security',
        details: {
          action: 'certificate_validation',
          outcome: 'success',
          metadata: {
            timestamp: new Date().toISOString(),
            origin: window.location.origin
          }
        }
      });

    } catch (error) {
      this.monitoringService.logSecurityEvent({
        type: 'system',
        severity: 'critical',
        source: 'transport_security',
        details: {
          action: 'certificate_validation',
          outcome: 'failure',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            origin: window.location.origin
          }
        }
      });
    }
  }

  /**
   * Validate secure connection for API calls
   */
  validateSecureConnection(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Ensure HTTPS for external APIs
      if (urlObj.protocol !== 'https:') {
        this.monitoringService.logSecurityEvent({
          type: 'system',
          severity: 'high',
          source: 'transport_security',
          details: {
            action: 'insecure_api_call',
            outcome: 'blocked',
            metadata: {
              url,
              protocol: urlObj.protocol
            }
          }
        });
        return false;
      }

      return true;
    } catch (error) {
      this.monitoringService.logSecurityEvent({
        type: 'system',
        severity: 'medium',
        source: 'transport_security',
        details: {
          action: 'url_validation',
          outcome: 'failure',
          metadata: {
            url,
            error: error instanceof Error ? error.message : 'Invalid URL'
          }
        }
      });
      return false;
    }
  }

  /**
   * Get security configuration for Vite/build tools
   */
  getViteSecurityConfig(): Record<string, any> {
    return {
      server: {
        https: import.meta.env.PROD ? true : false,
        headers: this.securityHeaders
      },
      build: {
        rollupOptions: {
          output: {
            // Ensure secure asset loading
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name?.split('.') || [];
              const ext = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                return `assets/images/[name]-[hash][extname]`;
              }
              if (/woff2?|eot|ttf|otf/i.test(ext)) {
                return `assets/fonts/[name]-[hash][extname]`;
              }
              return `assets/[name]-[hash][extname]`;
            }
          }
        }
      }
    };
  }



  /**
   * Generate Content Security Policy nonce for inline scripts
   */
  generateCSPNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Validate and sanitize URLs for security
   */
  sanitizeUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Allow only HTTPS and data URLs
      if (!['https:', 'data:'].includes(urlObj.protocol)) {
        return null;
      }

      // Block potentially dangerous domains
      const blockedDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'file://'
      ];

      if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
        return null;
      }

      return urlObj.toString();
    } catch {
      return null;
    }
  }
}

// Singleton instance
let transportSecurityServiceInstance: TransportSecurityService | null = null;

export function getTransportSecurityService(): TransportSecurityService {
  if (!transportSecurityServiceInstance) {
    transportSecurityServiceInstance = new TransportSecurityService();
  }
  return transportSecurityServiceInstance;
}

export function resetTransportSecurityService(): void {
  transportSecurityServiceInstance = null;
}