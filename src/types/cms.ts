// Content Management System Types

export interface ContentItem {
  id: string;
  type: 'tutorial' | 'exercise' | 'assessment' | 'quick-reference';
  title: string;
  description: string;
  content: ContentData;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version: number;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  tags: string[];
  category: string;
  prerequisites: string[];
  learningObjectives: string[];
  accessibility: AccessibilityMetadata;
  localizations: Record<string, LocalizedContentData>;
  reviewHistory: ContentReview[];
  analytics: ContentAnalytics;
}

export interface ContentData {
  sections: ContentSection[];
  exercises: Exercise[];
  resources: Resource[];
  printableGuide?: PrintableGuide;
}

export interface ContentSection {
  id: string;
  title: string;
  content: string; // Rich text/HTML content
  media: MediaAsset[];
  interactiveElements: InteractiveElement[];
  estimatedReadTime: number;
  accessibilityNotes?: string;
}

export interface Exercise {
  id: string;
  title: string;
  instructions: string;
  type: 'practice' | 'quiz' | 'hands-on' | 'reflection';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  questions: ExerciseQuestion[];
  feedback: ExerciseFeedback;
  hints: string[];
}

export interface ExerciseQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'drag-drop';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  media?: MediaAsset;
}

export interface ExerciseFeedback {
  correct: string;
  incorrect: string;
  partial?: string;
  encouragement: string;
  nextSteps?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'link' | 'download' | 'video' | 'reference';
  url: string;
  description: string;
  isPrintable: boolean;
}

export interface PrintableGuide {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  stepByStep: PrintableStep[];
  troubleshooting: TroubleshootingItem[];
  additionalResources: string[];
}

export interface PrintableStep {
  stepNumber: number;
  title: string;
  description: string;
  image?: string;
  tips?: string[];
}

export interface TroubleshootingItem {
  problem: string;
  solution: string;
  additionalHelp?: string;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'animation';
  url: string;
  altText?: string;
  caption?: string;
  transcript?: string;
  duration?: number;
  thumbnailUrl?: string;
  accessibilityDescription?: string;
}

export interface InteractiveElement {
  id: string;
  type: 'quiz' | 'practice' | 'simulation' | 'checklist' | 'demo';
  title: string;
  instructions: string;
  data: any;
  accessibilityInstructions?: string;
}

export interface AccessibilityMetadata {
  screenReaderOptimized: boolean;
  keyboardNavigable: boolean;
  highContrastCompatible: boolean;
  reducedMotionVersion: boolean;
  alternativeFormats: string[];
  readabilityScore: number;
  cognitiveLoadLevel: 'low' | 'medium' | 'high';
  estimatedCognitiveTime: number; // minutes for processing
}

export interface LocalizedContentData {
  language: string;
  title: string;
  description: string;
  content: ContentData;
  culturalAdaptations: CulturalAdaptation[];
  translationQuality: TranslationQuality;
  lastUpdated: Date;
}

export interface CulturalAdaptation {
  region: string;
  adaptations: Record<string, string>;
  examples: string[];
  colorPreferences?: string[];
  culturalNotes?: string;
}

export interface TranslationQuality {
  score: number; // 0-100
  reviewedBy?: string;
  reviewedAt?: Date;
  issues: TranslationIssue[];
  status: 'pending' | 'reviewed' | 'approved';
}

