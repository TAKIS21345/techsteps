// Cultural content service for localized content

export interface CulturalContent {
  language: string;
  region: string;
  examples: {
    technology: string[];
    scenarios: string[];
    names: string[];
    locations: string[];
  };
  preferences: {
    colors: string[];
    symbols: string[];
    imagery: string[];
    layout: 'left-to-right' | 'right-to-left';
    spacing: 'compact' | 'normal' | 'generous';
    fontPreferences: string[];
  };
  regional: RegionalContent;
  communication: {
    formality: 'formal' | 'informal' | 'mixed';
    directness: 'direct' | 'indirect';
    honorifics: boolean;
  };
}

export interface SeniorScenario {
  id: string;
  title: string;
  description: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  culturallyRelevant: boolean;
  ageAppropriate: boolean;
  region: string;
  tags: string[];
  estimatedTime: number; // in minutes
  prerequisites: string[];
  culturalNotes?: string;
}

export interface RegionalContent {
  region: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  phoneFormat: string;
  addressFormat: string;
  commonApps: string[];
  bankingTerms: string[];
  shoppingPlatforms: string[];
  socialPlatforms: string[];
  governmentServices: string[];
}

class CulturalContentService {
  private culturalData: Record<string, CulturalContent> = {
    'en': {
      language: 'en',
      region: 'Global English',
      examples: {
        technology: ['smartphone', 'laptop', 'tablet', 'smart TV', 'email'],
        scenarios: [
          'Video calling grandchildren who live far away',
          'Online banking to check account balance',
          'Shopping on Amazon for household items',
          'Using Facebook to connect with old friends',
          'Streaming Netflix shows with family',
          'Booking a doctor\'s appointment online',
          'Using WhatsApp to chat with family',
          'Reading news on a tablet',
          'Taking photos with smartphone camera',
          'Using GPS navigation while driving'
        ],
        names: ['Margaret', 'Robert', 'Dorothy', 'Frank', 'Helen', 'William', 'Betty', 'James', 'Patricia', 'Charles'],
        locations: ['local library', 'community center', 'grocery store', 'doctor\'s office', 'senior center', 'church', 'pharmacy', 'bank branch']
      },
      preferences: {
        colors: ['blue', 'green', 'warm gray'],
        symbols: ['✓', '→', '📞', '💻', '📧'],
        imagery: ['family photos', 'nature', 'comfortable homes'],
        layout: 'left-to-right',
        spacing: 'generous',
        fontPreferences: ['Arial', 'Helvetica', 'Verdana']
      },
      regional: {
        region: 'Global English',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12-hour',
        phoneFormat: '(XXX) XXX-XXXX',
        addressFormat: 'Street, City, State ZIP',
        commonApps: ['WhatsApp', 'Facebook', 'Gmail', 'Amazon', 'Netflix'],
        bankingTerms: ['checking account', 'savings account', 'debit card', 'online banking'],
        shoppingPlatforms: ['Amazon', 'eBay', 'Walmart', 'Target'],
        socialPlatforms: ['Facebook', 'WhatsApp', 'Skype', 'FaceTime'],
        governmentServices: ['Social Security', 'Medicare', 'IRS', 'DMV']
      },
      communication: {
        formality: 'mixed',
        directness: 'direct',
        honorifics: false
      }
    },
    'es': {
      language: 'es',
      region: 'Latin America & Spain',
      examples: {
        technology: ['teléfono móvil', 'computadora', 'tableta', 'televisión inteligente', 'correo electrónico'],
        scenarios: [
          'Videollamadas con los nietos que viven lejos',
          'Banca en línea para revisar la cuenta',
          'Compras en línea para la casa',
          'Usar WhatsApp para hablar con la familia',
          'Ver telenovelas y noticias en streaming',
          'Reservar cita médica por internet',
          'Enviar fotos a los hijos por WhatsApp',
          'Leer noticias en el teléfono',
          'Usar el GPS para llegar a lugares',
          'Pagar servicios por internet'
        ],
        names: ['María', 'José', 'Carmen', 'Antonio', 'Isabel', 'Francisco', 'Rosa', 'Manuel', 'Ana', 'Carlos'],
        locations: ['iglesia local', 'centro comunitario', 'mercado', 'clínica médica', 'centro de adultos mayores', 'farmacia', 'banco', 'plaza']
      },
      preferences: {
        colors: ['warm colors', 'gold', 'red', 'blue'],
        symbols: ['✓', '→', '📞', '💻', '📧', '🏠'],
        imagery: ['family gatherings', 'religious imagery', 'traditional foods'],
        layout: 'left-to-right',
        spacing: 'generous',
        fontPreferences: ['Arial', 'Helvetica', 'Open Sans']
      },
      regional: {
        region: 'Latin America & Spain',
        currency: 'EUR/USD/Local',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24-hour',
        phoneFormat: '+XX XXX XXX XXX',
        addressFormat: 'Calle, Número, Ciudad, Código Postal',
        commonApps: ['WhatsApp', 'Facebook', 'Gmail', 'MercadoLibre', 'Netflix'],
        bankingTerms: ['cuenta corriente', 'cuenta de ahorros', 'tarjeta de débito', 'banca en línea'],
        shoppingPlatforms: ['MercadoLibre', 'Amazon', 'AliExpress', 'Falabella'],
        socialPlatforms: ['WhatsApp', 'Facebook', 'Skype', 'Telegram'],
        governmentServices: ['Seguridad Social', 'Salud Pública', 'Hacienda', 'Registro Civil']
      },
      communication: {
        formality: 'formal',
        directness: 'indirect',
        honorifics: true
      }
    },
    'zh': {
      language: 'zh',
      region: 'China & Chinese-speaking regions',
      examples: {
        technology: ['智能手机', '电脑', '平板电脑', '智能电视', '电子邮件'],
        scenarios: [
          '与孙子孙女视频通话，看他们成长',
          '使用手机银行查看账户余额',
          '在淘宝上购买日用品',
          '使用微信与家人朋友聊天',
          '观看在线新闻和电视剧',
          '网上预约医院挂号',
          '用微信发红包给孙子',
          '在手机上看新闻',
          '使用导航软件出行',
          '网上缴纳水电费'
        ],
        names: ['王阿姨', '李叔叔', '张奶奶', '陈爷爷', '刘阿姨', '赵叔叔', '孙奶奶', '周爷爷', '吴阿姨', '郑叔叔'],
        locations: ['社区中心', '公园', '菜市场', '医院', '老年活动中心', '药店', '银行', '超市']
      },
      preferences: {
        colors: ['red', 'gold', 'jade green'],
        symbols: ['✓', '→', '📞', '💻', '📧', '🏮'],
        imagery: ['family harmony', 'traditional elements', 'nature'],
        layout: 'left-to-right',
        spacing: 'normal',
        fontPreferences: ['SimSun', 'Microsoft YaHei', 'PingFang SC']
      },
      regional: {
        region: 'China & Chinese-speaking regions',
        currency: 'CNY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24-hour',
        phoneFormat: 'XXX XXXX XXXX',
        addressFormat: '省市区街道门牌号',
        commonApps: ['微信', '支付宝', '淘宝', '抖音', '腾讯视频'],
        bankingTerms: ['储蓄账户', '活期存款', '银行卡', '手机银行'],
        shoppingPlatforms: ['淘宝', '京东', '拼多多', '天猫'],
        socialPlatforms: ['微信', 'QQ', '钉钉', '腾讯会议'],
        governmentServices: ['社保', '医保', '税务', '公积金']
      },
      communication: {
        formality: 'formal',
        directness: 'indirect',
        honorifics: true
      }
    },
    'ar': {
      language: 'ar',
      region: 'Middle East & North Africa',
      examples: {
        technology: ['الهاتف الذكي', 'الحاسوب', 'الجهاز اللوحي', 'التلفزيون الذكي', 'البريد الإلكتروني'],
        scenarios: [
          'مكالمات فيديو مع الأحفاد لرؤيتهم',
          'استخدام الخدمات المصرفية عبر الإنترنت',
          'التسوق عبر الإنترنت للمنزل',
          'استخدام واتساب للتواصل مع العائلة',
          'مشاهدة البرامج والأخبار التلفزيونية',
          'حجز موعد طبي عبر الإنترنت',
          'إرسال الصور للأولاد عبر واتساب',
          'قراءة الأخبار على الهاتف',
          'استخدام الخرائط للوصول للأماكن',
          'دفع الفواتير عبر الإنترنت'
        ],
        names: ['أم أحمد', 'أبو محمد', 'الحاجة فاطمة', 'العم حسن', 'الخالة عائشة', 'أم علي', 'أبو يوسف', 'الحاجة زينب', 'العم سالم', 'الخالة مريم'],
        locations: ['المسجد', 'المركز المجتمعي', 'السوق', 'العيادة الطبية', 'مركز كبار السن', 'الصيدلية', 'البنك', 'المتنزه']
      },
      preferences: {
        colors: ['green', 'blue', 'gold'],
        symbols: ['✓', '←', '📞', '💻', '📧', '🕌'],
        imagery: ['family respect', 'Islamic patterns', 'traditional architecture'],
        layout: 'right-to-left',
        spacing: 'generous',
        fontPreferences: ['Arial', 'Tahoma', 'Noto Sans Arabic']
      },
      regional: {
        region: 'Middle East & North Africa',
        currency: 'Local Currency',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        phoneFormat: '+XXX XX XXX XXXX',
        addressFormat: 'الشارع، الحي، المدينة، الرمز البريدي',
        commonApps: ['واتساب', 'فيسبوك', 'جيميل', 'أمازون', 'نتفليكس'],
        bankingTerms: ['حساب جاري', 'حساب توفير', 'بطاقة خصم', 'الخدمات المصرفية الإلكترونية'],
        shoppingPlatforms: ['أمازون', 'نون', 'سوق', 'جوميا'],
        socialPlatforms: ['واتساب', 'فيسبوك', 'سكايب', 'تيليجرام'],
        governmentServices: ['الضمان الاجتماعي', 'الصحة', 'الضرائب', 'الأحوال المدنية']
      },
      communication: {
        formality: 'formal',
        directness: 'indirect',
        honorifics: true
      }
    },
    'hi': {
      language: 'hi',
      region: 'India',
      examples: {
        technology: ['स्मार्टफोन', 'लैपटॉप', 'टैबलेट', 'स्मार्ट टीवी', 'ईमेल'],
        scenarios: [
          'पोते-पोतियों से वीडियो कॉल करना',
          'मोबाइल बैंकिंग से पैसे चेक करना',
          'ऑनलाइन घर का सामान खरीदना',
          'परिवार के साथ व्हाट्सऐप पर बात करना',
          'ऑनलाइन फिल्में और धारावाहिक देखना',
          'डॉक्टर की अपॉइंटमेंट ऑनलाइन बुक करना',
          'व्हाट्सऐप पर बच्चों को फोटो भेजना',
          'मोबाइल पर समाचार पढ़ना',
          'गूगल मैप से रास्ता देखना',
          'ऑनलाइन बिजली-पानी का बिल भरना'
        ],
        names: ['दादी जी', 'दादा जी', 'नानी जी', 'नाना जी', 'मम्मी जी', 'पापा जी', 'अम्मा जी', 'बाबू जी', 'मौसी जी', 'मामा जी'],
        locations: ['मंदिर', 'सामुदायिक केंद्र', 'बाजार', 'अस्पताल', 'वरिष्ठ नागरिक केंद्र', 'दवाखाना', 'बैंक', 'पार्क']
      },
      preferences: {
        colors: ['saffron', 'white', 'green', 'gold'],
        symbols: ['✓', '→', '📞', '💻', '📧', '🕉️'],
        imagery: ['joint family', 'religious symbols', 'traditional festivals'],
        layout: 'left-to-right',
        spacing: 'generous',
        fontPreferences: ['Devanagari', 'Noto Sans Devanagari', 'Mangal']
      },
      regional: {
        region: 'India',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        phoneFormat: '+91 XXXXX XXXXX',
        addressFormat: 'मकान नंबर, गली, शहर, पिन कोड',
        commonApps: ['व्हाट्सऐप', 'फेसबुक', 'जीमेल', 'अमेज़न', 'नेटफ्लिक्स'],
        bankingTerms: ['बचत खाता', 'चालू खाता', 'डेबिट कार्ड', 'मोबाइल बैंकिंग'],
        shoppingPlatforms: ['अमेज़न', 'फ्लिपकार्ट', 'मीशो', 'स्नैपडील'],
        socialPlatforms: ['व्हाट्सऐप', 'फेसबुक', 'स्काइप', 'टेलीग्राम'],
        governmentServices: ['आधार', 'पैन कार्ड', 'ईपीएफ', 'आयकर']
      },
      communication: {
        formality: 'formal',
        directness: 'indirect',
        honorifics: true
      }
    },
    'ja': {
      language: 'ja',
      region: 'Japan',
      examples: {
        technology: ['スマートフォン', 'パソコン', 'タブレット', 'スマートテレビ', 'メール'],
        scenarios: [
          '孫とのビデオ通話で成長を見守る',
          'オンラインバンキングで残高確認',
          'オンラインショッピングで日用品購入',
          'LINEで家族と日常の連絡',
          'オンラインでニュースや番組視聴',
          'オンラインで病院の予約',
          'LINEで孫に写真を送る',
          'スマートフォンでニュースを読む',
          'ナビアプリで道案内',
          'オンラインで公共料金支払い'
        ],
        names: ['田中さん', '佐藤さん', '鈴木さん', '高橋さん', '渡辺さん', '伊藤さん', '山田さん', '中村さん', '小林さん', '加藤さん'],
        locations: ['地域センター', '公園', 'スーパーマーケット', '病院', 'シルバーセンター', '薬局', '銀行', '図書館']
      },
      preferences: {
        colors: ['red', 'white', 'blue', 'subtle pastels'],
        symbols: ['✓', '→', '📞', '💻', '📧', '🌸'],
        imagery: ['respect for elders', 'nature', 'clean aesthetics'],
        layout: 'left-to-right',
        spacing: 'normal',
        fontPreferences: ['Hiragino Sans', 'Yu Gothic', 'Noto Sans JP']
      },
      regional: {
        region: 'Japan',
        currency: 'JPY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24-hour',
        phoneFormat: 'XXX-XXXX-XXXX',
        addressFormat: '〒郵便番号 都道府県市区町村番地',
        commonApps: ['LINE', 'Yahoo!', 'Gmail', 'Amazon', 'Netflix'],
        bankingTerms: ['普通預金', '当座預金', 'キャッシュカード', 'ネットバンキング'],
        shoppingPlatforms: ['Amazon', '楽天', 'Yahoo!ショッピング', 'メルカリ'],
        socialPlatforms: ['LINE', 'Facebook', 'Skype', 'Zoom'],
        governmentServices: ['年金', '健康保険', '税務署', 'マイナンバー']
      },
      communication: {
        formality: 'formal',
        directness: 'indirect',
        honorifics: true
      }
    }
  };

