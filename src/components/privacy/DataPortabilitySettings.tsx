// Data Portability Settings Component - User control interface for data sharing preferences
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Download, 
  Trash2, 
  Shield, 
  Eye, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Database,
  Users,
  Brain
} from 'lucide-react';
import { getDataPortabilityService } from '../../services/security/DataPortabilityService';
import { getPrivacyComplianceService } from '../../services/security/PrivacyComplianceService';
import { useUser } from '../../contexts/UserContext';

interface DataPortabilitySettingsProps {
  onClose?: () => void;
}

interface ExportRequest {
  id: string;
  format: 'json' | 'csv' | 'xml' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: Date;
  completionDate?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

interface DeletionRequest {
  id: string;
  type: 'partial' | 'complete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestDate: Date;
  scheduledDate?: Date;
  completionDate?: Date;
  verified: boolean;
}

interface DataSharingPreferences {
  userId: string;
  dataTypes: Record<string, boolean>;
  thirdPartySharing: Record<string, boolean>;
  analyticsSharing: boolean;
  marketingSharing: boolean;
  researchSharing: boolean;
  lastUpdated: Date;
}

interface AIDataUsage {
  conversationsAnalyzed: number;
  dataPointsUsed: number;
  modelTrainingContribution: string;
  lastProcessed: Date;
}

export const DataPortabilitySettings: React.FC<DataPortabilitySettingsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { userData } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'sharing' | 'export' | 'delete' | 'ai'>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data sharing preferences state
  const [preferences, setPreferences] = useState<DataSharingPreferences | null>(null);
  
  // Export state
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml' | 'pdf'>('json');
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Deletion state
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [deletionVerification, setDeletionVerification] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // AI data usage state
  const [aiUsage, setAiUsage] = useState<AIDataUsage | null>(null);

  const dataPortabilityService = getDataPortabilityService();
  const privacyService = getPrivacyComplianceService();

  useEffect(() => {
    if (userData?.id) {
      loadUserDataRights();
    } else {
      setLoading(false); // Stop loading if no user
    }
  }, [userData?.id]);