export interface TranslationIssue {
  type: 'grammar' | 'cultural' | 'technical' | 'clarity';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface ContentReview {
  id: string;
  contentId: string;
  reviewerId: string;
  reviewerName: string;
  type: 'content' | 'accessibility' | 'translation' | 'technical';
  status: 'pending' | 'approved' | 'rejected' | 'needs-revision';
  feedback: ReviewFeedback;
  reviewedAt: Date;
  version: number;
}

export interface ReviewFeedback {
  overall: string;
  accessibility: AccessibilityReview;
  content: ContentQualityReview;
  technical: TechnicalReview;
  recommendations: string[];
  requiredChanges: string[];
}

export interface AccessibilityReview {
  score: number; // 0-100
  issues: AccessibilityIssue[];
  recommendations: string[];
  wcagCompliance: boolean;
}

export interface AccessibilityIssue {
  type: 'contrast' | 'navigation' | 'screen-reader' | 'cognitive-load';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface ContentQualityReview {
  readabilityScore: number;
  seniorFriendliness: number; // 0-100
  clarity: number; // 0-100
  completeness: number; // 0-100
  accuracy: number; // 0-100
  engagement: number; // 0-100
  suggestions: string[];
}

export interface TechnicalReview {
  functionalityScore: number; // 0-100
  performanceScore: number; // 0-100
  compatibilityScore: number; // 0-100
  securityScore: number; // 0-100
  issues: TechnicalIssue[];
}

export interface TechnicalIssue {
  type: 'performance' | 'compatibility' | 'security' | 'functionality';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  solution?: string;
}

export interface ContentAnalytics {
  views: number;
  completions: number;
  averageTimeSpent: number; // minutes
  userRatings: UserRating[];
  averageRating: number;
  difficultyFeedback: DifficultyFeedback;
  accessibilityUsage: AccessibilityUsage;
  lastAnalyzed: Date;
}

export interface UserRating {
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  helpful: boolean;
  timestamp: Date;
}

export interface DifficultyFeedback {
  tooEasy: number;
  justRight: number;
  tooHard: number;
  averagePerceivedDifficulty: number; // 1-5
}

export interface AccessibilityUsage {
  screenReaderUsers: number;
  keyboardOnlyUsers: number;
  highContrastUsers: number;
  reducedMotionUsers: number;
  printableGuideDownloads: number;
}

// Content Creation and Management Types
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'tutorial' | 'exercise' | 'assessment' | 'quick-reference';
  structure: TemplateSection[];
  defaultSettings: ContentSettings;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'text' | 'media' | 'exercise' | 'resource';
  required: boolean;
  placeholder: string;
  guidelines: string;
}

export interface ContentSettings {
  autoSave: boolean;
  versionControl: boolean;
  accessibilityChecks: boolean;
  translationRequired: boolean;
  reviewRequired: boolean;
  publishingWorkflow: 'immediate' | 'scheduled' | 'approval-required';
}

// Content Editor Types
export interface EditorState {
  contentId: string;
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSaved: Date;
  currentVersion: number;
  previewMode: boolean;
  accessibilityMode: boolean;
}

export interface EditorAction {
  type: 'save' | 'preview' | 'publish' | 'revert' | 'duplicate';
  payload?: any;
}

// Workflow Types
export interface ContentWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'active' | 'completed' | 'cancelled';
  assignedTo: string[];
  dueDate?: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'approval' | 'translation' | 'accessibility-check';
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: Date;
  notes?: string;
}

// Search and Filter Types
export interface ContentFilter {
  type?: string[];
  status?: string[];
  difficulty?: string[];
  category?: string[];
  tags?: string[];
  author?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  accessibility?: {
    screenReaderOptimized?: boolean;
    keyboardNavigable?: boolean;
    highContrastCompatible?: boolean;
  };
}

export interface ContentSearchResult {
  items: ContentItem[];
  total: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  types: FacetCount[];
  statuses: FacetCount[];
  difficulties: FacetCount[];
  categories: FacetCount[];
  authors: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// Notification Types
export interface ContentNotification {
  id: string;
  type: 'review-requested' | 'content-published' | 'translation-needed' | 'accessibility-issue';
  contentId: string;
  contentTitle: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  recipients: string[];
  createdAt: Date;
  readBy: Record<string, Date>;
}

// Version Control Types
export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  changes: VersionChange[];
  createdBy: string;
  createdAt: Date;
  comment?: string;
  size: number; // bytes
}

export interface VersionChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

// Import/Export Types
export interface ContentExport {
  format: 'json' | 'csv' | 'pdf' | 'docx';
  items: string[]; // content IDs
  includeAnalytics: boolean;
  includeVersionHistory: boolean;
  includeReviews: boolean;
}

export interface ContentImport {
  format: 'json' | 'csv' | 'docx';
  data: any;
  mapping: ImportMapping;
  validation: ImportValidation;
}

export interface ImportMapping {
  fields: Record<string, string>;
  defaultValues: Record<string, any>;
}

export interface ImportValidation {
  errors: ImportError[];
  warnings: ImportWarning[];
  valid: boolean;
}

export interface ImportError {
  row?: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  row?: number;
  field: string;
  message: string;
  suggestion: string;
}