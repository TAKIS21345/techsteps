// Content Management Service
import { 
  ContentItem, 
  ContentData, 
  ContentFilter, 
  ContentSearchResult, 
  ContentReview, 
  ContentVersion,
  AccessibilityMetadata,
  ContentTemplate,
  ContentWorkflow,
  ContentNotification,
  PrintableGuide,
  TranslationQuality
} from '../types/cms';

// Mock data for development - in production this would connect to Firebase/Firestore
const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'tutorial-email-basics',
    type: 'tutorial',
    title: 'Email Basics for Beginners',
    description: 'Learn how to send, receive, and organize your emails safely and effectively.',
    content: {
      sections: [
        {
          id: 'section-1',
          title: 'What is Email?',
          content: '<p>Email is like sending letters through the computer...</p>',
          media: [],
          interactiveElements: [],
          estimatedReadTime: 5
        }
      ],
      exercises: [],
      resources: []
    },
    difficulty: 'beginner',
    estimatedDuration: 30,
    status: 'published',
    version: 1,
    authorId: 'author-1',
    authorName: 'Sarah Johnson',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    publishedAt: new Date('2024-01-20'),
    tags: ['email', 'communication', 'basics'],
    category: 'Communication',
    prerequisites: [],
    learningObjectives: ['Understand what email is', 'Send your first email', 'Organize your inbox'],
    accessibility: {
      screenReaderOptimized: true,
      keyboardNavigable: true,
      highContrastCompatible: true,
      reducedMotionVersion: true,
      alternativeFormats: ['audio', 'large-print'],
      readabilityScore: 85,
      cognitiveLoadLevel: 'low',
      estimatedCognitiveTime: 25
    },
    localizations: {},
    reviewHistory: [],
    analytics: {
      views: 1250,
      completions: 980,
      averageTimeSpent: 28,
      userRatings: [],
      averageRating: 4.6,
      difficultyFeedback: {
        tooEasy: 15,
        justRight: 850,
        tooHard: 115,
        averagePerceivedDifficulty: 2.1
      },
      accessibilityUsage: {
        screenReaderUsers: 45,
        keyboardOnlyUsers: 23,
        highContrastUsers: 67,
        reducedMotionUsers: 34,
        printableGuideDownloads: 156
      },
      lastAnalyzed: new Date()
    }
  }
];

const MOCK_TEMPLATES: ContentTemplate[] = [
  {
    id: 'tutorial-template',
    name: 'Tutorial Template',
    description: 'Standard template for creating step-by-step tutorials',
    type: 'tutorial',
    structure: [
      {
        id: 'intro',
        name: 'Introduction',
        type: 'text',
        required: true,
        placeholder: 'Introduce what the user will learn...',
        guidelines: 'Keep it simple and encouraging. Explain the benefit to the user.'
      },
      {
        id: 'steps',
        name: 'Step-by-step Instructions',
        type: 'text',
        required: true,
        placeholder: 'Break down the process into clear steps...',
        guidelines: 'Use numbered steps. Include screenshots. Keep language simple.'
      },
      {
        id: 'practice',
        name: 'Practice Exercise',
        type: 'exercise',
        required: false,
        placeholder: 'Add a hands-on practice activity...',
        guidelines: 'Let users practice what they learned in a safe environment.'
      }
    ],
    defaultSettings: {
      autoSave: true,
      versionControl: true,
      accessibilityChecks: true,
      translationRequired: false,
      reviewRequired: true,
      publishingWorkflow: 'approval-required'
    }
  }
];

class ContentManagementService {
  // Content CRUD Operations
  async createContent(contentData: Partial<ContentItem>): Promise<ContentItem> {
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      type: contentData.type || 'tutorial',
      title: contentData.title || 'Untitled Content',
      description: contentData.description || '',
      content: contentData.content || { sections: [], exercises: [], resources: [] },
      difficulty: contentData.difficulty || 'beginner',
      estimatedDuration: contentData.estimatedDuration || 15,
      status: 'draft',
      version: 1,
      authorId: contentData.authorId || 'current-user',
      authorName: contentData.authorName || 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: contentData.tags || [],
      category: contentData.category || 'General',
      prerequisites: contentData.prerequisites || [],
      learningObjectives: contentData.learningObjectives || [],
      accessibility: this.generateAccessibilityMetadata(contentData.content),
      localizations: {},
      reviewHistory: [],
      analytics: {
        views: 0,
        completions: 0,
        averageTimeSpent: 0,
        userRatings: [],
        averageRating: 0,
        difficultyFeedback: {
          tooEasy: 0,
          justRight: 0,
          tooHard: 0,
          averagePerceivedDifficulty: 0
        },
        accessibilityUsage: {
          screenReaderUsers: 0,
          keyboardOnlyUsers: 0,
          highContrastUsers: 0,
          reducedMotionUsers: 0,
          printableGuideDownloads: 0
        },
        lastAnalyzed: new Date()
      }
    };

