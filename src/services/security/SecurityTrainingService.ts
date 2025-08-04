// Security Training Service for Development Team
import { getSecurityMonitoringService } from './SecurityMonitoringService';

export class SecurityTrainingService {
  private monitoringService = getSecurityMonitoringService();
  private trainingRecords: Map<string, SecurityTrainingRecord> = new Map();
  private trainingModules: Map<string, TrainingModule> = new Map();
  private certifications: Map<string, SecurityCertification> = new Map();

  constructor() {
    this.initializeTrainingModules();
  }

  /**
   * Initialize default security training modules
   */
  private initializeTrainingModules(): void {
    const modules: TrainingModule[] = [
      {
        id: 'secure-coding',
        title: 'Secure Coding Practices',
        description: 'Learn secure coding principles and common vulnerabilities',
        category: 'development',
        difficulty: 'intermediate',
        estimatedDuration: 120, // minutes
        topics: [
          'Input validation and sanitization',
          'SQL injection prevention',
          'Cross-site scripting (XSS) prevention',
          'Authentication and authorization',
          'Cryptography best practices',
          'Error handling and logging'
        ],
        prerequisites: ['basic-programming'],
        assessmentRequired: true,
        passingScore: 80,
        validityPeriod: 365 // days
      },
      {
        id: 'privacy-compliance',
        title: 'Privacy and Data Protection',
        description: 'Understanding GDPR, CCPA, and privacy-by-design principles',
        category: 'compliance',
        difficulty: 'beginner',
        estimatedDuration: 90,
        topics: [
          'GDPR requirements and user rights',
          'CCPA compliance for California residents',
          'Data minimization principles',
          'Consent management',
          'Privacy impact assessments',
          'Data breach response procedures'
        ],
        prerequisites: [],
        assessmentRequired: true,
        passingScore: 85,
        validityPeriod: 365
      },
      {
        id: 'incident-response',
        title: 'Security Incident Response',
        description: 'How to detect, respond to, and recover from security incidents',
        category: 'operations',
        difficulty: 'advanced',
        estimatedDuration: 150,
        topics: [
          'Incident detection and classification',
          'Containment and eradication procedures',
          'Evidence collection and forensics',
          'Communication and escalation',
          'Recovery and lessons learned',
          'Legal and regulatory considerations'
        ],
        prerequisites: ['secure-coding', 'privacy-compliance'],
        assessmentRequired: true,
        passingScore: 90,
        validityPeriod: 180
      },
      {
        id: 'senior-user-security',
        title: 'Security for Senior Users',
        description: 'Special considerations for senior user security and accessibility',
        category: 'specialized',
        difficulty: 'intermediate',
        estimatedDuration: 60,
        topics: [
          'Age-related security vulnerabilities',
          'Accessible security interfaces',
          'Social engineering targeting seniors',
          'Family and caregiver access controls',
          'Emergency support procedures',
          'Privacy education for seniors'
        ],
        prerequisites: ['privacy-compliance'],
        assessmentRequired: true,
        passingScore: 85,
        validityPeriod: 365
      },
      {
        id: 'penetration-testing',
        title: 'Penetration Testing Fundamentals',
        description: 'Introduction to ethical hacking and security testing',
        category: 'testing',
        difficulty: 'advanced',
        estimatedDuration: 180,
        topics: [
          'Penetration testing methodology',
          'Vulnerability assessment tools',
          'Web application security testing',
          'Network security testing',
          'Social engineering testing',
          'Reporting and remediation'
        ],
        prerequisites: ['secure-coding', 'incident-response'],
        assessmentRequired: true,
        passingScore: 85,
        validityPeriod: 180
      }
    ];

    modules.forEach(module => {
      this.trainingModules.set(module.id, module);
    });
  }

  /**
   * Enroll team member in security training
   */
  async enrollInTraining(
    teamMemberId: string,
    moduleId: string,
    role: string,
    department: string
  ): Promise<SecurityTrainingRecord> {
    const module = this.trainingModules.get(moduleId);
    if (!module) {
      throw new Error(`Training module ${moduleId} not found`);
    }

    // Check prerequisites
    const hasPrerequisites = await this.checkPrerequisites(teamMemberId, module.prerequisites);
    if (!hasPrerequisites) {
      throw new Error(`Prerequisites not met for module ${moduleId}`);
    }

    const trainingRecord: SecurityTrainingRecord = {
      id: this.generateTrainingId(),
      teamMemberId,
      moduleId,
      role,
      department,
      enrollmentDate: new Date(),
      status: 'enrolled',
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      remindersSent: 0
    };

    this.trainingRecords.set(trainingRecord.id, trainingRecord);

    // Log enrollment
    await this.monitoringService.logAuditEvent(
      'security_training_enrolled',
      trainingRecord.id,
      {
        teamMemberId,
        moduleId,
        role,
        department
      }
    );

    return trainingRecord;
  }

