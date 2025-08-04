import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { translationValidationService, TranslationValidationResult } from '../../services/translationValidation';
import { SUPPORTED_LANGUAGES } from '../../i18n';

interface TranslationCoverageCheckerProps {
    className?: string;
}

export const TranslationCoverageChecker: React.FC<TranslationCoverageCheckerProps> = ({
    className = ''
}) => {
    const { t } = useTranslation();
    const [validationResults, setValidationResults] = useState<TranslationValidationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

    const runValidation = async () => {
        setIsLoading(true);
        try {
            const results = await translationValidationService.validateAllLanguages();
            setValidationResults(results);

            const summaryData = await translationValidationService.getTranslationSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to validate translations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateSingleLanguage = async (language: string) => {
        setIsLoading(true);
        try {
            const result = await translationValidationService.validateLanguage(language);
            setValidationResults(prev => {
                const filtered = prev.filter(r => r.language !== language);
                return [...filtered, result].sort((a, b) => a.language.localeCompare(b.language));
            });
        } catch (error) {
            console.error(`Failed to validate ${language}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runValidation();
    }, []);

    const getCoverageColor = (coverage: number) => {
        if (coverage >= 100) return 'text-green-600 bg-green-50';
        if (coverage >= 95) return 'text-yellow-600 bg-yellow-50';
        if (coverage >= 80) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const getCoverageBadge = (coverage: number) => {
        if (coverage >= 100) return 'Complete';
        if (coverage >= 95) return 'Good';
        if (coverage >= 80) return 'Needs Work';
        return 'Critical';
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {t('admin.translationCoverage', 'Translation Coverage')}
                </h2>
                <button
                    onClick={runValidation}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isLoading ? t('admin.validating', 'Validating...') : t('admin.runValidation', 'Run Validation')}
                </button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{summary.totalLanguages}</div>
                        <div className="text-sm text-blue-800">{t('admin.totalLanguages', 'Total Languages')}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{summary.completeLanguages}</div>
                        <div className="text-sm text-green-800">{t('admin.completeLanguages', 'Complete Languages')}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{summary.averageCoverage.toFixed(1)}%</div>
                        <div className="text-sm text-yellow-800">{t('admin.averageCoverage', 'Average Coverage')}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{summary.languagesNeedingAttention.length}</div>
                        <div className="text-sm text-red-800">{t('admin.needingAttention', 'Need Attention')}</div>
                    </div>
                </div>
            )}

            {/* Language Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.validateSpecificLanguage', 'Validate Specific Language')}
                </label>
                <div className="flex gap-2">
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">{t('admin.selectLanguage', 'Select a language...')}</option>
                        {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                            <option key={code} value={code}>
                                {info.nativeName} ({info.name})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => selectedLanguage && validateSingleLanguage(selectedLanguage)}
                        disabled={!selectedLanguage || isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {t('admin.validate', 'Validate')}
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.language', 'Language')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.coverage', 'Coverage')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.status', 'Status')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.missingKeys', 'Missing Keys')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.emptyValues', 'Empty Values')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('admin.actions', 'Actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {validationResults.map((result) => {
                            const langInfo = SUPPORTED_LANGUAGES[result.language as keyof typeof SUPPORTED_LANGUAGES];
                            return (
                                <tr key={result.language} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`
                        w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium mr-3
                        ${langInfo?.rtl ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}
                      `}>
                                                {result.language.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {langInfo?.nativeName || result.language}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {langInfo?.name || result.language}
                                                    {langInfo?.rtl && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">RTL</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className={`h-2 rounded-full ${result.coverage >= 100 ? 'bg-green-500' :
                                                        result.coverage >= 95 ? 'bg-yellow-500' :
                                                            result.coverage >= 80 ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${result.coverage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {result.coverage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCoverageColor(result.coverage)}`}>
                                            {getCoverageBadge(result.coverage)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {result.missingKeys.length}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {result.emptyValues.length}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => validateSingleLanguage(result.language)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            {t('admin.revalidate', 'Revalidate')}
                                        </button>
                                        {(result.missingKeys.length > 0 || result.emptyValues.length > 0) && (
                                            <button
                                                onClick={() => {
                                                    console.log('Missing keys:', result.missingKeys);
                                                    console.log('Empty values:', result.emptyValues);
                                                }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                {t('admin.viewIssues', 'View Issues')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {validationResults.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                    {t('admin.noResults', 'No validation results available. Click "Run Validation" to start.')}
                </div>
            )}
        </div>
    );
};

export default TranslationCoverageChecker;