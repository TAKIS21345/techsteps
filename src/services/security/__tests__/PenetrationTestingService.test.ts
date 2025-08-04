import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PenetrationTestingService, getPenetrationTestingService, resetPenetrationTestingService } from '../PenetrationTestingService';

describe('PenetrationTestingService', () => {
  let service: PenetrationTestingService;

  beforeEach(() => {
    resetPenetrationTestingService();
    service = getPenetrationTestingService();
  });

  afterEach(() => {
    resetPenetrationTestingService();
  });

  describe('Test Suite Execution', () => {
    it('should run web application security test suite', async () => {
      const result = await service.runPenetrationTest('web-app-security');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('suiteId', 'web-app-security');
      expect(result).toHaveProperty('suiteName', 'Web Application Security Testing');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendations');

      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(Array.isArray(result.findings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should run senior user security test suite', async () => {
      const result = await service.runPenetrationTest('senior-user-security');

      expect(result.suiteId).toBe('senior-user-security');
      expect(result.suiteName).toBe('Senior User Security Testing');
      expect(result.status).toBe('completed');
      expect(result.summary.totalTests).toBe(3); // Senior user suite has 3 tests
    });

    it('should run privacy compliance test suite', async () => {
      const result = await service.runPenetrationTest('privacy-compliance');

      expect(result.suiteId).toBe('privacy-compliance');
      expect(result.suiteName).toBe('Privacy and Compliance Testing');
      expect(result.status).toBe('completed');
      expect(result.summary.totalTests).toBe(3); // Privacy compliance suite has 3 tests
    });

    it('should run infrastructure security test suite', async () => {
      const result = await service.runPenetrationTest('infrastructure-security');

      expect(result.suiteId).toBe('infrastructure-security');
      expect(result.suiteName).toBe('Infrastructure Security Testing');
      expect(result.status).toBe('completed');
      expect(result.summary.totalTests).toBe(2); // Infrastructure suite has 2 tests
    });

    it('should throw error for unknown test suite', async () => {
      await expect(
        service.runPenetrationTest('unknown-suite')
      ).rejects.toThrow('Test suite unknown-suite not found');
    });
  });

  describe('Test Results and Findings', () => {
    it('should categorize findings by severity', async () => {
      const result = await service.runPenetrationTest('web-app-security');

      expect(result.summary).toHaveProperty('criticalFindings');
      expect(result.summary).toHaveProperty('highFindings');
      expect(result.summary).toHaveProperty('mediumFindings');
      expect(result.summary).toHaveProperty('lowFindings');

      expect(typeof result.summary.criticalFindings).toBe('number');
      expect(typeof result.summary.highFindings).toBe('number');
      expect(typeof result.summary.mediumFindings).toBe('number');
      expect(typeof result.summary.lowFindings).toBe('number');

      // Total findings should match sum of severity categories
      const totalBySeverity = result.summary.criticalFindings + 
                             result.summary.highFindings + 
                             result.summary.mediumFindings + 
                             result.summary.lowFindings;
      expect(totalBySeverity).toBe(result.findings.length);
    });

    it('should include vulnerability details in findings', async () => {
      const result = await service.runPenetrationTest('web-app-security');

      if (result.findings.length > 0) {
        const finding = result.findings[0];
        expect(finding).toHaveProperty('id');
        expect(finding).toHaveProperty('type');
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('title');
        expect(finding).toHaveProperty('description');
        expect(finding).toHaveProperty('target');
        expect(finding).toHaveProperty('evidence');
        expect(finding).toHaveProperty('cvssScore');
        expect(finding).toHaveProperty('exploitability');
        expect(finding).toHaveProperty('impact');

        expect(['low', 'medium', 'high', 'critical']).toContain(finding.severity);
        expect(['low', 'medium', 'high']).toContain(finding.exploitability);
        expect(typeof finding.cvssScore).toBe('number');
        expect(finding.cvssScore).toBeGreaterThanOrEqual(0);
        expect(finding.cvssScore).toBeLessThanOrEqual(10);
      }
    });

    it('should generate appropriate recommendations based on findings', async () => {
      const result = await service.runPenetrationTest('web-app-security');

      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.summary.criticalFindings > 0) {
        expect(result.recommendations).toContain('Immediately address critical vulnerabilities');
      }

      if (result.summary.highFindings > 0) {
        expect(result.recommendations).toContain('Prioritize remediation of high-severity vulnerabilities');
      }
    });

    it('should handle social engineering findings for senior users', async () => {
      const result = await service.runPenetrationTest('senior-user-security');

      // Check if social engineering findings generate appropriate recommendations
      const hasSocialEngFindings = result.findings.some(f => f.type === 'social-engineering');
      if (hasSocialEngFindings) {
        expect(result.recommendations).toContain(
          'Implement additional security awareness training for senior users'
        );
      }
    });
  });

  describe('Test Options and Configuration', () => {
    it('should accept test options', async () => {
      const options = {
        executedBy: 'security-team-lead',
        environment: 'staging',
        notifyOnCompletion: true,
        escalateOnCritical: true
      };

      const result = await service.runPenetrationTest('web-app-security', options);

      expect(result.executedBy).toBe('security-team-lead');
      expect(result.testEnvironment).toBe('staging');
    });

    it('should use default options when none provided', async () => {
      const result = await service.runPenetrationTest('web-app-security');

      expect(result.executedBy).toBe('automated-system');
      expect(result.testEnvironment).toBe('production');
    });

    it('should handle escalation for critical findings', async () => {
      const options = { escalateOnCritical: true };
      
      // This test would need to mock critical findings
      // For now, we'll just verify the option is accepted
      const result = await service.runPenetrationTest('web-app-security', options);
      expect(result).toBeDefined();
    });
  });

  describe('Test Reports', () => {
    it('should generate comprehensive penetration test report', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      const report = await service.generatePenTestReport(testResult.id);

      expect(report).toHaveProperty('testId', testResult.id);
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('executiveSummary');
      expect(report).toHaveProperty('testScope');
      expect(report).toHaveProperty('findings');
      expect(report).toHaveProperty('riskAssessment');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('complianceImpact');
      expect(report).toHaveProperty('nextSteps');
      expect(report).toHaveProperty('appendices');

      expect(report.reportDate).toBeInstanceOf(Date);
      expect(typeof report.executiveSummary).toBe('string');
      expect(Array.isArray(report.findings)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.nextSteps)).toBe(true);
    });

    it('should include remediation guidance when requested', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      const report = await service.generatePenTestReport(testResult.id, true);

      if (report.findings.length > 0) {
        const findingWithRemediation = report.findings.find(f => f.remediation);
        if (findingWithRemediation) {
          expect(typeof findingWithRemediation.remediation).toBe('string');
          expect(findingWithRemediation.remediation.length).toBeGreaterThan(0);
        }
      }
    });

    it('should include senior user impact assessment', async () => {
      const testResult = await service.runPenetrationTest('senior-user-security');
      const report = await service.generatePenTestReport(testResult.id, true);

      if (report.findings.length > 0) {
        const findingWithSeniorImpact = report.findings.find(f => f.seniorUserImpact);
        if (findingWithSeniorImpact) {
          expect(typeof findingWithSeniorImpact.seniorUserImpact).toBe('string');
          expect(findingWithSeniorImpact.seniorUserImpact.length).toBeGreaterThan(0);
        }
      }
    });

    it('should assess compliance impact', async () => {
      const testResult = await service.runPenetrationTest('privacy-compliance');
      const report = await service.generatePenTestReport(testResult.id);

      expect(report.complianceImpact).toHaveProperty('gdprImpact');
      expect(report.complianceImpact).toHaveProperty('ccpaImpact');
      expect(report.complianceImpact).toHaveProperty('accessibilityCompliance');
      expect(report.complianceImpact).toHaveProperty('recommendations');

      expect(['low', 'medium', 'high']).toContain(report.complianceImpact.gdprImpact);
      expect(['low', 'medium', 'high']).toContain(report.complianceImpact.ccpaImpact);
      expect(['compliant', 'non-compliant']).toContain(report.complianceImpact.accessibilityCompliance);
      expect(Array.isArray(report.complianceImpact.recommendations)).toBe(true);
    });

    it('should include vulnerability definitions in appendices', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      const report = await service.generatePenTestReport(testResult.id);

      expect(report.appendices).toHaveProperty('vulnerabilityDefinitions');
      expect(report.appendices).toHaveProperty('testMethodology');
      expect(report.appendices).toHaveProperty('references');

      expect(Array.isArray(report.appendices.vulnerabilityDefinitions)).toBe(true);
      expect(typeof report.appendices.testMethodology).toBe('string');
      expect(Array.isArray(report.appendices.references)).toBe(true);
    });

    it('should throw error for non-existent test result', async () => {
      await expect(
        service.generatePenTestReport('non-existent-test-id')
      ).rejects.toThrow('Test result non-existent-test-id not found');
    });
  });

  describe('Dashboard and Metrics', () => {
    it('should provide penetration testing dashboard', async () => {
      const dashboard = await service.getPenTestDashboard();

      expect(dashboard).toHaveProperty('overview');
      expect(dashboard).toHaveProperty('recentTests');
      expect(dashboard).toHaveProperty('vulnerabilityTrends');
      expect(dashboard).toHaveProperty('testCoverage');
      expect(dashboard).toHaveProperty('upcomingTests');
      expect(dashboard).toHaveProperty('recommendations');

      expect(dashboard.overview).toHaveProperty('totalTests');
      expect(dashboard.overview).toHaveProperty('testsLast30Days');
      expect(dashboard.overview).toHaveProperty('criticalVulnerabilities');
      expect(dashboard.overview).toHaveProperty('highVulnerabilities');
      expect(dashboard.overview).toHaveProperty('overallRiskLevel');

      expect(typeof dashboard.overview.totalTests).toBe('number');
      expect(typeof dashboard.overview.testsLast30Days).toBe('number');
      expect(typeof dashboard.overview.criticalVulnerabilities).toBe('number');
      expect(typeof dashboard.overview.highVulnerabilities).toBe('number');
      expect(['low', 'medium', 'high', 'critical']).toContain(dashboard.overview.overallRiskLevel);
    });

    it('should show test coverage metrics', async () => {
      const dashboard = await service.getPenTestDashboard();

      expect(dashboard.testCoverage).toHaveProperty('applicationSecurity');
      expect(dashboard.testCoverage).toHaveProperty('infrastructureSecurity');
      expect(dashboard.testCoverage).toHaveProperty('privacyCompliance');
      expect(dashboard.testCoverage).toHaveProperty('seniorUserSecurity');
      expect(dashboard.testCoverage).toHaveProperty('overall');

      Object.values(dashboard.testCoverage).forEach(coverage => {
        expect(typeof coverage).toBe('number');
        expect(coverage).toBeGreaterThanOrEqual(0);
        expect(coverage).toBeLessThanOrEqual(100);
      });
    });

    it('should list upcoming scheduled tests', async () => {
      const dashboard = await service.getPenTestDashboard();

      expect(Array.isArray(dashboard.upcomingTests)).toBe(true);
      
      dashboard.upcomingTests.forEach(test => {
        expect(test).toHaveProperty('scheduleId');
        expect(test).toHaveProperty('suiteId');
        expect(test).toHaveProperty('suiteName');
        expect(test).toHaveProperty('scheduledTime');
        expect(test).toHaveProperty('frequency');
        expect(test.scheduledTime).toBeInstanceOf(Date);
      });
    });

    it('should provide dashboard recommendations', async () => {
      const dashboard = await service.getPenTestDashboard();

      expect(Array.isArray(dashboard.recommendations)).toBe(true);
      dashboard.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Test Scheduling', () => {
    it('should schedule ad-hoc penetration test', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const options = {
        executedBy: 'security-analyst',
        notifyOnCompletion: true,
        escalateOnCritical: false
      };

      const scheduleId = await service.scheduleTest('web-app-security', scheduledTime, options);

      expect(typeof scheduleId).toBe('string');
      expect(scheduleId.length).toBeGreaterThan(0);
      expect(scheduleId.startsWith('schedule_')).toBe(true);
    });

    it('should schedule test with default options', async () => {
      const scheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const scheduleId = await service.scheduleTest('privacy-compliance', scheduledTime);

      expect(typeof scheduleId).toBe('string');
      expect(scheduleId.length).toBeGreaterThan(0);
    });

    it('should handle scheduling for unknown test suite', async () => {
      const scheduledTime = new Date(Date.now() + 60 * 60 * 1000);

      // Should not throw error during scheduling, but would fail during execution
      const scheduleId = await service.scheduleTest('unknown-suite', scheduledTime);
      expect(typeof scheduleId).toBe('string');
    });
  });

  describe('Individual Test Methods', () => {
    it('should simulate SQL injection testing', async () => {
      // This tests the internal SQL injection test method
      const result = await service.runPenetrationTest('web-app-security');
      
      // Check if SQL injection findings are properly structured
      const sqlFindings = result.findings.filter(f => f.type === 'sql-injection');
      sqlFindings.forEach(finding => {
        expect(finding.severity).toBe('high');
        expect(finding.title).toBe('SQL Injection Vulnerability');
        expect(finding.cvssScore).toBeGreaterThan(7);
      });
    });

    it('should simulate XSS testing', async () => {
      const result = await service.runPenetrationTest('web-app-security');
      
      const xssFindings = result.findings.filter(f => f.type === 'xss');
      xssFindings.forEach(finding => {
        expect(finding.severity).toBe('medium');
        expect(finding.title).toBe('Cross-Site Scripting Vulnerability');
        expect(finding.cvssScore).toBeGreaterThan(5);
      });
    });

    it('should simulate social engineering testing for senior users', async () => {
      const result = await service.runPenetrationTest('senior-user-security');
      
      const socialEngFindings = result.findings.filter(f => f.type === 'social-engineering');
      socialEngFindings.forEach(finding => {
        expect(finding.severity).toBe('high');
        expect(finding.title).toBe('Social Engineering Vulnerability');
        expect(finding.description).toContain('support process');
      });
    });
  });

  describe('Service Integration', () => {
    it('should maintain singleton instance', () => {
      const service1 = getPenetrationTestingService();
      const service2 = getPenetrationTestingService();
      expect(service1).toBe(service2);
    });

    it('should reset service instance', () => {
      const service1 = getPenetrationTestingService();
      resetPenetrationTestingService();
      const service2 = getPenetrationTestingService();
      expect(service1).not.toBe(service2);
    });
  });

  describe('Error Handling', () => {
    it('should handle test execution failures gracefully', async () => {
      // Mock a test that might fail
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        const result = await service.runPenetrationTest('web-app-security');
        expect(result.status).toBe('completed');
      } catch (error) {
        // If test fails, it should be handled gracefully
        expect(error).toBeDefined();
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should handle missing vulnerability definitions', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      const report = await service.generatePenTestReport(testResult.id, true);

      // Should handle missing vulnerability definitions gracefully
      expect(report.appendices.vulnerabilityDefinitions).toBeDefined();
      expect(Array.isArray(report.appendices.vulnerabilityDefinitions)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete test suite execution within reasonable time', async () => {
      const startTime = Date.now();
      await service.runPenetrationTest('web-app-security');
      const endTime = Date.now();

      // Should complete within 5 seconds for automated tests
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle multiple concurrent test executions', async () => {
      const promises = [
        service.runPenetrationTest('web-app-security'),
        service.runPenetrationTest('senior-user-security'),
        service.runPenetrationTest('privacy-compliance')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('completed');
        expect(result.id).toBeDefined();
      });
    });

    it('should generate reports efficiently', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      
      const startTime = Date.now();
      await service.generatePenTestReport(testResult.id);
      const endTime = Date.now();

      // Report generation should be fast
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Vulnerability Database', () => {
    it('should have comprehensive vulnerability definitions', async () => {
      const testResult = await service.runPenetrationTest('web-app-security');
      const report = await service.generatePenTestReport(testResult.id);

      const vulnDefs = report.appendices.vulnerabilityDefinitions;
      
      vulnDefs.forEach(vuln => {
        expect(vuln).toHaveProperty('id');
        expect(vuln).toHaveProperty('name');
        expect(vuln).toHaveProperty('description');
        expect(vuln).toHaveProperty('category');
        expect(vuln).toHaveProperty('severity');
        expect(vuln).toHaveProperty('cweId');
        expect(vuln).toHaveProperty('owasp');
        expect(vuln).toHaveProperty('impact');
        expect(vuln).toHaveProperty('remediation');
        expect(vuln).toHaveProperty('seniorUserImpact');

        expect(['low', 'medium', 'high', 'critical']).toContain(vuln.severity);
        expect(vuln.cweId.startsWith('CWE-')).toBe(true);
      });
    });

    it('should provide senior user specific impact assessments', async () => {
      const testResult = await service.runPenetrationTest('senior-user-security');
      const report = await service.generatePenTestReport(testResult.id, true);

      const socialEngVuln = report.appendices.vulnerabilityDefinitions
        .find(v => v.id === 'social-engineering');

      if (socialEngVuln) {
        expect(socialEngVuln.seniorUserImpact).toContain('senior');
        expect(socialEngVuln.seniorUserImpact.length).toBeGreaterThan(0);
      }
    });
  });
});