  /**
   * Update training progress
   */
  async updateTrainingProgress(
    trainingId: string,
    progress: number,
    completedTopics?: string[]
  ): Promise<void> {
    const record = this.trainingRecords.get(trainingId);
    if (!record) {
      throw new Error(`Training record ${trainingId} not found`);
    }

    record.progress = Math.min(progress, 100);
    record.lastAccessDate = new Date();
    
    if (completedTopics) {
      record.completedTopics = completedTopics;
    }

    if (progress >= 100) {
      record.status = 'completed';
      record.completionDate = new Date();
    }

    this.trainingRecords.set(trainingId, record);

    // Log progress update
    await this.monitoringService.logAuditEvent(
      'security_training_progress_updated',
      trainingId,
      {
        progress,
        status: record.status,
        completedTopics: completedTopics?.length || 0
      }
    );
  }

  /**
   * Submit training assessment
   */
  async submitAssessment(
    trainingId: string,
    answers: Record<string, any>,
    timeSpent: number
  ): Promise<AssessmentResult> {
    const record = this.trainingRecords.get(trainingId);
    if (!record) {
      throw new Error(`Training record ${trainingId} not found`);
    }

    const module = this.trainingModules.get(record.moduleId);
    if (!module) {
      throw new Error(`Training module ${record.moduleId} not found`);
    }

    record.attempts++;

    // Calculate score (mock implementation)
    const score = this.calculateAssessmentScore(answers, module);
    const passed = score >= module.passingScore;

    const result: AssessmentResult = {
      trainingId,
      attempt: record.attempts,
      score,
      passed,
      timeSpent,
      submittedAt: new Date(),
      feedback: this.generateAssessmentFeedback(score, module.passingScore, passed)
    };

    if (passed) {
      record.status = 'passed';
      record.completionDate = new Date();
      record.score = score;

      // Generate certification
      await this.generateCertification(record, module);
    } else if (record.attempts >= record.maxAttempts) {
      record.status = 'failed';
    } else {
      record.status = 'retry_required';
    }

    record.lastAssessmentDate = new Date();
    this.trainingRecords.set(trainingId, record);

    // Log assessment submission
    await this.monitoringService.logAuditEvent(
      'security_training_assessment_submitted',
      trainingId,
      {
        attempt: record.attempts,
        score,
        passed,
        timeSpent
      }
    );

    return result;
  }

  /**
   * Generate security certification
   */
  async generateCertification(
    trainingRecord: SecurityTrainingRecord,
    module: TrainingModule
  ): Promise<SecurityCertification> {
    const certification: SecurityCertification = {
      id: this.generateCertificationId(),
      teamMemberId: trainingRecord.teamMemberId,
      moduleId: module.id,
      moduleTitle: module.title,
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + module.validityPeriod * 24 * 60 * 60 * 1000),
      score: trainingRecord.score || 0,
      certificateUrl: await this.generateCertificateUrl(trainingRecord, module),
      status: 'active'
    };

    this.certifications.set(certification.id, certification);

    // Log certification issuance
    await this.monitoringService.logAuditEvent(
      'security_certification_issued',
      certification.id,
      {
        teamMemberId: trainingRecord.teamMemberId,
        moduleId: module.id,
        score: certification.score,
        expiryDate: certification.expiryDate
      }
    );