  /**
   * Get culturally adapted content for a specific language
   */
  getCulturalContent(language: string): CulturalContent | null {
    return this.culturalData[language] || null;
  }

  /**
   * Generate culturally appropriate senior scenarios
   */
  generateSeniorScenarios(language: string, count: number = 10): SeniorScenario[] {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return [];

    const scenarios: SeniorScenario[] = [];
    const baseScenarios = [
      {
        titleKey: 'scenarios.videoCall',
        descriptionKey: 'scenarios.videoCallDesc',
        difficulty: 'beginner' as const,
        tags: ['communication', 'family', 'video'],
        estimatedTime: 15,
        prerequisites: ['basic phone usage']
      },
      {
        titleKey: 'scenarios.onlineBanking',
        descriptionKey: 'scenarios.onlineBankingDesc',
        difficulty: 'intermediate' as const,
        tags: ['banking', 'security', 'finance'],
        estimatedTime: 25,
        prerequisites: ['internet basics', 'password management']
      },
      {
        titleKey: 'scenarios.socialMedia',
        descriptionKey: 'scenarios.socialMediaDesc',
        difficulty: 'beginner' as const,
        tags: ['communication', 'social', 'messaging'],
        estimatedTime: 20,
        prerequisites: ['basic phone usage']
      },
      {
        titleKey: 'scenarios.onlineShopping',
        descriptionKey: 'scenarios.onlineShoppingDesc',
        difficulty: 'intermediate' as const,
        tags: ['shopping', 'daily life', 'convenience'],
        estimatedTime: 30,
        prerequisites: ['internet basics', 'payment methods']
      },
      {
        titleKey: 'scenarios.emailBasics',
        descriptionKey: 'scenarios.emailBasicsDesc',
        difficulty: 'beginner' as const,
        tags: ['communication', 'email', 'basics'],
        estimatedTime: 15,
        prerequisites: ['internet basics']
      }
    ];

    baseScenarios.forEach((base, index) => {
      if (index < count) {
        const scenario = cultural.examples.scenarios[index] || base.titleKey;
        scenarios.push({
          id: `${language}-scenario-${index}`,
          title: scenario,
          description: this.adaptScenarioDescription(base.descriptionKey, cultural),
          context: cultural.region,
          difficulty: base.difficulty,
          culturallyRelevant: true,
          ageAppropriate: true,
          region: cultural.region,
          tags: base.tags,
          estimatedTime: base.estimatedTime,
          prerequisites: base.prerequisites,
          culturalNotes: this.generateCulturalNotes(language, base.tags)
        });
      }
    });

    return scenarios;
  }

