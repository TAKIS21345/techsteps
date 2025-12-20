import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const TermsOfService: React.FC = () => {
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
            {t('terms.backToHome')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('terms.title')}</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.sections.acceptance.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.sections.acceptance.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.sections.license.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.sections.license.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.sections.conduct.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.sections.conduct.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.sections.liability.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.sections.liability.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.sections.contact.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('terms.sections.contact.content')}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> taksh.nahata37@gmail.com
                </p>
              </div>
            </section>

            <section>
              <p className="text-sm text-gray-500">
                {t('terms.lastUpdated', { date: new Date().toLocaleDateString() })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;