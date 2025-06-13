import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();

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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
              {t('nav.features')}
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
              {t('nav.reviews')}
            </a>
            <LanguageSelector showLabel={false} />
            <Link 
              to="/auth" 
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {t('nav.signIn')}
            </Link>
            <Link 
              to="/auth" 
              className="btn-primary"
            >
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Trusted by seniors worldwide
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Technology made 
            <span className="gradient-text block">simple & clear</span>
          </h1>
          
          <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Master technology with confidence through personalized, step-by-step guidance that feels like having a patient friend by your side.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link 
              to="/auth" 
              className="btn-primary text-xl px-10 py-5 inline-flex items-center shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              Start Learning Free
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
            <button className="btn-secondary text-xl px-10 py-5 inline-flex items-center group">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-12">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Free forever</span>
            <span className="mx-2">•</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Available 24/7</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These are just a few of the features offered to help you grow!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Step-by-Step Guidance",
                description: "Get clear, easy-to-follow instructions for any tech question. Each step is explained in simple terms with visual cues.",
                color: "blue",
                delay: "0s"
              },
              {
                icon: Headphones,
                title: "Voice Support",
                description: "Ask questions with your voice and have answers read aloud. Perfect for hands-free help when you need it most.",
                color: "green",
                delay: "0.1s"
              },
              {
                icon: Camera,
                title: "Photo Explainer",
                description: "Take a photo of any cable, button, or device and get an instant explanation of what it is and how to use it.",
                color: "purple",
                delay: "0.2s"
              },
              {
                icon: Users,
                title: "Senior-Friendly Design",
                description: "Large text, intuitive interface, and patient explanations designed specifically with seniors in mind.",
                color: "orange",
                delay: "0.3s"
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Your personal information is protected with enterprise-grade security. No data shared with third parties.",
                color: "red",
                delay: "0.4s"
              },
              {
                icon: Zap,
                title: "Instant Answers",
                description: "Get immediate help 24/7. No waiting on hold or scheduling appointments. Just ask and get answers.",
                color: "yellow",
                delay: "0.5s"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="card p-8 text-center hover:shadow-2xl transition-all duration-500 animate-slide-up group hover:-translate-y-2"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`w-16 h-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Popular Questions We Help With
            </h2>
            <p className="text-xl text-gray-600">
              See what other seniors are asking about
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
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
              className="btn-primary text-lg px-8 py-4"
            >
              Ask Your Question Now
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of seniors who've found tech help made simple
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="card p-12 text-center relative overflow-hidden">
              <div className="absolute top-6 left-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <div className={`w-20 h-20 ${testimonials[activeTestimonial].color} rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6`}>
                {testimonials[activeTestimonial].avatar}
              </div>
              
              <blockquote className="text-2xl text-gray-700 italic mb-6 leading-relaxed">
                "{testimonials[activeTestimonial].content}"
              </blockquote>
              
              <div className="text-lg font-semibold text-gray-800">
                {testimonials[activeTestimonial].name}
              </div>
              <div className="text-gray-600">
                Age {testimonials[activeTestimonial].age} • {testimonials[activeTestimonial].location}
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
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold mr-4`}>
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
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <Heart className="w-16 h-16 text-white/80 mx-auto mb-6" />
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Master Technology?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join our community of empowered seniors who've made technology simple and approachable. 
            Start getting clear, helpful answers today - completely free!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link 
              to="/auth" 
              className="inline-flex items-center bg-white text-blue-600 font-bold px-10 py-5 rounded-xl text-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              Get Started Free Today
              <ArrowRight className="ml-3 w-6 h-6" />
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-6 text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" />
              <p className="text-gray-400 mt-4 leading-relaxed">
                Making technology accessible and understandable for seniors everywhere.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Step-by-Step Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Voice Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Photo Explainer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">24/7 Availability</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Getting Started</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">© 2025 TechStep. Made with ❤️ for seniors everywhere.</p>
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Trusted by</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-400">50,000+ seniors</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;