  /**
   * Adapt UI preferences for cultural context
   */
  getUIPreferences(language: string): {
    colorScheme: string[];
    preferredSymbols: string[];
    communicationStyle: CulturalContent['communication'];
  } {
    const cultural = this.getCulturalContent(language);
    if (!cultural) {
      return {
        colorScheme: ['blue', 'gray', 'white'],
        preferredSymbols: ['✓', '→', '📞'],
        communicationStyle: {
          formality: 'mixed',
          directness: 'direct',
          honorifics: false
        }
      };
    }

    return {
      colorScheme: cultural.preferences.colors,
      preferredSymbols: cultural.preferences.symbols,
      communicationStyle: cultural.communication
    };
  }

  /**
   * Get culturally appropriate names for examples
   */
  getCulturalNames(language: string, count: number = 6): string[] {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return ['User', 'Person', 'Individual'];

    return cultural.examples.names.slice(0, count);
  }

  /**
   * Get culturally appropriate locations for examples
   */
  getCulturalLocations(language: string): string[] {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return ['community center', 'library', 'store'];

    return cultural.examples.locations;
  }

  /**
   * Adapt content tone based on cultural communication preferences
   */
  adaptContentTone(content: string, language: string): string {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return content;

    let adaptedContent = content;

    // Adjust formality
    if (cultural.communication.formality === 'formal') {
      adaptedContent = this.makeFormal(adaptedContent, language);
    } else if (cultural.communication.formality === 'informal') {
      adaptedContent = this.makeInformal(adaptedContent, language);
    }

    // Adjust directness
    if (cultural.communication.directness === 'indirect') {
      adaptedContent = this.makeIndirect(adaptedContent, language);
    }

    return adaptedContent;
  }