    // In production, save to database
    MOCK_CONTENT_ITEMS.push(newContent);
    return newContent;
  }

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
    const index = MOCK_CONTENT_ITEMS.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Content not found');
    }

    const existingContent = MOCK_CONTENT_ITEMS[index];
    const updatedContent: ContentItem = {
      ...existingContent,
      ...updates,
      updatedAt: new Date(),
      version: existingContent.version + 1,
      accessibility: this.generateAccessibilityMetadata(updates.content || existingContent.content)
    };

    MOCK_CONTENT_ITEMS[index] = updatedContent;
    return updatedContent;
  }

  async getContent(id: string): Promise<ContentItem | null> {
    return MOCK_CONTENT_ITEMS.find(item => item.id === id) || null;
  }

  async deleteContent(id: string): Promise<boolean> {
    const index = MOCK_CONTENT_ITEMS.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    MOCK_CONTENT_ITEMS.splice(index, 1);
    return true;
  }

  // Search and Filter
  async searchContent(
    query: string = '', 
    filter: ContentFilter = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ContentSearchResult> {
    let filteredItems = [...MOCK_CONTENT_ITEMS];

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filter.type?.length) {
      filteredItems = filteredItems.filter(item => filter.type!.includes(item.type));
    }
    if (filter.status?.length) {
      filteredItems = filteredItems.filter(item => filter.status!.includes(item.status));
    }
    if (filter.difficulty?.length) {
      filteredItems = filteredItems.filter(item => filter.difficulty!.includes(item.difficulty));
    }
    if (filter.category?.length) {
      filteredItems = filteredItems.filter(item => filter.category!.includes(item.category));
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total: filteredItems.length,
      facets: this.generateSearchFacets(MOCK_CONTENT_ITEMS)
    };
  }

  // Content Templates
  async getTemplates(): Promise<ContentTemplate[]> {
    return MOCK_TEMPLATES;
  }

  async getTemplate(id: string): Promise<ContentTemplate | null> {
    return MOCK_TEMPLATES.find(template => template.id === id) || null;
  }

  // Version Control
  async getContentVersions(contentId: string): Promise<ContentVersion[]> {
    // Mock version history
    return [
      {
        id: `version-${contentId}-1`,
        contentId,
        version: 1,
        changes: [
          {
            field: 'title',
            oldValue: 'Draft Title',
            newValue: 'Email Basics for Beginners',
            changeType: 'modified'
          }
        ],
        createdBy: 'author-1',
        createdAt: new Date('2024-01-15'),
        comment: 'Initial version',
        size: 1024
      }
    ];
  }

  async revertToVersion(contentId: string, version: number): Promise<ContentItem> {
    // In production, this would restore from version history
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    return content;
  }

  // Review and Approval
  async submitForReview(contentId: string, reviewType: string = 'content'): Promise<ContentReview> {
    const review: ContentReview = {
      id: `review-${Date.now()}`,
      contentId,
      reviewerId: 'reviewer-1',
      reviewerName: 'Review Team',
      type: reviewType as any,
      status: 'pending',
      feedback: {
        overall: '',
        accessibility: {
          score: 0,
          issues: [],
          recommendations: [],
          wcagCompliance: false
        },
        content: {
          readabilityScore: 0,
          seniorFriendliness: 0,
          clarity: 0,
          completeness: 0,
          accuracy: 0,
          engagement: 0,
          suggestions: []
        },
        technical: {
          functionalityScore: 0,
          performanceScore: 0,
          compatibilityScore: 0,
          securityScore: 0,
          issues: []
        },
        recommendations: [],
        requiredChanges: []
      },
      reviewedAt: new Date(),
      version: 1
    };

    return review;
  }

  async approveContent(contentId: string, reviewId: string): Promise<ContentItem> {
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    return this.updateContent(contentId, { status: 'approved' });
  }

  async publishContent(contentId: string): Promise<ContentItem> {
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    return this.updateContent(contentId, { 
      status: 'published',
      publishedAt: new Date()
    });
  }

  // Accessibility Optimization
  async optimizeAccessibility(contentId: string): Promise<AccessibilityMetadata> {
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    // Perform accessibility checks and optimizations
    const optimizedMetadata = this.generateAccessibilityMetadata(content.content);
    
    // Update content with optimized accessibility
    await this.updateContent(contentId, {
      accessibility: optimizedMetadata
    });

    return optimizedMetadata;
  }

  // Printable Guide Generation
  async generatePrintableGuide(contentId: string): Promise<PrintableGuide> {
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const guide: PrintableGuide = {
      id: `guide-${contentId}`,
      title: content.title,
      summary: content.description,
      keyPoints: content.learningObjectives,
      stepByStep: content.content.sections.map((section, index) => ({
        stepNumber: index + 1,
        title: section.title,
        description: this.stripHtml(section.content),
        tips: [`Estimated reading time: ${section.estimatedReadTime} minutes`]
      })),
      troubleshooting: [
        {
          problem: 'I can\'t see the text clearly',
          solution: 'Try increasing your browser\'s zoom level or adjusting your screen brightness',
          additionalHelp: 'Contact our support team for personalized assistance'
        }
      ],
      additionalResources: content.content.resources.map(resource => resource.title)
    };

    return guide;
  }

  // Translation and Localization
  async validateTranslation(contentId: string, language: string): Promise<TranslationQuality> {
    // Mock translation quality check
    return {
      score: 85,
      reviewedBy: 'translation-team',
      reviewedAt: new Date(),
      issues: [
        {
          type: 'cultural',
          description: 'Consider local email providers in examples',
          severity: 'low',
          resolved: false
        }
      ],
      status: 'reviewed'
    };
  }

  // Analytics and Reporting
  async getContentAnalytics(contentId: string, timeframe: string = 'month'): Promise<any> {
    const content = await this.getContent(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    return content.analytics;
  }

  // Helper Methods
  private generateAccessibilityMetadata(content?: ContentData): AccessibilityMetadata {
    if (!content) {
      return {
        screenReaderOptimized: false,
        keyboardNavigable: false,
        highContrastCompatible: false,
        reducedMotionVersion: false,
        alternativeFormats: [],
        readabilityScore: 0,
        cognitiveLoadLevel: 'medium',
        estimatedCognitiveTime: 0
      };
    }

    // Analyze content for accessibility
    const textContent = content.sections.map(s => s.content).join(' ');
    const readabilityScore = this.calculateReadabilityScore(textContent);
    const cognitiveLoadLevel = this.assessCognitiveLoad(content);

    return {
      screenReaderOptimized: true,
      keyboardNavigable: true,
      highContrastCompatible: true,
      reducedMotionVersion: content.sections.some(s => s.media.length === 0),
      alternativeFormats: ['audio', 'large-print'],
      readabilityScore,
      cognitiveLoadLevel,
      estimatedCognitiveTime: Math.ceil(readabilityScore / 10)
    };
  }

  private calculateReadabilityScore(text: string): number {
    // Simplified readability calculation
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Lower score for shorter sentences (better for seniors)
    return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 10) * 5));
  }

  private assessCognitiveLoad(content: ContentData): 'low' | 'medium' | 'high' {
    const totalSections = content.sections.length;
    const totalExercises = content.exercises.length;
    const totalInteractiveElements = content.sections.reduce(
      (sum, section) => sum + section.interactiveElements.length, 0
    );

    const complexityScore = totalSections + (totalExercises * 2) + (totalInteractiveElements * 1.5);

    if (complexityScore <= 5) return 'low';
    if (complexityScore <= 10) return 'medium';
    return 'high';
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  private generateSearchFacets(items: ContentItem[]) {
    const types = this.countFacets(items, 'type');
    const statuses = this.countFacets(items, 'status');
    const difficulties = this.countFacets(items, 'difficulty');
    const categories = this.countFacets(items, 'category');
    const authors = this.countFacets(items, 'authorName');

    return {
      types,
      statuses,
      difficulties,
      categories,
      authors
    };
  }

  private countFacets(items: ContentItem[], field: keyof ContentItem) {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const value = String(item[field]);
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([value, count]) => ({ value, count }));
  }
}

export const contentManagementService = new ContentManagementService();