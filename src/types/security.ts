// Security and Privacy Types for Senior Learning Platform

// Encryption Configuration Types
export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  mode: string;
  padding?: string;
}

export interface KeyManagementConfig {
  provider: 'firebase' | 'aws-kms' | 'local';
  keyRotationInterval: number; // days
  backupKeys: boolean;
}

// Data Protection Types
export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  retention: number; // days
  encryptionRequired: boolean;
  accessControls: AccessControl[];
}

export interface AccessControl {
  role: string;
  permissions: Permission[];
  conditions?: AccessCondition[];
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'export';
  resource: string;
  granted: boolean;
}

export interface AccessCondition {
  type: 'time' | 'location' | 'device' | 'mfa';
  value: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
}

// Privacy Compliance Types
export interface PrivacyPolicy {
  version: string;
  effectiveDate: Date;
  dataTypes: DataTypePolicy[];
  userRights: UserRight[];
  retentionPolicies: RetentionPolicy[];
  thirdPartySharing: ThirdPartyPolicy[];
}

export interface DataTypePolicy {
  type: string;
  purpose: string;
  legalBasis: string;
  retention: number; // days
  sharing: boolean;
  userControl: boolean;
}

export interface UserRight {
  right: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  description: string;
  process: string;
  timeframe: number; // days
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  deletionMethod: 'soft' | 'hard' | 'anonymization';
  exceptions: string[];
}

export interface ThirdPartyPolicy {
  provider: string;
  purpose: string;
  dataTypes: string[];
  safeguards: string[];
  userConsent: boolean;
}

// Consent Management Types
export interface ConsentRecord {
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  version: string;
  method: 'explicit' | 'implicit' | 'opt-out';
  evidence: ConsentEvidence;
}

export interface ConsentEvidence {
  ipAddress: string;
  userAgent: string;
  formData?: Record<string, any>;
  checkboxes?: string[];
  signature?: string;
}

export interface ConsentRequest {
  type: string;
  purpose: string;
  dataTypes: string[];
  required: boolean;
  description: string;
  consequences?: string;
}

// Data Subject Rights Types
export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  description: string;
  response?: DataSubjectResponse;
}

export interface DataSubjectResponse {
  data?: any;
  actions: string[];
  explanation: string;
  appealProcess?: string;
}

// Security Monitoring Types
export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data-access' | 'system' | 'privacy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  source: string;
  details: SecurityEventDetails;
  resolved: boolean;
}

export interface SecurityEventDetails {
  action: string;
  resource?: string;
  outcome: 'success' | 'failure' | 'blocked';
  metadata: Record<string, any>;
  riskScore?: number;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  assignedTo?: string;
}

// Incident Response Types
export interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  reportedAt: Date;
  detectedAt?: Date;
  resolvedAt?: Date;
  description: string;
  impact: IncidentImpact;
  response: IncidentResponse;
}

export interface IncidentImpact {
  usersAffected: number;
  dataCompromised: boolean;
  servicesImpacted: string[];
  estimatedCost?: number;
}

export interface IncidentResponse {
  timeline: ResponseAction[];
  containmentActions: string[];
  recoveryActions: string[];
  lessonsLearned: string[];
  preventiveMeasures: string[];
}

export interface ResponseAction {
  timestamp: Date;
  action: string;
  performer: string;
  outcome: string;
}

// Audit Types
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure';
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
}

export interface AuditDetails {
  method: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  changes?: ChangeRecord[];
  reason?: string;
}

export interface ChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

// Security Configuration Types
export interface SecurityConfig {
  encryption: {
    inTransit: EncryptionConfig;
    atRest: EncryptionConfig;
    keyManagement: KeyManagementConfig;
  };
  authentication: {
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: PasswordPolicy;
    lockoutPolicy: LockoutPolicy;
  };
  authorization: {
    rbacEnabled: boolean;
    defaultRole: string;
    permissionModel: 'allow' | 'deny';
  };
  monitoring: {
    auditingEnabled: boolean;
    alertingEnabled: boolean;
    retentionPeriod: number; // days
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventReuse: number;
  maxAge: number; // days
}

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDuration: number; // minutes
  progressiveLockout: boolean;
}

// Data Export Types
export interface DataExportRequest {
  id: string;
  userId: string;
  format: 'json' | 'csv' | 'xml' | 'pdf';
  dataTypes: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: Date;
  completionDate?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataExportResult {
  requestId: string;
  files: ExportFile[];
  metadata: ExportMetadata;
  checksum: string;
}

export interface ExportFile {
  name: string;
  type: string;
  size: number;
  url: string;
  encrypted: boolean;
}

export interface ExportMetadata {
  exportDate: Date;
  dataTypes: string[];
  recordCount: number;
  format: string;
  version: string;
}

// Data Deletion Types
export interface DataDeletionRequest {
  id: string;
  userId: string;
  type: 'partial' | 'complete';
  dataTypes?: string[];
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: Date;
  scheduledDate?: Date;
  completionDate?: Date;
  verification: DeletionVerification;
}

export interface DeletionVerification {
  method: 'email' | 'sms' | 'authenticator';
  code: string;
  verified: boolean;
  verifiedAt?: Date;
  attempts: number;
}

export interface DeletionResult {
  requestId: string;
  deletedRecords: Record<string, number>;
  retainedRecords: Record<string, string>; // reason for retention
  completionDate: Date;
  certificate?: string;
}