  /**
   * Check if content is culturally appropriate
   */
  validateCulturalAppropriateness(content: string, language: string): {
    appropriate: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const cultural = this.getCulturalContent(language);
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!cultural) {
      return { appropriate: true, issues, suggestions };
    }

    // Check for culturally sensitive terms
    const sensitiveTerms = this.getSensitiveTerms(language);
    sensitiveTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        issues.push(`Contains potentially sensitive term: ${term}`);
        suggestions.push(`Consider using alternative phrasing`);
      }
    });

    // Check communication style alignment
    if (cultural.communication.formality === 'formal' && this.isInformal(content)) {
      issues.push('Content tone is too informal for this culture');
      suggestions.push('Use more formal language and respectful terms');
    }

    return {
      appropriate: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Get region-specific technology examples
   */
  getRegionalTechExamples(language: string): string[] {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return ['computer', 'phone', 'internet'];

    return cultural.examples.technology;
  }

  /**
   * Private helper methods
   */
  private adaptScenarioDescription(descriptionKey: string, cultural: CulturalContent): string {
    // This would typically use the translation system
    // For now, return a culturally adapted description
    const name = cultural.examples.names[0] || 'User';
    const location = cultural.examples.locations[0] || 'community center';
    
    return `Help ${name} learn to use technology at the ${location}`;
  }

  private makeFormal(content: string, language: string): string {
    // Language-specific formality adjustments
    switch (language) {
      case 'ja':
        return content.replace(/you/gi, 'you (respectfully)');
      case 'es':
        return content.replace(/you/gi, 'usted');
      case 'hi':
        return content.replace(/you/gi, 'aap');
      default:
        return content;
    }
  }

  private makeInformal(content: string): string {
    // Make content more casual and friendly
    return content.replace(/please/gi, '').replace(/kindly/gi, '');
  }

  private makeIndirect(content: string): string {
    // Add softening language
    return content.replace(/You should/gi, 'You might want to consider')
                 .replace(/Do this/gi, 'Perhaps you could try this');
  }

  private getSensitiveTerms(language: string): string[] {
    const sensitiveTerms: Record<string, string[]> = {
      'ar': ['alcohol', 'pork', 'gambling'],
      'hi': ['beef', 'cow', 'leather'],
      'he': ['pork', 'shellfish'],
      'zh': ['death', 'four', 'clock']
    };

    return sensitiveTerms[language] || [];
  }

  private isInformal(content: string): boolean {
    const informalIndicators = ['hey', 'yeah', 'gonna', 'wanna', 'cool', 'awesome'];
    return informalIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  /**
   * Get regional content for a specific language
   */
  getRegionalContent(language: string): RegionalContent | null {
    const cultural = this.getCulturalContent(language);
    return cultural?.regional || null;
  }

  /**
   * Get culturally appropriate UI layout preferences
   */
  getLayoutPreferences(language: string): {
    direction: 'ltr' | 'rtl';
    spacing: 'compact' | 'normal' | 'generous';
    fontFamily: string[];
  } {
    const cultural = this.getCulturalContent(language);
    if (!cultural) {
      return {
        direction: 'ltr',
        spacing: 'normal',
        fontFamily: ['Arial', 'sans-serif']
      };
    }

    return {
      direction: cultural.preferences.layout === 'right-to-left' ? 'rtl' : 'ltr',
      spacing: cultural.preferences.spacing,
      fontFamily: cultural.preferences.fontPreferences
    };
  }

  /**
   * Generate age-appropriate scenarios for seniors
   */
  generateAgeAppropriateScenarios(language: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): SeniorScenario[] {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return [];

    const scenarios: SeniorScenario[] = [];
    const scenarioTemplates = [
      {
        titleTemplate: 'Video calling family',
        descriptionTemplate: 'Learn to make video calls to stay connected with loved ones',
        tags: ['communication', 'family', 'video'],
        estimatedTime: 15,
        prerequisites: ['basic phone usage']
      },
      {
        titleTemplate: 'Online banking basics',
        descriptionTemplate: 'Safely check your account balance and transaction history',
        tags: ['banking', 'security', 'finance'],
        estimatedTime: 25,
        prerequisites: ['internet basics', 'password management']
      },
      {
        titleTemplate: 'Shopping for essentials',
        descriptionTemplate: 'Order household items and groceries online',
        tags: ['shopping', 'daily life', 'convenience'],
        estimatedTime: 30,
        prerequisites: ['internet basics', 'payment methods']
      },
      {
        titleTemplate: 'Staying connected with messaging',
        descriptionTemplate: 'Use messaging apps to chat with family and friends',
        tags: ['communication', 'social', 'messaging'],
        estimatedTime: 20,
        prerequisites: ['basic phone usage']
      },
      {
        titleTemplate: 'Entertainment and news',
        descriptionTemplate: 'Watch shows, movies, and stay updated with news',
        tags: ['entertainment', 'news', 'streaming'],
        estimatedTime: 15,
        prerequisites: ['internet basics']
      }
    ];

    scenarioTemplates.forEach((template, index) => {
      if (index < cultural.examples.scenarios.length) {
        const culturalScenario = cultural.examples.scenarios[index];
        scenarios.push({
          id: `${language}-${difficulty}-${index}`,
          title: culturalScenario,
          description: this.adaptScenarioDescription(template.descriptionTemplate, cultural),
          context: cultural.region,
          difficulty,
          culturallyRelevant: true,
          ageAppropriate: true,
          region: cultural.region,
          tags: template.tags,
          estimatedTime: template.estimatedTime,
          prerequisites: template.prerequisites,
          culturalNotes: this.generateCulturalNotes(language, template.tags)
        });
      }
    });

    return scenarios;
  }

  /**
   * Adapt content for cultural context beyond just language
   */
  adaptForCulturalContext(content: string, language: string, contentType: 'tutorial' | 'example' | 'scenario' = 'tutorial'): string {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return content;

    let adaptedContent = content;

    // Replace generic technology terms with regional equivalents
    const regionalTech = cultural.regional.commonApps;
    const genericApps = ['messaging app', 'social media', 'video calling', 'online shopping', 'banking app'];
    
    genericApps.forEach((generic, index) => {
      if (regionalTech[index] && adaptedContent.includes(generic)) {
        adaptedContent = adaptedContent.replace(new RegExp(generic, 'gi'), regionalTech[index]);
      }
    });

    // Adapt currency and format references
    adaptedContent = adaptedContent.replace(/\$\d+/g, (match) => {
      const amount = match.substring(1);
      return `${amount} ${cultural.regional.currency}`;
    });

    // Adapt date format references
    if (adaptedContent.includes('MM/DD/YYYY')) {
      adaptedContent = adaptedContent.replace(/MM\/DD\/YYYY/g, cultural.regional.dateFormat);
    }

    // Adapt phone format references
    if (adaptedContent.includes('phone number')) {
      adaptedContent = adaptedContent.replace(/phone number/g, `phone number (${cultural.regional.phoneFormat})`);
    }

    return adaptedContent;
  }

  /**
   * Get culturally appropriate color scheme
   */
  getCulturalColorScheme(language: string): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  } {
    const cultural = this.getCulturalContent(language);
    if (!cultural) {
      return {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      };
    }

    const colors = cultural.preferences.colors;
    return {
      primary: this.mapColorToHex(colors[0] || 'blue'),
      secondary: this.mapColorToHex(colors[1] || 'gray'),
      accent: this.mapColorToHex(colors[2] || 'green'),
      background: '#FFFFFF',
      text: '#1F2937'
    };
  }

  /**
   * Generate cultural notes for scenarios
   */
  private generateCulturalNotes(language: string, tags: string[]): string {
    const cultural = this.getCulturalContent(language);
    if (!cultural) return '';

    const notes: string[] = [];

    if (tags.includes('banking') && cultural.communication.formality === 'formal') {
      notes.push('Use formal language when interacting with banking services');
    }

    if (tags.includes('family') && cultural.communication.honorifics) {
      notes.push('Remember to use appropriate titles and respectful language');
    }

    if (tags.includes('social') && language === 'ar') {
      notes.push('Consider privacy settings appropriate for your cultural context');
    }

    return notes.join('. ');
  }

  /**
   * Map color names to hex values
   */
  private mapColorToHex(colorName: string): string {
    const colorMap: Record<string, string> = {
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#10B981',
      'gold': '#F59E0B',
      'saffron': '#FF8C00',
      'jade green': '#00A86B',
      'warm gray': '#6B7280',
      'warm colors': '#F97316'
    };

    return colorMap[colorName.toLowerCase()] || '#3B82F6';
  }
}

export const culturalContentService = new CulturalContentService();