    return certification;
  }

  /**
   * Get team member's training status
   */
  async getTrainingStatus(teamMemberId: string): Promise<TeamMemberTrainingStatus> {
    const records = Array.from(this.trainingRecords.values())
      .filter(record => record.teamMemberId === teamMemberId);

    const certifications = Array.from(this.certifications.values())
      .filter(cert => cert.teamMemberId === teamMemberId);

    const requiredModules = Array.from(this.trainingModules.values())
      .filter(module => this.isModuleRequiredForRole(module, records[0]?.role || 'developer'));

    const completedModules = records.filter(record => record.status === 'passed');
    const expiredCertifications = certifications.filter(cert => 
      cert.expiryDate < new Date() && cert.status === 'active'
    );

    return {
      teamMemberId,
      overallComplianceStatus: this.calculateComplianceStatus(records, requiredModules),
      requiredTrainings: requiredModules.length,
      completedTrainings: completedModules.length,
      pendingTrainings: records.filter(record => 
        ['enrolled', 'in_progress', 'retry_required'].includes(record.status)
      ).length,
      expiredCertifications: expiredCertifications.length,
      nextDueDate: this.getNextDueDate(records),
      recentActivity: records
        .sort((a, b) => (b.lastAccessDate || b.enrollmentDate).getTime() - 
                       (a.lastAccessDate || a.enrollmentDate).getTime())
        .slice(0, 5),
      activeCertifications: certifications.filter(cert => 
        cert.status === 'active' && cert.expiryDate > new Date()
      )
    };
  }

  /**
   * Get team-wide training dashboard
   */
  async getTeamTrainingDashboard(): Promise<TeamTrainingDashboard> {
    const allRecords = Array.from(this.trainingRecords.values());
    const allCertifications = Array.from(this.certifications.values());

    const teamMembers = [...new Set(allRecords.map(record => record.teamMemberId))];
    
    const dashboard: TeamTrainingDashboard = {
      overview: {
        totalTeamMembers: teamMembers.length,
        fullyCompliant: 0,
        partiallyCompliant: 0,
        nonCompliant: 0,
        expiredCertifications: 0
      },
      trainingMetrics: {
        totalEnrollments: allRecords.length,
        completionRate: 0,
        averageScore: 0,
        averageTimeToComplete: 0
      },
      complianceByDepartment: {},
      upcomingDeadlines: [],
      recentCompletions: [],
      recommendations: []
    };

    // Calculate metrics
    for (const memberId of teamMembers) {
      const status = await this.getTrainingStatus(memberId);
      
      switch (status.overallComplianceStatus) {
        case 'compliant':
          dashboard.overview.fullyCompliant++;
          break;
        case 'partially_compliant':
          dashboard.overview.partiallyCompliant++;
          break;
        case 'non_compliant':
          dashboard.overview.nonCompliant++;
          break;
      }

      dashboard.overview.expiredCertifications += status.expiredCertifications;
    }

    const completedRecords = allRecords.filter(record => record.status === 'passed');
    dashboard.trainingMetrics.completionRate = 
      allRecords.length > 0 ? (completedRecords.length / allRecords.length) * 100 : 0;

    if (completedRecords.length > 0) {
      dashboard.trainingMetrics.averageScore = 
        completedRecords.reduce((sum, record) => sum + (record.score || 0), 0) / completedRecords.length;
    }

    // Generate recommendations
    dashboard.recommendations = this.generateTrainingRecommendations(dashboard);

    return dashboard;
  }

  /**
   * Send training reminders
   */
  async sendTrainingReminders(): Promise<void> {
    const overdueRecords = Array.from(this.trainingRecords.values())
      .filter(record => 
        record.dueDate < new Date() && 
        !['passed', 'failed'].includes(record.status)
      );

    for (const record of overdueRecords) {
      await this.sendReminderNotification(record);
      record.remindersSent++;
      this.trainingRecords.set(record.id, record);
    }
  }

  /**
   * Generate training compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<TrainingComplianceReport> {
    const records = Array.from(this.trainingRecords.values())
      .filter(record => 
        record.enrollmentDate >= startDate && record.enrollmentDate <= endDate
      );

    const certifications = Array.from(this.certifications.values())
      .filter(cert => 
        cert.issuedDate >= startDate && cert.issuedDate <= endDate
      );

    return {
      reportPeriod: { start: startDate, end: endDate },
      summary: {
        totalEnrollments: records.length,
        completedTrainings: records.filter(r => r.status === 'passed').length,
        failedTrainings: records.filter(r => r.status === 'failed').length,
        inProgressTrainings: records.filter(r => 
          ['enrolled', 'in_progress', 'retry_required'].includes(r.status)
        ).length,
        certificationsIssued: certifications.length,
        averageCompletionTime: this.calculateAverageCompletionTime(records),
        complianceRate: this.calculateOverallComplianceRate()
      },
      departmentBreakdown: this.generateDepartmentBreakdown(records),
      modulePerformance: this.generateModulePerformance(records),
      trends: this.analyzeTrends(records),
      recommendations: this.generateComplianceRecommendations(records)
    };
  }

  // Helper methods
  private async checkPrerequisites(teamMemberId: string, prerequisites: string[]): Promise<boolean> {
    if (prerequisites.length === 0) return true;

    const memberRecords = Array.from(this.trainingRecords.values())
      .filter(record => 
        record.teamMemberId === teamMemberId && record.status === 'passed'
      );

    const completedModules = memberRecords.map(record => record.moduleId);
    
    return prerequisites.every(prereq => completedModules.includes(prereq));
  }

  private calculateAssessmentScore(answers: Record<string, any>, module: TrainingModule): number {
    // Mock implementation - in real system would compare against correct answers
    const totalQuestions = Object.keys(answers).length;
    const correctAnswers = Math.floor(totalQuestions * 0.85); // Simulate 85% correct
    return Math.round((correctAnswers / totalQuestions) * 100);
  }

  private generateAssessmentFeedback(score: number, passingScore: number, passed: boolean): string {
    if (passed) {
      return `Congratulations! You scored ${score}% and passed the assessment.`;
    } else {
      return `You scored ${score}%, which is below the passing score of ${passingScore}%. Please review the material and try again.`;
    }
  }

  private async generateCertificateUrl(record: SecurityTrainingRecord, module: TrainingModule): Promise<string> {
    // Mock implementation - would generate actual certificate
    return `https://certificates.example.com/${record.id}`;
  }

  private isModuleRequiredForRole(module: TrainingModule, role: string): boolean {
    // Define role-based requirements
    const roleRequirements: Record<string, string[]> = {
      'developer': ['secure-coding', 'privacy-compliance', 'senior-user-security'],
      'security-engineer': ['secure-coding', 'privacy-compliance', 'incident-response', 'penetration-testing'],
      'product-manager': ['privacy-compliance', 'senior-user-security'],
      'qa-engineer': ['secure-coding', 'privacy-compliance', 'penetration-testing'],
      'devops': ['secure-coding', 'incident-response', 'penetration-testing']
    };

    return roleRequirements[role]?.includes(module.id) || false;
  }

  private calculateComplianceStatus(
    records: SecurityTrainingRecord[], 
    requiredModules: TrainingModule[]
  ): 'compliant' | 'partially_compliant' | 'non_compliant' {
    const completedRequired = records.filter(record => 
      record.status === 'passed' && 
      requiredModules.some(module => module.id === record.moduleId)
    ).length;

    if (completedRequired === requiredModules.length) {
      return 'compliant';
    } else if (completedRequired > 0) {
      return 'partially_compliant';
    } else {
      return 'non_compliant';
    }
  }

  private getNextDueDate(records: SecurityTrainingRecord[]): Date | null {
    const pendingRecords = records.filter(record => 
      !['passed', 'failed'].includes(record.status)
    );

    if (pendingRecords.length === 0) return null;

    return pendingRecords.reduce((earliest, record) => 
      record.dueDate < earliest ? record.dueDate : earliest, 
      pendingRecords[0].dueDate
    );
  }

  private generateTrainingRecommendations(dashboard: TeamTrainingDashboard): string[] {
    const recommendations = [];

    if (dashboard.overview.nonCompliant > dashboard.overview.totalTeamMembers * 0.2) {
      recommendations.push('High number of non-compliant team members - consider mandatory training sessions');
    }

    if (dashboard.trainingMetrics.completionRate < 80) {
      recommendations.push('Low completion rate - review training content and delivery methods');
    }

    if (dashboard.overview.expiredCertifications > 0) {
      recommendations.push('Schedule refresher training for expired certifications');
    }

    return recommendations;
  }

  private calculateAverageCompletionTime(records: SecurityTrainingRecord[]): number {
    const completedRecords = records.filter(record => 
      record.status === 'passed' && record.completionDate && record.enrollmentDate
    );

    if (completedRecords.length === 0) return 0;

    const totalTime = completedRecords.reduce((sum, record) => {
      const completionTime = record.completionDate!.getTime() - record.enrollmentDate.getTime();
      return sum + completionTime;
    }, 0);

    return totalTime / completedRecords.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  private calculateOverallComplianceRate(): number {
    // Mock implementation
    return 85; // 85% compliance rate
  }

  private generateDepartmentBreakdown(records: SecurityTrainingRecord[]): Record<string, any> {
    const departments = [...new Set(records.map(record => record.department))];
    const breakdown: Record<string, any> = {};

    departments.forEach(dept => {
      const deptRecords = records.filter(record => record.department === dept);
      breakdown[dept] = {
        totalEnrollments: deptRecords.length,
        completionRate: (deptRecords.filter(r => r.status === 'passed').length / deptRecords.length) * 100,
        averageScore: deptRecords
          .filter(r => r.score)
          .reduce((sum, r) => sum + r.score!, 0) / deptRecords.filter(r => r.score).length || 0
      };
    });

    return breakdown;
  }

  private generateModulePerformance(records: SecurityTrainingRecord[]): Record<string, any> {
    const modules = [...new Set(records.map(record => record.moduleId))];
    const performance: Record<string, any> = {};

    modules.forEach(moduleId => {
      const moduleRecords = records.filter(record => record.moduleId === moduleId);
      performance[moduleId] = {
        enrollments: moduleRecords.length,
        completionRate: (moduleRecords.filter(r => r.status === 'passed').length / moduleRecords.length) * 100,
        averageScore: moduleRecords
          .filter(r => r.score)
          .reduce((sum, r) => sum + r.score!, 0) / moduleRecords.filter(r => r.score).length || 0,
        averageAttempts: moduleRecords.reduce((sum, r) => sum + r.attempts, 0) / moduleRecords.length
      };
    });

    return performance;
  }

  private analyzeTrends(records: SecurityTrainingRecord[]): any {
    return {
      enrollmentTrend: 'increasing',
      completionTrend: 'stable',
      scoreTrend: 'improving'
    };
  }

  private generateComplianceRecommendations(records: SecurityTrainingRecord[]): string[] {
    return [
      'Implement regular refresher training sessions',
      'Create role-specific training paths',
      'Improve assessment quality and feedback',
      'Establish peer mentoring programs'
    ];
  }

  private async sendReminderNotification(record: SecurityTrainingRecord): Promise<void> {
    console.log(`Training reminder sent to ${record.teamMemberId} for module ${record.moduleId}`);
  }

  private generateTrainingId(): string {
    return `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCertificationId(): string {
    return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Types for security training
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: 'development' | 'compliance' | 'operations' | 'specialized' | 'testing';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  topics: string[];
  prerequisites: string[];
  assessmentRequired: boolean;
  passingScore: number;
  validityPeriod: number; // days
}

interface SecurityTrainingRecord {
  id: string;
  teamMemberId: string;
  moduleId: string;
  role: string;
  department: string;
  enrollmentDate: Date;
  status: 'enrolled' | 'in_progress' | 'completed' | 'passed' | 'failed' | 'retry_required';
  progress: number; // 0-100
  attempts: number;
  maxAttempts: number;
  score?: number;
  dueDate: Date;
  completionDate?: Date;
  lastAccessDate?: Date;
  lastAssessmentDate?: Date;
  completedTopics?: string[];
  remindersSent: number;
}

interface SecurityCertification {
  id: string;
  teamMemberId: string;
  moduleId: string;
  moduleTitle: string;
  issuedDate: Date;
  expiryDate: Date;
  score: number;
  certificateUrl: string;
  status: 'active' | 'expired' | 'revoked';
}

interface AssessmentResult {
  trainingId: string;
  attempt: number;
  score: number;
  passed: boolean;
  timeSpent: number; // minutes
  submittedAt: Date;
  feedback: string;
}

interface TeamMemberTrainingStatus {
  teamMemberId: string;
  overallComplianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
  requiredTrainings: number;
  completedTrainings: number;
  pendingTrainings: number;
  expiredCertifications: number;
  nextDueDate: Date | null;
  recentActivity: SecurityTrainingRecord[];
  activeCertifications: SecurityCertification[];
}

interface TeamTrainingDashboard {
  overview: {
    totalTeamMembers: number;
    fullyCompliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    expiredCertifications: number;
  };
  trainingMetrics: {
    totalEnrollments: number;
    completionRate: number;
    averageScore: number;
    averageTimeToComplete: number;
  };
  complianceByDepartment: Record<string, any>;
  upcomingDeadlines: any[];
  recentCompletions: any[];
  recommendations: string[];
}

interface TrainingComplianceReport {
  reportPeriod: { start: Date; end: Date };
  summary: {
    totalEnrollments: number;
    completedTrainings: number;
    failedTrainings: number;
    inProgressTrainings: number;
    certificationsIssued: number;
    averageCompletionTime: number;
    complianceRate: number;
  };
  departmentBreakdown: Record<string, any>;
  modulePerformance: Record<string, any>;
  trends: any;
  recommendations: string[];
}

// Singleton instance
let securityTrainingServiceInstance: SecurityTrainingService | null = null;

export function getSecurityTrainingService(): SecurityTrainingService {
  if (!securityTrainingServiceInstance) {
    securityTrainingServiceInstance = new SecurityTrainingService();
  }
  return securityTrainingServiceInstance;
}

export function resetSecurityTrainingService(): void {
  securityTrainingServiceInstance = null;
}