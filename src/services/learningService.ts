import { LearningPath, Module } from '../types/learning';
import type { Badge } from '../types/learning';

// These keys would need to be added to translation.json files
// For example:
// "learningPaths": {
//   "fundamentals": {
//     "title": "Computer & Device Fundamentals",
//     "description": "The very basics to get you started with technology.",
//     "modules": {
//       "turnOnDevice": { "title": "Turning on a Device", "description": "Learn to power up computers and smartphones." },
//       // ... other modules
//     }
//   },
//   // ... other paths
// }

const MOCK_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'fundamentals',
    titleKey: 'learningPaths.fundamentals.title',
    descriptionKey: 'learningPaths.fundamentals.description',
    iconName: 'Target', // Lucide icon
    sortOrder: 1,
    badgeIdOnCompletion: 'fundamentalsBadge',
    modules: [
      { id: 'turnOnDevice', titleKey: 'learningPaths.fundamentals.modules.turnOnDevice.title', descriptionKey: 'learningPaths.fundamentals.modules.turnOnDevice.description', estimatedTime: '10 min', iconName: 'Power' },
      { id: 'mouseTouchscreen', titleKey: 'learningPaths.fundamentals.modules.mouseTouchscreen.title', descriptionKey: 'learningPaths.fundamentals.modules.mouseTouchscreen.description', estimatedTime: '15 min', dependsOn: ['turnOnDevice'], iconName: 'MousePointer2' },
      { id: 'keyboardTyping', titleKey: 'learningPaths.fundamentals.modules.keyboardTyping.title', descriptionKey: 'learningPaths.fundamentals.modules.keyboardTyping.description', estimatedTime: '20 min', dependsOn: ['mouseTouchscreen'], iconName: 'Keyboard' },
      { id: 'filesFolders', titleKey: 'learningPaths.fundamentals.modules.filesFolders.title', descriptionKey: 'learningPaths.fundamentals.modules.filesFolders.description', estimatedTime: '15 min', dependsOn: ['keyboardTyping'], iconName: 'Folder' },
    ],
  },
  {
    id: 'onlineWorld',
    titleKey: 'learningPaths.onlineWorld.title',
    descriptionKey: 'learningPaths.onlineWorld.description',
    iconName: 'Wifi', // Lucide icon
    sortOrder: 2,
    badgeIdOnCompletion: 'onlineWorldBadge',
    modules: [
      { id: 'webBrowsers', titleKey: 'learningPaths.onlineWorld.modules.webBrowsers.title', descriptionKey: 'learningPaths.onlineWorld.modules.webBrowsers.description', estimatedTime: '20 min', dependsOn: ['fundamentals/filesFolders'], iconName: 'Globe' }, // Assuming a way to reference module from another path, or just make fundamentals pre-req for path
      { id: 'searchEffectively', titleKey: 'learningPaths.onlineWorld.modules.searchEffectively.title', descriptionKey: 'learningPaths.onlineWorld.modules.searchEffectively.description', estimatedTime: '15 min', dependsOn: ['webBrowsers'], iconName: 'Search' },
      { id: 'introEmail', titleKey: 'learningPaths.onlineWorld.modules.introEmail.title', descriptionKey: 'learningPaths.onlineWorld.modules.introEmail.description', estimatedTime: '25 min', dependsOn: ['searchEffectively'], iconName: 'Mail' },
      { id: 'virusSafety', titleKey: 'learningPaths.onlineWorld.modules.virusSafety.title', descriptionKey: 'learningPaths.onlineWorld.modules.virusSafety.description', estimatedTime: '20 min', dependsOn: ['introEmail'], iconName: 'ShieldCheck' },
    ],
  },
  {
    id: 'digitalLife',
    titleKey: 'learningPaths.digitalLife.title',
    descriptionKey: 'learningPaths.digitalLife.description',
    iconName: 'MessageSquare', // Lucide icon
    sortOrder: 3,
    badgeIdOnCompletion: 'digitalLifeBadge',
    modules: [
      { id: 'masteringEmail', titleKey: 'learningPaths.digitalLife.modules.masteringEmail.title', descriptionKey: 'learningPaths.digitalLife.modules.masteringEmail.description', estimatedTime: '30 min', dependsOn: ['onlineWorld/introEmail'], iconName: 'MailOpen' },
      { id: 'videoCalling', titleKey: 'learningPaths.digitalLife.modules.videoCalling.title', descriptionKey: 'learningPaths.digitalLife.modules.videoCalling.description', estimatedTime: '25 min', dependsOn: ['masteringEmail'], iconName: 'Video' },
      { id: 'introSocialMedia', titleKey: 'learningPaths.digitalLife.modules.introSocialMedia.title', descriptionKey: 'learningPaths.digitalLife.modules.introSocialMedia.description', estimatedTime: '30 min', dependsOn: ['videoCalling'], iconName: 'Users' },
      { id: 'sharingPhotos', titleKey: 'learningPaths.digitalLife.modules.sharingPhotos.title', descriptionKey: 'learningPaths.digitalLife.modules.sharingPhotos.description', estimatedTime: '20 min', dependsOn: ['introSocialMedia'], iconName: 'Image' },
    ],
  },
  {
    id: 'advancedSkills',
    titleKey: 'learningPaths.advancedSkills.title',
    descriptionKey: 'learningPaths.advancedSkills.description',
    iconName: 'Sparkles', // Lucide icon
    sortOrder: 4,
    badgeIdOnCompletion: 'advancedSkillsBadge',
    modules: [
      { id: 'onlineShopping', titleKey: 'learningPaths.advancedSkills.modules.onlineShopping.title', descriptionKey: 'learningPaths.advancedSkills.modules.onlineShopping.description', estimatedTime: '35 min', dependsOn: ['digitalLife/sharingPhotos'], iconName: 'ShoppingCart' },
      { id: 'onlineMaps', titleKey: 'learningPaths.advancedSkills.modules.onlineMaps.title', descriptionKey: 'learningPaths.advancedSkills.modules.onlineMaps.description', estimatedTime: '20 min', dependsOn: ['onlineShopping'], iconName: 'Map' },
      { id: 'photoEditing', titleKey: 'learningPaths.advancedSkills.modules.photoEditing.title', descriptionKey: 'learningPaths.advancedSkills.modules.photoEditing.description', estimatedTime: '30 min', dependsOn: ['onlineMaps'], iconName: 'ImageEdit' },
      { id: 'productivityTools', titleKey: 'learningPaths.advancedSkills.modules.productivityTools.title', descriptionKey: 'learningPaths.advancedSkills.modules.productivityTools.description', estimatedTime: '40 min', dependsOn: ['photoEditing'], iconName: 'FileText' },
    ],
  },
  {
    id: 'accessibility',
    titleKey: 'learningPaths.accessibility.title',
    descriptionKey: 'learningPaths.accessibility.description',
    iconName: 'Heart',
    sortOrder: 5,
    badgeIdOnCompletion: 'accessibilityBadge',
    modules: [
      { id: 'screenMagnifier', titleKey: 'learningPaths.accessibility.modules.screenMagnifier.title', descriptionKey: 'learningPaths.accessibility.modules.screenMagnifier.description', estimatedTime: '10 min', iconName: 'ZoomIn' },
      { id: 'voiceCommands', titleKey: 'learningPaths.accessibility.modules.voiceCommands.title', descriptionKey: 'learningPaths.accessibility.modules.voiceCommands.description', estimatedTime: '15 min', iconName: 'Mic' },
      { id: 'highContrast', titleKey: 'learningPaths.accessibility.modules.highContrast.title', descriptionKey: 'learningPaths.accessibility.modules.highContrast.description', estimatedTime: '10 min', iconName: 'Contrast' },
      { id: 'assistiveTouch', titleKey: 'learningPaths.accessibility.modules.assistiveTouch.title', descriptionKey: 'learningPaths.accessibility.modules.assistiveTouch.description', estimatedTime: '10 min', iconName: 'Touchpad' }
    ],
  },
  {
    id: 'healthAndSafety',
    titleKey: 'learningPaths.healthAndSafety.title',
    descriptionKey: 'learningPaths.healthAndSafety.description',
    iconName: 'Shield',
    sortOrder: 6,
    badgeIdOnCompletion: 'healthAndSafetyBadge',
    modules: [
      { id: 'privacySettings', titleKey: 'learningPaths.healthAndSafety.modules.privacySettings.title', descriptionKey: 'learningPaths.healthAndSafety.modules.privacySettings.description', estimatedTime: '15 min', iconName: 'ShieldCheck' },
      { id: 'scamAwareness', titleKey: 'learningPaths.healthAndSafety.modules.scamAwareness.title', descriptionKey: 'learningPaths.healthAndSafety.modules.scamAwareness.description', estimatedTime: '20 min', iconName: 'AlertTriangle' },
      { id: 'healthApps', titleKey: 'learningPaths.healthAndSafety.modules.healthApps.title', descriptionKey: 'learningPaths.healthAndSafety.modules.healthApps.description', estimatedTime: '20 min', iconName: 'HeartPulse' },
      { id: 'emergencyContacts', titleKey: 'learningPaths.healthAndSafety.modules.emergencyContacts.title', descriptionKey: 'learningPaths.healthAndSafety.modules.emergencyContacts.description', estimatedTime: '10 min', iconName: 'PhoneCall' }
    ],
  },
];

