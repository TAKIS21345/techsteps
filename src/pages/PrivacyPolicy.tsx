import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const PrivacyPolicy: React.FC = () => {
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                    <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                We collect information you provide directly to us, such as when you create an account,
                                use our services, or contact us for support.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                We use the information we collect to provide, maintain, and improve our services,
                                communicate with you, and ensure the security of our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                We do not sell, trade, or otherwise transfer your personal information to third parties
                                without your consent, except as described in this policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                We implement appropriate security measures to protect your personal information
                                against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                If you have any questions about this Privacy Policy, please contact us at:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700">
                                    <strong>Email:</strong> taksh.nahata37@gmail.com
                                </p>
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

export default PrivacyPolicy;