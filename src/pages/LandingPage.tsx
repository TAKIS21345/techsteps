import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  MessageSquare, 
  Headphones, 
  Camera, 
  Users, 
  Shield, 
  Zap,
  Star,
  CheckCircle,
  Play,
  Award,
  Heart,
  Sparkles
} from 'lucide-react';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';

const LandingPage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Margaret K.",
      age: 72,
      location: "Austin, TX",
      content: "Finally, someone who explains technology in a way I can understand! The step-by-step instructions helped me set up my new phone perfectly. I feel so much more confident now!",
      rating: 5,
      avatar: "M",
      color: "bg-blue-500"
    },
    {
      name: "Robert H.",
      age: 68,
      location: "Seattle, WA", 
      content: "The voice feature is amazing! I can just ask my questions out loud and get clear answers. It's like having a tech-savvy grandchild available 24/7.",
      rating: 5,
      avatar: "R",
      color: "bg-green-500"
    },
    {
      name: "Dorothy S.",
      age: 75,
      location: "Miami, FL",
      content: "I love the photo feature! I took a picture of a confusing cable and instantly knew what it was for. This app has made me much more confident with technology.",
      rating: 5,
      avatar: "D",
      color: "bg-purple-500"
    },
    {
      name: "Frank M.",
      age: 70,
      location: "Denver, CO",
      content: "I was so frustrated with my smart TV until I found this helper. Now I can stream shows, adjust settings, and even video chat with my grandkids!",
      rating: 5,
      avatar: "F",
      color: "bg-orange-500"
    }
  ];

  const stats = [
    { number: "50,000+", label: t('stats.seniorsHelped'), icon: Users },
    { number: "1M+", label: t('stats.questionsAnswered'), icon: MessageSquare },
    { number: "99%", label: t('stats.successRate'), icon: Award },
    { number: "24/7", label: t('stats.alwaysAvailable'), icon: Shield }
  ];

  const popularQuestions = [
    t('questions.connectWifi'),
    t('questions.makeTextBigger'),
    t('questions.takeScreenshot'),
    t('questions.updateApps'),
    t('questions.makeVideoCall'),
    t('questions.backupPhotos'),
    t('questions.onlineBanking'),
    t('questions.joinZoom')
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-6 sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button className="text-gray-600 hover:text-gray-800 focus:outline-none p-2 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
          </div>
          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-lg">
              {t('nav.features')}
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-lg">
              {t('nav.reviews')}
            </a>
            <LanguageSelector showLabel={false} />
            <Link 
              to="/auth" 
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 text-lg"
            >
              {t('nav.signIn')}
            </Link>
            <Link 
              to="/auth" 
              className="btn-primary text-lg px-6 py-3"
            >
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean and Modern */}
      <section className="container mx-auto px-4 sm:px-6 py-20 md:py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-base font-medium mb-8 border border-blue-100">
            <Sparkles className="w-5 h-5 mr-2" />
            {t('landing.hero.tagline')}
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
            {t('landing.hero.title')}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block mt-2">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link 
              to="/auth" 
              className="btn-primary text-xl px-8 py-4 sm:px-10 sm:py-5 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('landing.hero.startLearningButton')}
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
            <button className="btn-secondary text-xl px-8 py-4 sm:px-10 sm:py-5 inline-flex items-center group">
              <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
              {t('landing.hero.watchDemoButton')}
            </button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 mb-16">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-lg">{t('landing.hero.freeForever')}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-lg">{t('landing.hero.noCreditCard')}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-lg">{t('landing.hero.available247')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {t('landing.featuresSection.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.featuresSection.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(t('landing.featuresSection.items', { returnObjects: true }) as {title: string, description: string}[]).map((feature, index) => {
              const icons = [MessageSquare, Headphones, Camera, Users, Shield, Zap];
              const colors = ["blue", "green", "purple", "orange", "red", "yellow"];
              const IconComponent = icons[index % icons.length];
              const color = colors[index % colors.length];

              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-${color}-50 border border-${color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                    <IconComponent className={`w-8 h-8 text-${color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t('landing.popularQuestionsSection.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              {t('landing.popularQuestionsSection.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {popularQuestions.map((question, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-gray-700 group-hover:text-gray-900 transition-colors">{question}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/auth" 
              className="btn-primary text-base px-6 py-3 sm:text-lg sm:px-8 sm:py-4"
            >
              {t('landing.popularQuestionsSection.askYourQuestionButton')}
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {t('landing.testimonialsSection.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              {t('landing.testimonialsSection.subtitle')}
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="card p-6 sm:p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <div className={`w-16 h-16 sm:w-20 sm:h-20 ${testimonials[activeTestimonial].color} rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mx-auto mb-6`}>
                {t(`landing.testimonialsSection.testimonialContent.${activeTestimonial}.avatar`, testimonials[activeTestimonial].avatar)}
              </div>
              
              <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-700 italic mb-6 leading-relaxed">
                "{t(`landing.testimonialsSection.testimonialContent.${activeTestimonial}.content`, testimonials[activeTestimonial].content)}"
              </blockquote>
              
              <div className="text-base sm:text-lg font-semibold text-gray-800">
                {t(`landing.testimonialsSection.testimonialContent.${activeTestimonial}.name`, testimonials[activeTestimonial].name)}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                {t('landing.testimonialsSection.ageLabel', { age: testimonials[activeTestimonial].age })} • {t(`landing.testimonialsSection.testimonialContent.${activeTestimonial}.location`, testimonials[activeTestimonial].location)}
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === activeTestimonial ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Grid of Additional Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            {(t('landing.testimonialsSection.testimonialContent', { returnObjects: true }) as any[]).slice(0, 3).map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  {/* Assuming colors are not part of i18n but design, kept local testimonial array for colors for now or define them statically */}
                  <div className={`w-12 h-12 ${testimonials[index % testimonials.length].color} rounded-full flex items-center justify-center text-white font-bold mr-4`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">Age {testimonial.age}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic text-sm">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            {t('landing.ctaSection.title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('landing.ctaSection.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link 
              to="/auth" 
              className="inline-flex items-center bg-white text-blue-600 font-bold px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-xl text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              {t('landing.ctaSection.getStartedButton')}
              <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 items-center justify-center sm:space-x-4 md:space-x-6 text-blue-100 text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span>{t('landing.hero.noCreditCard')}</span> {/* Reusing key */}
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span>{t('landing.hero.freeForever')}</span> {/* Reusing key */}
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span>{t('landing.ctaSection.setupInMinutes')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Logo size="sm" />
              <p className="text-gray-400 mt-4 leading-relaxed text-sm">
                {t('landing.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-base">{t('landing.footer.featuresTitle')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {(t('landing.footer.featuresItems', { returnObjects: true }) as string[]).map((item, index) => (
                  <li key={index}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-base">{t('landing.footer.supportTitle')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {(t('landing.footer.supportItems', { returnObjects: true }) as string[]).map((item, index) => (
                  <li key={index}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-base">{t('landing.footer.companyTitle')}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {(t('landing.footer.companyItems', { returnObjects: true }) as string[]).map((item, index) => {
                  if (item === "Privacy Policy") {
                    return <li key={index}><Link to="/privacy-policy" className="hover:text-white transition-colors">{item}</Link></li>;
                  }
                  // Add similar condition for Terms of Service if that page existed and was linked
                  return <li key={index}><a href="#" className="hover:text-white transition-colors">{item}</a></li>;
                })}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p className="text-gray-400 mb-4 md:mb-0">{t('landing.footer.copyright')}</p>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-gray-400">{t('landing.footer.trustedBy')}</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-400">{t('landing.footer.trustedByCount')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;