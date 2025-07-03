import { LearningPath, Module } from '../types/learning';

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

  // Functions to update user progress would go here
  // e.g., markModuleAsCompleted(userId: string, moduleId: string, pathId: string): Promise<void>
  // e.g., awardBadge(userId: string, badgeId: string): Promise<void>
};

// Mock badge data (would also be in Firestore or constants)
export const MOCK_BADGES: Badge[] = [
    { id: 'fundamentalsBadge', nameKey: 'badges.fundamentals.name', descriptionKey: 'badges.fundamentals.description', iconName: 'Target' },
    { id: 'onlineWorldBadge', nameKey: 'badges.onlineWorld.name', descriptionKey: 'badges.onlineWorld.description', iconName: 'Wifi' },
    { id: 'digitalLifeBadge', nameKey: 'badges.digitalLife.name', descriptionKey: 'badges.digitalLife.description', iconName: 'MessageSquare' },
    { id: 'advancedSkillsBadge', nameKey: 'badges.advancedSkills.name', descriptionKey: 'badges.advancedSkills.description', iconName: 'Sparkles' },
];

export const getBadgeById = (badgeId: string): Badge | undefined => {
    return MOCK_BADGES.find(b => b.id === badgeId);
};
