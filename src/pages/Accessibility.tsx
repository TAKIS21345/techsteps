import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Ear, Hand, Brain, Heart, Settings } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const Accessibility: React.FC = () => {
  const { t } = useTranslation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to making our platform accessible to everyone, regardless of ability or technology.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-blue-600" />
                Our Commitment
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We believe technology should be accessible to everyone. Our platform is designed with seniors in mind, 
                incorporating features that make learning technology easier and more comfortable for users of all abilities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-green-600" />
                Accessibility Features
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Eye className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Visual Accessibility</h3>
                  </div>
                  <ul className="space-y-2 text-blue-800 text-sm">
                    <li>• High contrast color schemes</li>
                    <li>• Large, readable fonts</li>
                    <li>• Screen reader compatibility</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Alternative text for images</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Ear className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Audio Accessibility</h3>
                  </div>
                  <ul className="space-y-2 text-green-800 text-sm">
                    <li>• Closed captions for videos</li>
                    <li>• Audio descriptions</li>
                    <li>• Volume controls</li>
                    <li>• Visual indicators for audio cues</li>
                    <li>• Text alternatives to audio content</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Hand className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-purple-900">Motor Accessibility</h3>
                  </div>
                  <ul className="space-y-2 text-purple-800 text-sm">
                    <li>• Large clickable areas</li>
                    <li>• Keyboard-only navigation</li>
                    <li>• Adjustable time limits</li>
                    <li>• Voice control compatibility</li>
                    <li>• Simplified interactions</li>
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Brain className="w-5 h-5 text-orange-600 mr-2" />
                    <h3 className="font-semibold text-orange-900">Cognitive Accessibility</h3>
                  </div>
                  <ul className="space-y-2 text-orange-800 text-sm">
                    <li>• Simple, clear language</li>
                    <li>• Consistent navigation</li>
                    <li>• Reduced motion options</li>
                    <li>• Clear instructions</li>
                    <li>• Error prevention and recovery</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Standards Compliance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. 
                We regularly test our platform with assistive technologies and conduct accessibility audits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feedback and Support</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We're continuously working to improve accessibility. If you encounter any barriers or have suggestions 
                for improvement, please don't hesitate to contact us.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> taksh.nahata37@gmail.com
                </p>
                <p className="text-gray-700">
                  <strong>Subject:</strong> Accessibility Feedback
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assistive Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform is designed to work with common assistive technologies including:
              </p>
              <ul className="grid md:grid-cols-2 gap-2 text-gray-700">
                <li>• Screen readers (JAWS, NVDA, VoiceOver)</li>
                <li>• Voice recognition software</li>
                <li>• Screen magnification tools</li>
                <li>• Alternative keyboards</li>
                <li>• Switch navigation devices</li>
                <li>• Eye-tracking systems</li>
              </ul>
            </section>

            <section>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-blue-800 mb-4">
                  If you need assistance using our platform or have accessibility-related questions, 
                  we're here to help.
                </p>
                <Link 
                  to="/contact" 
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Link>
              </div>
            </section>

            <section>
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;