import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'ru' | 'hi' | 'nl' | 'sv' | 'no' | 'da' | 'fi' | 'pl' | 'tr' | 'he' | 'th' | 'vi' | 'uk' | 'cs' | 'hu' | 'ro' | 'bg' | 'hr' | 'sk' | 'sl' | 'et' | 'lv' | 'lt';

interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  translateDynamicContent: (content: string, targetLanguage?: Language) => Promise<string>;
  detectLanguage: (text: string) => Promise<Language | null>;
  translateText: (text: string, targetLanguage: Language) => Promise<string>;
  getSupportedLanguages: () => LanguageInfo[];
  defaultLanguage: Language;
  setDefaultLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Complete translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.reviews': 'Reviews',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to TechStep',
    'dashboard.welcomeUser': 'Welcome back, {{name}}!',
    'dashboard.ready': 'Ready to learn something new?',
    'dashboard.getHelp': 'Get Instant Help',
    'dashboard.askQuestion': 'Ask any tech question and get step-by-step guidance',
    'dashboard.placeholder': 'What would you like help with today?',
    'dashboard.getSteps': 'Get Step-by-Step Help',
    'dashboard.gettingSteps': 'Getting your steps...',
    'dashboard.craftingSteps': 'Crafting your personalized steps...',
    'dashboard.takesAMoment': 'This may take a moment',
    'dashboard.quickTips': 'Quick Tips for You',
    'dashboard.popularQuestions': 'Popular Questions Today',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.yourProgress': 'Your Progress',
    'dashboard.needHelp': 'Need Help?',
    'dashboard.helpingHand': 'We\'re here to help you succeed',
    'dashboard.chatHuman': 'Chat with a Human',
    'dashboard.browseGuides': 'Browse Video Guides',
    'dashboard.browseTips': 'Browse Tips',
    'dashboard.commonSolutions': 'Find common solutions',
    'dashboard.stepsCompleted': '{{count}} steps completed',
    'dashboard.needMoreInfo': 'I need a bit more information to help you better',
    
    // AI Tools
    'aiTools.title': 'AI Helper Tools',
    'aiTools.description': 'Photo explainer & tech translator',
    
    // Learning
    'learning.title': 'Learning Center',
    'learning.structuredCourses': 'Structured courses and tutorials',
    
    // Settings
    'settings.customizePrefs': 'Customize your preferences',
    
    // Common
    'common.settings': 'Settings',
    'common.signOut': 'Sign Out',
    'common.close': 'Close',
    
    // Tips
    'tips.connectWifi': 'Connect to Wi-Fi',
    'tips.connectWifiDesc': 'Get online safely and easily',
    'tips.videoCall': 'Make a Video Call',
    'tips.videoCallDesc': 'Connect with family face-to-face',
    'tips.screenshot': 'Take a Screenshot',
    'tips.screenshotDesc': 'Capture what\'s on your screen',
    'tips.updateApps': 'Update Your Apps',
    'tips.updateAppsDesc': 'Keep your apps current and secure',
    
    // Categories
    'category.internet': 'Internet',
    'category.communication': 'Communication',
    'category.basicSkills': 'Basic Skills',
    'category.maintenance': 'Maintenance',
    
    // Questions
    'questions.makeTextBigger': 'How do I make text bigger?',
    'questions.connectWifi': 'How do I connect to Wi-Fi?',
    'questions.takeScreenshot': 'How do I take a screenshot?',
    'questions.makeVideoCall': 'How do I make a video call?',
    'questions.backupPhotos': 'How do I backup my photos?',
    'questions.updateApps': 'How do I update my apps?',
    'questions.onlineBanking': 'How do I use online banking safely?',
    'questions.joinZoom': 'How do I join a Zoom meeting?',
    
    // Achievements
    'achievements.gettingStarted': 'Getting Started',
    'achievements.gettingStartedDesc': 'Asked your first question',
    'achievements.questionExplorer': 'Question Explorer',
    'achievements.questionExplorerDesc': 'Asked 5 questions',
    'achievements.stepMaster': 'Step Master',
    'achievements.stepMasterDesc': 'Completed 25 steps',
    
    // Stats
    'stats.seniorsHelped': 'Seniors Helped',
    'stats.questionsAnswered': 'Questions Answered',
    'stats.successRate': 'Success Rate',
    'stats.alwaysAvailable': 'Always Available',
    
    // Time
    'time.now': 'Just now',
    'time.hourAgo': '1 hour ago',
    'time.hoursAgo': '{{count}} hours ago',
    'time.dayAgo': '1 day ago',
    'time.daysAgo': '{{count}} days ago',
    
    // Voice
    'voice.startInput': 'Start voice input',
    'voice.stopRecording': 'Stop recording',
    'voice.processing': 'Processing...',
    'voice.recognized': 'Voice recognized',
    'voice.failed': 'Voice input failed',
    
    // Language
    'language.select': 'Select Language',
    'language.translate': 'Translate',
    'language.translating': 'Translating...',
    'language.detecting': 'Detecting language...',
    'language.error': 'Translation failed',
    
    // Auth
    'auth.backToHome': 'Back to Home',
    'auth.createAccount': 'Create Account',
    'auth.welcomeBack': 'Welcome Back',
    'auth.joinFamily': 'Join our family of empowered seniors',
    'auth.welcomeBackDesc': 'Sign in to continue your tech journey',
    'auth.email': 'Email Address',
    'auth.emailPlaceholder': 'Enter your email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Enter your password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.confirmPasswordPlaceholder': 'Confirm your password',
    'auth.passwordsNoMatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 6 characters',
    'auth.creatingAccount': 'Creating account...',
    'auth.signingIn': 'Signing in...',
    'auth.alreadyHaveAccount': 'Already have an account? Sign in',
    'auth.dontHaveAccount': 'Don\'t have an account? Sign up',
    
    // Errors
    'error.askQuestionFirst': 'Please ask a question first',
    'error.couldntGetAnswer': 'Sorry, I couldn\'t get an answer right now. Please try again.'
  },
  
  es: {
    // Navigation
    'nav.features': 'Características',
    'nav.reviews': 'Reseñas',
    'nav.signIn': 'Iniciar Sesión',
    'nav.getStarted': 'Comenzar',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido a TechStep',
    'dashboard.welcomeUser': '¡Bienvenido de vuelta, {{name}}!',
    'dashboard.ready': '¿Listo para aprender algo nuevo?',
    'dashboard.getHelp': 'Obtener Ayuda Instantánea',
    'dashboard.askQuestion': 'Haz cualquier pregunta técnica y obtén orientación paso a paso',
    'dashboard.placeholder': '¿Con qué te gustaría que te ayude hoy?',
    'dashboard.getSteps': 'Obtener Ayuda Paso a Paso',
    'dashboard.gettingSteps': 'Obteniendo tus pasos...',
    'dashboard.craftingSteps': 'Creando tus pasos personalizados...',
    'dashboard.takesAMoment': 'Esto puede tomar un momento',
    'dashboard.quickTips': 'Consejos Rápidos para Ti',
    'dashboard.popularQuestions': 'Preguntas Populares Hoy',
    'dashboard.quickActions': 'Acciones Rápidas',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.yourProgress': 'Tu Progreso',
    'dashboard.needHelp': '¿Necesitas Ayuda?',
    'dashboard.helpingHand': 'Estamos aquí para ayudarte a tener éxito',
    'dashboard.chatHuman': 'Chatear con un Humano',
    'dashboard.browseGuides': 'Explorar Guías de Video',
    'dashboard.browseTips': 'Explorar Consejos',
    'dashboard.commonSolutions': 'Encuentra soluciones comunes',
    'dashboard.stepsCompleted': '{{count}} pasos completados',
    'dashboard.needMoreInfo': 'Necesito un poco más de información para ayudarte mejor',
    
    // AI Tools
    'aiTools.title': 'Herramientas de IA',
    'aiTools.description': 'Explicador de fotos y traductor técnico',
    
    // Learning
    'learning.title': 'Centro de Aprendizaje',
    'learning.structuredCourses': 'Cursos estructurados y tutoriales',
    
    // Settings
    'settings.customizePrefs': 'Personaliza tus preferencias',
    
    // Common
    'common.settings': 'Configuración',
    'common.signOut': 'Cerrar Sesión',
    'common.close': 'Cerrar',
    
    // Tips
    'tips.connectWifi': 'Conectar a Wi-Fi',
    'tips.connectWifiDesc': 'Conéctate en línea de forma segura y fácil',
    'tips.videoCall': 'Hacer una Videollamada',
    'tips.videoCallDesc': 'Conecta con la familia cara a cara',
    'tips.screenshot': 'Tomar una Captura de Pantalla',
    'tips.screenshotDesc': 'Captura lo que está en tu pantalla',
    'tips.updateApps': 'Actualizar tus Aplicaciones',
    'tips.updateAppsDesc': 'Mantén tus aplicaciones actuales y seguras',
    
    // Categories
    'category.internet': 'Internet',
    'category.communication': 'Comunicación',
    'category.basicSkills': 'Habilidades Básicas',
    'category.maintenance': 'Mantenimiento',
    
    // Questions
    'questions.makeTextBigger': '¿Cómo hago el texto más grande?',
    'questions.connectWifi': '¿Cómo me conecto a Wi-Fi?',
    'questions.takeScreenshot': '¿Cómo tomo una captura de pantalla?',
    'questions.makeVideoCall': '¿Cómo hago una videollamada?',
    'questions.backupPhotos': '¿Cómo hago respaldo de mis fotos?',
    'questions.updateApps': '¿Cómo actualizo mis aplicaciones?',
    'questions.onlineBanking': '¿Cómo uso la banca en línea de forma segura?',
    'questions.joinZoom': '¿Cómo me uno a una reunión de Zoom?',
    
    // Achievements
    'achievements.gettingStarted': 'Comenzando',
    'achievements.gettingStartedDesc': 'Hiciste tu primera pregunta',
    'achievements.questionExplorer': 'Explorador de Preguntas',
    'achievements.questionExplorerDesc': 'Hiciste 5 preguntas',
    'achievements.stepMaster': 'Maestro de Pasos',
    'achievements.stepMasterDesc': 'Completaste 25 pasos',
    
    // Stats
    'stats.seniorsHelped': 'Adultos Mayores Ayudados',
    'stats.questionsAnswered': 'Preguntas Respondidas',
    'stats.successRate': 'Tasa de Éxito',
    'stats.alwaysAvailable': 'Siempre Disponible',
    
    // Time
    'time.now': 'Ahora mismo',
    'time.hourAgo': 'Hace 1 hora',
    'time.hoursAgo': 'Hace {{count}} horas',
    'time.dayAgo': 'Hace 1 día',
    'time.daysAgo': 'Hace {{count}} días',
    
    // Voice
    'voice.startInput': 'Iniciar entrada de voz',
    'voice.stopRecording': 'Detener grabación',
    'voice.processing': 'Procesando...',
    'voice.recognized': 'Voz reconocida',
    'voice.failed': 'Entrada de voz falló',
    
    // Language
    'language.select': 'Seleccionar Idioma',
    'language.translate': 'Traducir',
    'language.translating': 'Traduciendo...',
    'language.detecting': 'Detectando idioma...',
    'language.error': 'Traducción falló',
    
    // Auth
    'auth.backToHome': 'Volver al Inicio',
    'auth.createAccount': 'Crear Cuenta',
    'auth.welcomeBack': 'Bienvenido de Vuelta',
    'auth.joinFamily': 'Únete a nuestra familia de adultos mayores empoderados',
    'auth.welcomeBackDesc': 'Inicia sesión para continuar tu viaje tecnológico',
    'auth.email': 'Correo Electrónico',
    'auth.emailPlaceholder': 'Ingresa tu correo',
    'auth.password': 'Contraseña',
    'auth.passwordPlaceholder': 'Ingresa tu contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.confirmPasswordPlaceholder': 'Confirma tu contraseña',
    'auth.passwordsNoMatch': 'Las contraseñas no coinciden',
    'auth.passwordTooShort': 'La contraseña debe tener al menos 6 caracteres',
    'auth.creatingAccount': 'Creando cuenta...',
    'auth.signingIn': 'Iniciando sesión...',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta? Inicia sesión',
    'auth.dontHaveAccount': '¿No tienes una cuenta? Regístrate',
    
    // Errors
    'error.askQuestionFirst': 'Por favor haz una pregunta primero',
    'error.couldntGetAnswer': 'Lo siento, no pude obtener una respuesta ahora. Por favor intenta de nuevo.'
  },
  
  fr: {
    // Navigation
    'nav.features': 'Fonctionnalités',
    'nav.reviews': 'Avis',
    'nav.signIn': 'Se Connecter',
    'nav.getStarted': 'Commencer',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue sur TechStep',
    'dashboard.welcomeUser': 'Bon retour, {{name}} !',
    'dashboard.ready': 'Prêt à apprendre quelque chose de nouveau ?',
    'dashboard.getHelp': 'Obtenir de l\'Aide Instantanée',
    'dashboard.askQuestion': 'Posez n\'importe quelle question technique et obtenez des conseils étape par étape',
    'dashboard.placeholder': 'Avec quoi aimeriez-vous de l\'aide aujourd\'hui ?',
    'dashboard.getSteps': 'Obtenir de l\'Aide Étape par Étape',
    'dashboard.gettingSteps': 'Obtention de vos étapes...',
    'dashboard.craftingSteps': 'Création de vos étapes personnalisées...',
    'dashboard.takesAMoment': 'Cela peut prendre un moment',
    'dashboard.quickTips': 'Conseils Rapides pour Vous',
    'dashboard.popularQuestions': 'Questions Populaires Aujourd\'hui',
    'dashboard.quickActions': 'Actions Rapides',
    'dashboard.recentActivity': 'Activité Récente',
    'dashboard.yourProgress': 'Votre Progrès',
    'dashboard.needHelp': 'Besoin d\'Aide ?',
    'dashboard.helpingHand': 'Nous sommes là pour vous aider à réussir',
    'dashboard.chatHuman': 'Discuter avec un Humain',
    'dashboard.browseGuides': 'Parcourir les Guides Vidéo',
    'dashboard.browseTips': 'Parcourir les Conseils',
    'dashboard.commonSolutions': 'Trouvez des solutions communes',
    'dashboard.stepsCompleted': '{{count}} étapes terminées',
    'dashboard.needMoreInfo': 'J\'ai besoin d\'un peu plus d\'informations pour mieux vous aider',
    
    // AI Tools
    'aiTools.title': 'Outils IA',
    'aiTools.description': 'Explicateur de photos et traducteur technique',
    
    // Learning
    'learning.title': 'Centre d\'Apprentissage',
    'learning.structuredCourses': 'Cours structurés et tutoriels',
    
    // Settings
    'settings.customizePrefs': 'Personnalisez vos préférences',
    
    // Common
    'common.settings': 'Paramètres',
    'common.signOut': 'Se Déconnecter',
    'common.close': 'Fermer',
    
    // Tips
    'tips.connectWifi': 'Se Connecter au Wi-Fi',
    'tips.connectWifiDesc': 'Connectez-vous en ligne en toute sécurité et facilement',
    'tips.videoCall': 'Faire un Appel Vidéo',
    'tips.videoCallDesc': 'Connectez-vous avec la famille face à face',
    'tips.screenshot': 'Prendre une Capture d\'Écran',
    'tips.screenshotDesc': 'Capturez ce qui est sur votre écran',
    'tips.updateApps': 'Mettre à Jour vos Applications',
    'tips.updateAppsDesc': 'Gardez vos applications à jour et sécurisées',
    
    // Categories
    'category.internet': 'Internet',
    'category.communication': 'Communication',
    'category.basicSkills': 'Compétences de Base',
    'category.maintenance': 'Maintenance',
    
    // Questions
    'questions.makeTextBigger': 'Comment agrandir le texte ?',
    'questions.connectWifi': 'Comment me connecter au Wi-Fi ?',
    'questions.takeScreenshot': 'Comment prendre une capture d\'écran ?',
    'questions.makeVideoCall': 'Comment faire un appel vidéo ?',
    'questions.backupPhotos': 'Comment sauvegarder mes photos ?',
    'questions.updateApps': 'Comment mettre à jour mes applications ?',
    'questions.onlineBanking': 'Comment utiliser la banque en ligne en toute sécurité ?',
    'questions.joinZoom': 'Comment rejoindre une réunion Zoom ?',
    
    // Achievements
    'achievements.gettingStarted': 'Commencer',
    'achievements.gettingStartedDesc': 'Vous avez posé votre première question',
    'achievements.questionExplorer': 'Explorateur de Questions',
    'achievements.questionExplorerDesc': 'Vous avez posé 5 questions',
    'achievements.stepMaster': 'Maître des Étapes',
    'achievements.stepMasterDesc': 'Vous avez terminé 25 étapes',
    
    // Stats
    'stats.seniorsHelped': 'Seniors Aidés',
    'stats.questionsAnswered': 'Questions Répondues',
    'stats.successRate': 'Taux de Réussite',
    'stats.alwaysAvailable': 'Toujours Disponible',
    
    // Time
    'time.now': 'À l\'instant',
    'time.hourAgo': 'Il y a 1 heure',
    'time.hoursAgo': 'Il y a {{count}} heures',
    'time.dayAgo': 'Il y a 1 jour',
    'time.daysAgo': 'Il y a {{count}} jours',
    
    // Voice
    'voice.startInput': 'Démarrer l\'entrée vocale',
    'voice.stopRecording': 'Arrêter l\'enregistrement',
    'voice.processing': 'Traitement...',
    'voice.recognized': 'Voix reconnue',
    'voice.failed': 'Entrée vocale échouée',
    
    // Language
    'language.select': 'Sélectionner la Langue',
    'language.translate': 'Traduire',
    'language.translating': 'Traduction...',
    'language.detecting': 'Détection de la langue...',
    'language.error': 'Traduction échouée',
    
    // Auth
    'auth.backToHome': 'Retour à l\'Accueil',
    'auth.createAccount': 'Créer un Compte',
    'auth.welcomeBack': 'Bon Retour',
    'auth.joinFamily': 'Rejoignez notre famille de seniors autonomes',
    'auth.welcomeBackDesc': 'Connectez-vous pour continuer votre parcours technologique',
    'auth.email': 'Adresse E-mail',
    'auth.emailPlaceholder': 'Entrez votre e-mail',
    'auth.password': 'Mot de Passe',
    'auth.passwordPlaceholder': 'Entrez votre mot de passe',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.confirmPasswordPlaceholder': 'Confirmez votre mot de passe',
    'auth.passwordsNoMatch': 'Les mots de passe ne correspondent pas',
    'auth.passwordTooShort': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth.creatingAccount': 'Création du compte...',
    'auth.signingIn': 'Connexion...',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte ? Connectez-vous',
    'auth.dontHaveAccount': 'Vous n\'avez pas de compte ? Inscrivez-vous',
    
    // Errors
    'error.askQuestionFirst': 'Veuillez d\'abord poser une question',
    'error.couldntGetAnswer': 'Désolé, je n\'ai pas pu obtenir de réponse maintenant. Veuillez réessayer.'
  }
};