  const loadUserDataRights = async () => {
    if (!userData?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load data sharing preferences
      const prefs = await dataPortabilityService.getDataSharingPreferences(userData.id);
      setPreferences(prefs);

      // Load AI data usage dashboard
      const aiDashboard = await dataPortabilityService.getAIDataUsageDashboard(userData.id);
      setAiUsage(aiDashboard.dataUsage);

      // Load existing requests (mock data for now)
      setExportRequests([]);
      setDeletionRequests([]);

    } catch (error) {
      console.error('Failed to load user data rights:', error);
      // Set default preferences on error
      setPreferences({
        userId: userData.id,
        dataTypes: {
          profile: true,
          learning_progress: true,
          ai_conversations: false,
          usage_analytics: true
        },
        thirdPartySharing: {
          gemini: false,
          analytics_provider: true,
          support_system: true
        },
        analyticsSharing: true,
        marketingSharing: false,
        researchSharing: false,
        lastUpdated: new Date()
      });
      
      setAiUsage({
        conversationsAnalyzed: 0,
        dataPointsUsed: 0,
        modelTrainingContribution: 'none',
        lastProcessed: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (category: string, subcategory: string, value: boolean) => {
    if (!preferences || !userData?.id) return;

    setSaving(true);
    try {
      const updatedPreferences = { ...preferences };
      
      if (category === 'dataTypes') {
        updatedPreferences.dataTypes[subcategory] = value;
      } else if (category === 'thirdPartySharing') {
        updatedPreferences.thirdPartySharing[subcategory] = value;
      } else {
        (updatedPreferences as any)[category] = value;
      }

      await dataPortabilityService.updateDataSharingPreferences(userData.id, updatedPreferences);
      setPreferences(updatedPreferences);
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = async () => {
    if (!userData?.id) return;

    setIsExporting(true);
    try {
      const exportRequest = await dataPortabilityService.createExportRequest(userData.id, exportFormat);
      
      const newRequest: ExportRequest = {
        id: exportRequest.id,
        format: exportFormat,
        status: exportRequest.status as any,
        requestDate: exportRequest.requestDate,
        completionDate: exportRequest.completionDate,
        downloadUrl: exportRequest.downloadUrl,
        expiresAt: exportRequest.expiresAt
      };
      
      setExportRequests(prev => [newRequest, ...prev]);
      
    } catch (error) {
      console.error('Failed to create export request:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!userData?.id || !showDeletionConfirm) {
      setShowDeletionConfirm(true);
      return;
    }

    if (deletionVerification !== 'DELETE MY DATA') {
      return;
    }

    setIsDeleting(true);
    try {
      const deletionRequest = await dataPortabilityService.createDeletionRequest(
        userData.id,
        'complete',
        undefined,
        'User requested complete data deletion'
      );
      
      const newRequest: DeletionRequest = {
        id: deletionRequest.id,
        type: deletionRequest.type,
        status: deletionRequest.status as any,
        requestDate: deletionRequest.requestDate,
        scheduledDate: deletionRequest.scheduledDate,
        completionDate: deletionRequest.completionDate,
        verified: deletionRequest.verification.verified
      };
      
      setDeletionRequests(prev => [newRequest, ...prev]);
      setShowDeletionConfirm(false);
      setDeletionVerification('');
      
    } catch (error) {
      console.error('Failed to create deletion request:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-blue-900">
            {t('dataPortability.overview.title', 'Your Data Rights')}
          </h3>
        </div>
        <p className="text-blue-800 mb-4">
          {t('dataPortability.overview.description', 'You have complete control over your personal data. You can view, export, correct, or delete your information at any time within 30 days.')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              {t('dataPortability.overview.dataWeCollect', 'Data We Collect')}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('dataPortability.overview.profileInfo', 'Profile information (name, email, preferences)')}</li>
              <li>• {t('dataPortability.overview.learningProgress', 'Learning progress and achievements')}</li>
              <li>• {t('dataPortability.overview.aiHistory', 'AI conversation history')}</li>
              <li>• {t('dataPortability.overview.analytics', 'Usage analytics (anonymized)')}</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              {t('dataPortability.overview.howWeUse', 'How We Use Your Data')}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('dataPortability.overview.personalized', 'Provide personalized learning experience')}</li>
              <li>• {t('dataPortability.overview.improveAI', 'Improve AI assistant responses')}</li>
              <li>• {t('dataPortability.overview.trackProgress', 'Track your progress and achievements')}</li>
              <li>• {t('dataPortability.overview.security', 'Ensure platform security and performance')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-4">
          {t('dataPortability.overview.rightsTitle', 'Your Rights Under GDPR & CCPA')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div className="flex items-start space-x-2">
            <Eye className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>{t('dataPortability.overview.rightAccess', 'Right to Access:')}</strong>
              <span className="ml-1">{t('dataPortability.overview.accessDesc', 'View all your personal data')}</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Download className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>{t('dataPortability.overview.rightPortability', 'Right to Portability:')}</strong>
              <span className="ml-1">{t('dataPortability.overview.portabilityDesc', 'Export your data')}</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Settings className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>{t('dataPortability.overview.rightRectification', 'Right to Rectification:')}</strong>
              <span className="ml-1">{t('dataPortability.overview.rectificationDesc', 'Correct inaccurate data')}</span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Trash2 className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <strong>{t('dataPortability.overview.rightErasure', 'Right to Erasure:')}</strong>
              <span className="ml-1">{t('dataPortability.overview.erasureDesc', 'Delete your personal data')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSharingTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="h-6 w-6 text-yellow-600" />
          <h3 className="text-xl font-semibold text-yellow-900">
            {t('dataPortability.sharing.title', 'Data Sharing Preferences')}
          </h3>
        </div>
        <p className="text-yellow-800">
          {t('dataPortability.sharing.description', 'Control how your data is shared and used. All sharing is optional and can be changed at any time.')}
        </p>
      </div>

      {preferences && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-gray-600" />
              {t('dataPortability.sharing.dataTypes', 'Data Type Sharing')}
            </h4>
            <div className="space-y-4">
              {Object.entries(preferences.dataTypes).map(([dataType, allowed]) => (
                <div key={dataType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {t(`dataPortability.sharing.dataType.${dataType}`, dataType.replace('_', ' '))}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDataTypeDescription(dataType)}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={(e) => handlePreferenceChange('dataTypes', dataType, e.target.checked)}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-gray-600" />
              {t('dataPortability.sharing.thirdParty', 'Third-Party Sharing')}
            </h4>
            <div className="space-y-4">
              {Object.entries(preferences.thirdPartySharing).map(([provider, allowed]) => (
                <div key={provider} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {t(`dataPortability.sharing.provider.${provider}`, provider.replace('_', ' '))}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {getProviderDescription(provider)}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={(e) => handlePreferenceChange('thirdPartySharing', provider, e.target.checked)}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              {t('dataPortability.sharing.special', 'Special Categories')}
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t('dataPortability.sharing.analytics', 'Analytics Sharing')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dataPortability.sharing.analyticsDesc', 'Share anonymized usage data to improve the platform')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analyticsSharing}
                    onChange={(e) => handlePreferenceChange('analyticsSharing', '', e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t('dataPortability.sharing.research', 'Research Sharing')}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dataPortability.sharing.researchDesc', 'Contribute anonymized data to senior learning research')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.researchSharing}
                    onChange={(e) => handlePreferenceChange('researchSharing', '', e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Download className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-blue-900">
            {t('dataPortability.export.title', 'Export Your Data')}
          </h3>
        </div>
        <p className="text-blue-800">
          {t('dataPortability.export.description', 'Download a copy of all your personal data. We\'ll prepare your data and send you a download link within 30 days.')}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {t('dataPortability.export.chooseFormat', 'Choose Export Format')}
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['json', 'csv', 'xml', 'pdf'] as const).map((format) => (
            <label key={format} className="cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value={format}
                checked={exportFormat === format}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="sr-only peer"
              />
              <div className="border-2 border-gray-200 rounded-lg p-4 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:bg-gray-50 transition-colors">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="font-medium text-gray-900 uppercase">{format}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getFormatDescription(format)}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-gray-900 mb-2">
            {t('dataPortability.export.included', 'What\'s Included:')}
          </h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t('dataPortability.export.profile', 'Profile information and preferences')}</li>
            <li>• {t('dataPortability.export.progress', 'Learning progress and achievements')}</li>
            <li>• {t('dataPortability.export.conversations', 'AI conversation history')}</li>
            <li>• {t('dataPortability.export.support', 'Support ticket history')}</li>
            <li>• {t('dataPortability.export.consent', 'Consent and privacy settings')}</li>
          </ul>
        </div>

        <button
          onClick={handleDataExport}
          disabled={isExporting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('dataPortability.export.requesting', 'Requesting Export...')}
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {t('dataPortability.export.request', 'Request Data Export')}
            </>
          )}
        </button>
      </div>

      {exportRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {t('dataPortability.export.requests', 'Export Requests')}
          </h4>
          <div className="space-y-3">
            {exportRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    request.status === 'completed' ? 'bg-green-100 text-green-600' :
                    request.status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                    request.status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {request.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                     request.status === 'processing' ? <Clock className="h-4 w-4" /> :
                     request.status === 'failed' ? <AlertTriangle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.format.toUpperCase()} Export
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('dataPortability.export.requested', 'Requested')}: {request.requestDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  {request.status === 'completed' && request.downloadUrl ? (
                    <a
                      href={request.downloadUrl}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t('dataPortability.export.download', 'Download')}
                    </a>
                  ) : (
                    <span className="text-gray-500 capitalize">{request.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDeleteTab = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h3 className="text-xl font-semibold text-red-900">
            {t('dataPortability.delete.title', 'Delete Your Data')}
          </h3>
        </div>
        <p className="text-red-800">
          {t('dataPortability.delete.description', 'Permanently delete all your personal data. This action cannot be undone and will close your account within 30 days.')}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {t('dataPortability.delete.whatDeleted', 'What Will Be Deleted:')}
        </h4>
        
        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          <li>• {t('dataPortability.delete.profile', 'Your profile and account information')}</li>
          <li>• {t('dataPortability.delete.progress', 'All learning progress and achievements')}</li>
          <li>• {t('dataPortability.delete.conversations', 'AI conversation history')}</li>
          <li>• {t('dataPortability.delete.preferences', 'Preferences and settings')}</li>
          <li>• {t('dataPortability.delete.analytics', 'Usage analytics linked to your account')}</li>
        </ul>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-yellow-900 mb-2">
            {t('dataPortability.delete.important', 'Important Notes:')}
          </h5>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• {t('dataPortability.delete.legal', 'Some data may be retained for legal compliance (support tickets, billing records)')}</li>
            <li>• {t('dataPortability.delete.research', 'Anonymized data used for research may be retained')}</li>
            <li>• {t('dataPortability.delete.verification', 'You will receive email verification before deletion')}</li>
            <li>• {t('dataPortability.delete.timeframe', 'Deletion will be completed within 30 days')}</li>
          </ul>
        </div>

        {!showDeletionConfirm ? (
          <button
            onClick={() => setShowDeletionConfirm(true)}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('dataPortability.delete.request', 'Request Data Deletion')}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium mb-2">
                {t('dataPortability.delete.confirm', 'Are you sure you want to delete all your data?')}
              </p>
              <p className="text-red-700 text-xs">
                {t('dataPortability.delete.type', 'Type "DELETE MY DATA" to confirm this action:')}
              </p>
            </div>
            
            <input
              type="text"
              value={deletionVerification}
              onChange={(e) => setDeletionVerification(e.target.value)}
              placeholder={t('dataPortability.delete.placeholder', 'Type DELETE MY DATA')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleDataDeletion}
                disabled={deletionVerification !== 'DELETE MY DATA' || isDeleting}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('dataPortability.delete.processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('dataPortability.delete.confirmButton', 'Confirm Deletion')}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeletionConfirm(false);
                  setDeletionVerification('');
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
              >
                {t('dataPortability.delete.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {deletionRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {t('dataPortability.delete.requests', 'Deletion Requests')}
          </h4>
          <div className="space-y-3">
            {deletionRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    request.status === 'completed' ? 'bg-green-100 text-green-600' :
                    request.status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                    request.status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {request.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                     request.status === 'processing' ? <Clock className="h-4 w-4" /> :
                     request.status === 'failed' ? <AlertTriangle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {t('dataPortability.delete.complete', 'Complete Data Deletion')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('dataPortability.delete.requested', 'Requested')}: {request.requestDate.toLocaleDateString()}
                      {request.scheduledDate && (
                        <span className="ml-2">
                          • {t('dataPortability.delete.scheduled', 'Scheduled')}: {request.scheduledDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className={`capitalize ${
                    request.status === 'completed' ? 'text-green-600' :
                    request.status === 'processing' ? 'text-yellow-600' :
                    request.status === 'failed' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {request.status}
                  </span>
                  {!request.verified && request.status === 'pending' && (
                    <span className="ml-2 text-xs text-orange-600">
                      {t('dataPortability.delete.awaitingVerification', 'Awaiting verification')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-purple-900">
            {t('dataPortability.ai.title', 'AI Data Usage Transparency')}
          </h3>
        </div>
        <p className="text-purple-800">
          {t('dataPortability.ai.description', 'See exactly how your data is used by our AI assistant and control your AI data preferences.')}
        </p>
      </div>

      {aiUsage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-gray-600" />
              {t('dataPortability.ai.stats', 'AI Data Usage Stats')}
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{t('dataPortability.ai.conversationsAnalyzed', 'Conversations Analyzed:')}</span>
                <span className="font-medium text-gray-900">{aiUsage.conversationsAnalyzed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{t('dataPortability.ai.dataPoints', 'Data Points Used:')}</span>
                <span className="font-medium text-gray-900">{aiUsage.dataPointsUsed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{t('dataPortability.ai.trainingContribution', 'Training Contribution:')}</span>
                <span className="font-medium text-gray-900 capitalize">{aiUsage.modelTrainingContribution}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{t('dataPortability.ai.lastProcessed', 'Last Processed:')}</span>
                <span className="font-medium text-gray-900">{aiUsage.lastProcessed.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              {t('dataPortability.ai.optOut', 'AI Opt-Out Options')}
            </h4>
            <div className="space-y-3">
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">
                  {t('dataPortability.ai.stopTraining', 'Stop AI Training')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('dataPortability.ai.stopTrainingDesc', 'Prevent your data from improving AI responses')}
                </div>
              </button>
              
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">
                  {t('dataPortability.ai.deleteHistory', 'Delete Conversation History')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('dataPortability.ai.deleteHistoryDesc', 'Remove all stored AI conversations')}
                </div>
              </button>
              
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">
                  {t('dataPortability.ai.anonymize', 'Anonymize My Data')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('dataPortability.ai.anonymizeDesc', 'Convert data to anonymous form')}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('dataPortability.title', 'Data Portability & User Rights')}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: t('dataPortability.tabs.overview', 'Overview'), icon: Shield },
            { id: 'sharing', label: t('dataPortability.tabs.sharing', 'Data Sharing'), icon: Users },
            { id: 'export', label: t('dataPortability.tabs.export', 'Export Data'), icon: Download },
            { id: 'delete', label: t('dataPortability.tabs.delete', 'Delete Data'), icon: Trash2 },
            { id: 'ai', label: t('dataPortability.tabs.ai', 'AI Transparency'), icon: Brain }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'sharing' && renderSharingTab()}
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'delete' && renderDeleteTab()}
        {activeTab === 'ai' && renderAITab()}
      </div>
    </div>
  );
};

// Helper functions
const getDataTypeDescription = (dataType: string): string => {
  const descriptions: Record<string, string> = {
    profile: 'Basic profile information like name and email',
    learning_progress: 'Your learning achievements and progress data',
    ai_conversations: 'Chat history with the AI assistant',
    usage_analytics: 'How you use the platform (anonymized)'
  };
  return descriptions[dataType] || 'Data sharing for this category';
};

const getProviderDescription = (provider: string): string => {
  const descriptions: Record<string, string> = {
    gemini: 'Google Gemini AI service provider for chat assistance',
    analytics_provider: 'Service for platform usage analytics',
    support_system: 'Customer support and help desk system'
  };
  return descriptions[provider] || 'Third-party service provider';
};

const getFormatDescription = (format: string): string => {
  const descriptions: Record<string, string> = {
    json: 'Machine readable',
    csv: 'Spreadsheet format',
    xml: 'Structured data',
    pdf: 'Human readable'
  };
  return descriptions[format] || 'Data format';
};

export default DataPortabilitySettings;