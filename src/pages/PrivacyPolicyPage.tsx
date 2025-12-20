import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Cookie, Eye, Lock, Users, FileText, Heart } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const currentDate = new Date().toLocaleDateString();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/"
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Logo size="sm" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t('privacyPolicy.headerTitle')}</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <div className="card p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{t('privacyPolicy.pageTitle')}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t('privacyPolicy.lastUpdated', { date: currentDate })}</p>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none"> {/* Adjusted prose size */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                {t('privacyPolicy.ourPromise.title')}
              </h2>
              <p className="text-blue-700 leading-relaxed">
                {t('privacyPolicy.ourPromise.text')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-orange-500" />
                {t('privacyPolicy.cookies.title')}
              </h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-4">
                <h3 className="font-semibold text-orange-800 mb-2">{t('privacyPolicy.cookies.whatAreCookiesTitle')}</h3>
                <p className="text-orange-700 mb-4">
                  {t('privacyPolicy.cookies.whatAreCookiesText')}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('privacyPolicy.cookies.weUseCookiesForTitle')}</h3>
              <ul className="space-y-3 mb-6">
                {(t('privacyPolicy.cookies.uses', { returnObjects: true }) as string[]).map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-red-800 mb-2">{t('privacyPolicy.cookies.whatWeDontDoTitle')}</h3>
                <ul className="space-y-2 text-red-700">
                  {(t('privacyPolicy.cookies.donts', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>❌ {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-blue-500" />
                {t('privacyPolicy.informationCollected.title')}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">{t('privacyPolicy.informationCollected.youGiveUsTitle')}</h3>
                  <ul className="space-y-2 text-gray-700">
                    {(t('privacyPolicy.informationCollected.youGiveUsList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">{t('privacyPolicy.informationCollected.weCollectTitle')}</h3>
                  <ul className="space-y-2 text-gray-700">
                    {(t('privacyPolicy.informationCollected.weCollectList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-green-500" />
                {t('privacyPolicy.howWeProtect.title')}
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <ul className="space-y-3 text-green-800">
                  {(t('privacyPolicy.howWeProtect.protections', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-500" />
                {t('privacyPolicy.sharingInformation.title')}
              </h2>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 mb-3">{t('privacyPolicy.sharingInformation.neverSell')}</h3>
                <p className="text-purple-700 mb-4">
                  {t('privacyPolicy.sharingInformation.onlyShareInSituations')}
                </p>
                <ul className="space-y-2 text-purple-700">
                  {(t('privacyPolicy.sharingInformation.sharingSituations', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-indigo-500" />
                {t('privacyPolicy.yourRights.title')}
              </h2>

              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-800 mb-2">{t('privacyPolicy.yourRights.youCanAlwaysTitle')}</h3>
                  <ul className="space-y-1 text-indigo-700">
                    {(t('privacyPolicy.yourRights.rightsList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">{t('privacyPolicy.yourRights.noteDeletingCookiesTitle')}</h3>
                  <p className="text-yellow-700">
                    {t('privacyPolicy.yourRights.noteDeletingCookiesText')}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('privacyPolicy.thirdPartyServices.title')}</h2>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  {t('privacyPolicy.thirdPartyServices.weUseTrustedServices')}
                </p>
                <ul className="space-y-2 text-gray-700">
                  {(t('privacyPolicy.thirdPartyServices.servicesList', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
                  ))}
                </ul>
                <p className="text-gray-600 text-sm mt-4">
                  {t('privacyPolicy.thirdPartyServices.servicesOwnPolicies')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('privacyPolicy.changesToPolicy.title')}</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-700">
                  {t('privacyPolicy.changesToPolicy.text')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('privacyPolicy.contactUs.title')}</h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-green-700 mb-4">
                  {t('privacyPolicy.contactUs.questions')}
                </p>
                <div className="space-y-2 text-green-700">
                  <p><strong>{t('privacyPolicy.contactUs.email').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.email').split(': ')[1]}</p>
                  <p><strong>{t('privacyPolicy.contactUs.phone').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.phone').split(': ')[1]}</p>
                  <p><strong>{t('privacyPolicy.contactUs.mailLine1').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.mailLine1').split(': ')[1]}<br />
                    {t('privacyPolicy.contactUs.mailLine2')}<br />
                    {t('privacyPolicy.contactUs.mailLine3')}</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">
                {t('privacyPolicy.footer.thankYou')}
              </p>
              <Link to="/" className="btn-primary">
                {t('privacyPolicy.footer.backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;