// Add other languages with basic translations
const basicTranslations = {
  de: 'German',
  it: 'Italian', 
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  hi: 'Hindi',
  nl: 'Dutch',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  pl: 'Polish',
  tr: 'Turkish',
  he: 'Hebrew',
  th: 'Thai',
  vi: 'Vietnamese',
  uk: 'Ukrainian',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian'
};

// Fill in missing languages with English fallback
Object.keys(basicTranslations).forEach(lang => {
  if (!translations[lang as Language]) {
    translations[lang as Language] = { ...translations.en };
  }
});

const supportedLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' }
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [defaultLanguage, setDefaultLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
      setDefaultLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const setDefaultLanguage = (lang: Language) => {
    setDefaultLanguageState(lang);
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), value);
      });
    }
    
    return translation;
  };

  const translateDynamicContent = async (content: string, targetLanguage?: Language): Promise<string> => {
    const target = targetLanguage || language;
    if (target === 'en') return content;

    try {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) return content;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate this text to ${supportedLanguages.find(l => l.code === target)?.name || target}: "${content}"`
            }]
          }]
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || content;
    } catch (error) {
      console.error('Translation error:', error);
      return content;
    }
  };

  const detectLanguage = async (text: string): Promise<Language | null> => {
    try {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      if (!GEMINI_API_KEY) return null;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Detect the language of this text and return only the ISO 639-1 language code (like 'en', 'es', 'fr'): "${text}"`
            }]
          }]
        })
      });

      const data = await response.json();
      const detectedCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
      
      return supportedLanguages.find(l => l.code === detectedCode)?.code || null;
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  };

  const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
    return translateDynamicContent(text, targetLanguage);
  };

  const getSupportedLanguages = (): LanguageInfo[] => {
    return supportedLanguages;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    translateDynamicContent,
    detectLanguage,
    translateText,
    getSupportedLanguages,
    defaultLanguage,
    setDefaultLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};