export const learningService = {
  getLearningPaths: async (): Promise<LearningPath[]> => {
    // In a real app, this would fetch from Firestore
    // For now, return mock data with a slight delay to simulate async
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(MOCK_LEARNING_PATHS.sort((a, b) => a.sortOrder - b.sortOrder));
      }, 500);
    });
  },

  getModuleById: async (pathId: string, moduleId: string): Promise<Module | undefined> => {
    const paths = await learningService.getLearningPaths();
    const path = paths.find(p => p.id === pathId);
    return path?.modules.find(m => m.id === moduleId);
  },

  /**
   * Mark a module as completed for the current user (delegates to UserContext in UI, but can be used for backend or service logic)
   * @param userLearningProgress Current userLearningProgress object (from UserContext)
   * @param moduleId Module ID to mark as complete
   * @param pathId Path ID for the module
   * @param allLearningPaths All available learning paths (for badge logic)
   * @returns Updated userLearningProgress object
   */
  markModuleAsCompleted: (
    userLearningProgress: {
      completedModules: Record<string, boolean>;
      earnedBadges: Record<string, boolean>;
      pathProgress?: Record<string, { completedCount: number; totalCount: number; progressPercent: number }>;
    },
    moduleId: string,
    pathId: string,
    allLearningPaths: LearningPath[]
  ) => {
    const updatedCompletedModules = {
      ...userLearningProgress.completedModules,
      [moduleId]: true
    };
    let updatedEarnedBadges = { ...userLearningProgress.earnedBadges };
    const path = allLearningPaths.find(p => p.id === pathId);
    if (path) {
      const allModulesInPathComplete = path.modules.every(
        module => updatedCompletedModules[module.id]
      );
      if (allModulesInPathComplete && path.badgeIdOnCompletion) {
        updatedEarnedBadges = {
          ...updatedEarnedBadges,
          [path.badgeIdOnCompletion]: true
        };
      }
    }
    // Recalculate progress for all paths
    const updatedPathProgress: Record<string, { completedCount: number, totalCount: number, progressPercent: number }> = {};
    allLearningPaths.forEach(p => {
      const totalModules = p.modules.length;
      const completedCount = p.modules.filter(m => updatedCompletedModules[m.id]).length;
      updatedPathProgress[p.id] = {
        completedCount,
        totalCount: totalModules,
        progressPercent: totalModules > 0 ? (completedCount / totalModules) * 100 : 0,
      };
    });
    return {
      completedModules: updatedCompletedModules,
      earnedBadges: updatedEarnedBadges,
      pathProgress: updatedPathProgress
    };
  },
};

// Mock badge data (would also be in Firestore or constants)
export const MOCK_BADGES: Badge[] = [
    { id: 'fundamentalsBadge', nameKey: 'badges.fundamentals.name', descriptionKey: 'badges.fundamentals.description', iconName: 'Target' },
    { id: 'onlineWorldBadge', nameKey: 'badges.onlineWorld.name', descriptionKey: 'badges.onlineWorld.description', iconName: 'Wifi' },
    { id: 'digitalLifeBadge', nameKey: 'badges.digitalLife.name', descriptionKey: 'badges.digitalLife.description', iconName: 'MessageSquare' },
    { id: 'advancedSkillsBadge', nameKey: 'badges.advancedSkills.name', descriptionKey: 'badges.advancedSkills.description', iconName: 'Sparkles' },
    { id: 'accessibilityBadge', nameKey: 'badges.accessibility.name', descriptionKey: 'badges.accessibility.description', iconName: 'Heart' },
    { id: 'healthAndSafetyBadge', nameKey: 'badges.healthAndSafety.name', descriptionKey: 'badges.healthAndSafety.description', iconName: 'Shield' },
];

export const getBadgeById = (badgeId: string): Badge | undefined => {
    return MOCK_BADGES.find(b => b.id === badgeId);
};
