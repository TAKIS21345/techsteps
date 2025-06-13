import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Cookie, Eye, Lock, Users, FileText } from 'lucide-react';
import Logo from '../components/Logo';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Logo size="sm" />
              <h1 className="text-xl font-semibold text-gray-800">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose max-w-none">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Our Promise to You
              </h2>
              <p className="text-blue-700 leading-relaxed">
                At Senior Tech Helper, we understand that your privacy is precious. We're committed to protecting your personal information and being completely transparent about how we use it. This policy explains everything in simple, clear language.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-orange-500" />
                How We Use Cookies
              </h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
                <h3 className="font-semibold text-orange-800 mb-2">What are cookies?</h3>
                <p className="text-orange-700 mb-4">
                  Cookies are small text files that help us remember your preferences and make your experience better. Think of them like bookmarks that help us remember where you left off.
                </p>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">We use cookies ONLY to help you:</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Remember your preferences:</strong> Text size, voice settings, and accessibility options you've chosen
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Keep you signed in:</strong> So you don't have to enter your password every time
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Improve our help:</strong> Understanding which features are most helpful to seniors like you
                  </div>
                </li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-red-800 mb-2">What we DON'T do with cookies:</h3>
                <ul className="space-y-2 text-red-700">
                  <li>❌ Track you across other websites</li>
                  <li>❌ Sell your information to anyone</li>
                  <li>❌ Share your data with advertisers</li>
                  <li>❌ Use them for marketing purposes</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-blue-500" />
                What Information We Collect
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Information you give us:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Your name and email address</li>
                    <li>• Your device type (iPhone, Windows, etc.)</li>
                    <li>• Your tech experience level</li>
                    <li>• Your accessibility preferences</li>
                    <li>• Questions you ask our AI helper</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Information we automatically collect:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• How you use our app (which features help most)</li>
                    <li>• Technical information (browser type, device)</li>
                    <li>• Error reports (to fix problems quickly)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-green-500" />
                How We Protect Your Information
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <ul className="space-y-3 text-green-800">
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>Encryption:</strong> All your data is encrypted (scrambled) so only we can read it</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>Secure servers:</strong> Your information is stored on protected, professional-grade servers</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>Limited access:</strong> Only our essential team members can access your data</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span><strong>Regular security checks:</strong> We constantly monitor for any security threats</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-500" />
                Sharing Your Information
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 mb-3">We will NEVER sell or rent your personal information.</h3>
                <p className="text-purple-700 mb-4">
                  We only share your information in these very limited situations:
                </p>
                <ul className="space-y-2 text-purple-700">
                  <li>• <strong>With your permission:</strong> If you specifically ask us to share something</li>
                  <li>• <strong>For technical support:</strong> With trusted service providers who help us run the app (they're bound by strict privacy agreements)</li>
                  <li>• <strong>If required by law:</strong> Only if we're legally required to do so</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-indigo-500" />
                Your Rights and Choices
              </h2>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-800 mb-2">You can always:</h3>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• See what information we have about you</li>
                    <li>• Ask us to correct any wrong information</li>
                    <li>• Request that we delete your account and data</li>
                    <li>• Turn off cookies in your browser settings</li>
                    <li>• Contact us with any privacy questions</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Note about deleting cookies:</h3>
                  <p className="text-yellow-700">
                    If you delete our cookies, you'll need to set up your preferences again, and some features might not work as well.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Third-Party Services</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We use some trusted third-party services to help provide our features:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Google AI (Gemini):</strong> Powers our AI assistant that answers your questions</li>
                  <li>• <strong>Firebase:</strong> Securely stores your account information</li>
                  <li>• <strong>YouTube/Educational Sites:</strong> We may recommend helpful videos and articles</li>
                </ul>
                <p className="text-gray-600 text-sm mt-4">
                  These services have their own privacy policies, and we only share the minimum information needed for them to work.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-700">
                  If we need to update this privacy policy, we'll notify you by email and show a notice in the app. 
                  We'll always explain what's changing and why in simple, clear language.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-green-700 mb-4">
                  Have questions about your privacy or this policy? The TechStep team is here to help!
                </p>
                <div className="space-y-2 text-green-700">
                  <p><strong>Email:</strong> privacy@techstep.com</p>
                  <p><strong>Phone:</strong> 1-800-TECH-HELP (1-800-832-4435)</p>
                  <p><strong>Mail:</strong> TechStep Privacy Team<br />
                     123 Tech Support Lane<br />
                     Helpful City, HC 12345</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">
                Thank you for trusting TechStep with your information. 
                We're committed to keeping it safe and using it only to help you succeed with technology.
              </p>
              <Link to="/" className="btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;