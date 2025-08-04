// Privacy Dashboard Component - User control interface for data sharing preferences
import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, Settings, AlertTriangle } from 'lucide-react';
import { getDataPortabilityService } from '../../services/security/DataPortabilityService';
import { getPrivacyComplianceService } from '../../services/security/PrivacyComplianceService';

interface PrivacyDashboardProps {
  userId: string;
  onClose?: () => void;
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

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ userId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sharing' | 'export' | 'delete' | 'ai'>('overview');
  const [preferences, setPreferences] = useState<DataSharingPreferences | null>(null);
  const [aiUsage, setAiUsage] = useState<AIDataUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xml' | 'pdf'>('json');
  const [deletionVerification, setDeletionVerification] = useState('');
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);

  const dataPortabilityService = getDataPortabilityService();
  const privacyService = getPrivacyComplianceService();

  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      
      // Load data sharing preferences
      const prefs = await dataPortabilityService.getDataSharingPreferences(userId);
      setPreferences(prefs);

      // Load AI data usage dashboard
      const aiDashboard = await dataPortabilityService.getAIDataUsageDashboard(userId);
      setAiUsage(aiDashboard.dataUsage);

    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (category: string, subcategory: string, value: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    
    if (category === 'dataTypes') {
      updatedPreferences.dataTypes[subcategory] = value;
    } else if (category === 'thirdPartySharing') {
      updatedPreferences.thirdPartySharing[subcategory] = value;
    } else {
      (updatedPreferences as any)[category] = value;
    }

    try {
      await dataPortabilityService.updateDataSharingPreferences(userId, updatedPreferences);
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const handleDataExport = async () => {
    try {
      const exportRequest = await dataPortabilityService.createExportRequest(userId, exportFormat);
      alert(`Export request created. Request ID: ${exportRequest.id}. You will be notified when your data is ready for download.`);
    } catch (error) {
      console.error('Failed to create export request:', error);
      alert('Failed to create export request. Please try again.');
    }
  };

  const handleDataDeletion = async () => {
    if (!showDeletionConfirm) {
      setShowDeletionConfirm(true);
      return;
    }

    try {
      const deletionRequest = await dataPortabilityService.createDeletionRequest(
        userId,
        'complete',
        undefined,
        'User requested complete data deletion'
      );
      
      alert(`Deletion request created. Request ID: ${deletionRequest.id}. Please check your email for verification instructions.`);
      setShowDeletionConfirm(false);
    } catch (error) {
      console.error('Failed to create deletion request:', error);
      alert('Failed to create deletion request. Please try again.');
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Your Privacy Rights</h3>
        </div>
        <p className="text-blue-800 text-sm">
          You have full control over your personal data. You can view, export, correct, or delete your information at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Data We Collect</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Profile information (name, email, preferences)</li>
            <li>• Learning progress and achievements</li>
            <li>• AI conversation history</li>
            <li>• Usage analytics (anonymized)</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">How We Use Your Data</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Provide personalized learning experience</li>
            <li>• Improve AI assistant responses</li>
            <li>• Track your progress and achievements</li>
            <li>• Ensure platform security and performance</li>
          </ul>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Your Rights Under GDPR & CCPA</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
          <div>
            <strong>Right to Access:</strong> View all your personal data
          </div>
          <div>
            <strong>Right to Portability:</strong> Export your data
          </div>
          <div>
            <strong>Right to Rectification:</strong> Correct inaccurate data
          </div>
          <div>
            <strong>Right to Erasure:</strong> Delete your personal data
          </div>
        </div>
      </div>
    </div>
  );

  const renderSharingTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Settings className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">Data Sharing Preferences</h3>
        </div>
        <p className="text-yellow-800 text-sm">
          Control how your data is shared and used. All sharing is optional and can be changed at any time.
        </p>
      </div>

      {preferences && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Data Type Sharing</h4>
            <div className="space-y-3">
              {Object.entries(preferences.dataTypes).map(([dataType, allowed]) => (
                <div key={dataType} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {dataType.replace('_', ' ')}
                    </label>
                    <p className="text-xs text-gray-500">
                      {getDataTypeDescription(dataType)}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={(e) => handlePreferenceChange('dataTypes', dataType, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Third-Party Sharing</h4>
            <div className="space-y-3">
              {Object.entries(preferences.thirdPartySharing).map(([provider, allowed]) => (
                <div key={provider} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {provider.replace('_', ' ')}
                    </label>
                    <p className="text-xs text-gray-500">
                      {getProviderDescription(provider)}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowed}
                      onChange={(e) => handlePreferenceChange('thirdPartySharing', provider, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Special Categories</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Analytics Sharing</label>
                  <p className="text-xs text-gray-500">Share anonymized usage data to improve the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analyticsSharing}
                    onChange={(e) => handlePreferenceChange('analyticsSharing', '', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Research Sharing</label>
                  <p className="text-xs text-gray-500">Contribute anonymized data to senior learning research</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.researchSharing}
                    onChange={(e) => handlePreferenceChange('researchSharing', '', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Download className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Export Your Data</h3>
        </div>
        <p className="text-blue-800 text-sm">
          Download a copy of all your personal data. We'll prepare your data and send you a download link within 30 days.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Choose Export Format</h4>
        
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
              <div className="border-2 border-gray-200 rounded-lg p-4 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50">
                <div className="font-medium text-gray-900 uppercase">{format}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getFormatDescription(format)}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-gray-900 mb-2">What's Included:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Profile information and preferences</li>
            <li>• Learning progress and achievements</li>
            <li>• AI conversation history</li>
            <li>• Support ticket history</li>
            <li>• Consent and privacy settings</li>
          </ul>
        </div>

        <button
          onClick={handleDataExport}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Request Data Export
        </button>
      </div>
    </div>
  );

  const renderDeleteTab = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Delete Your Data</h3>
        </div>
        <p className="text-red-800 text-sm">
          Permanently delete all your personal data. This action cannot be undone and will close your account.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">What Will Be Deleted:</h4>
        
        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          <li>• Your profile and account information</li>
          <li>• All learning progress and achievements</li>
          <li>• AI conversation history</li>
          <li>• Preferences and settings</li>
          <li>• Usage analytics linked to your account</li>
        </ul>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-yellow-900 mb-2">Important Notes:</h5>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Some data may be retained for legal compliance (support tickets, billing records)</li>
            <li>• Anonymized data used for research may be retained</li>
            <li>• You will receive email verification before deletion</li>
            <li>• Deletion will be completed within 30 days</li>
          </ul>
        </div>

        {!showDeletionConfirm ? (
          <button
            onClick={() => setShowDeletionConfirm(true)}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Request Data Deletion
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium mb-2">
                Are you sure you want to delete all your data?
              </p>
              <p className="text-red-700 text-xs">
                Type "DELETE MY DATA" to confirm this action:
              </p>
            </div>
            
            <input
              type="text"
              value={deletionVerification}
              onChange={(e) => setDeletionVerification(e.target.value)}
              placeholder="Type DELETE MY DATA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleDataDeletion}
                disabled={deletionVerification !== 'DELETE MY DATA'}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm Deletion
              </button>
              <button
                onClick={() => {
                  setShowDeletionConfirm(false);
                  setDeletionVerification('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Eye className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">AI Data Usage Transparency</h3>
        </div>
        <p className="text-purple-800 text-sm">
          See exactly how your data is used by our AI assistant and control your AI data preferences.
        </p>
      </div>

      {aiUsage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">AI Data Usage Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Conversations Analyzed:</span>
                <span className="font-medium">{aiUsage.conversationsAnalyzed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Points Used:</span>
                <span className="font-medium">{aiUsage.dataPointsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Training Contribution:</span>
                <span className="font-medium capitalize">{aiUsage.modelTrainingContribution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Processed:</span>
                <span className="font-medium">{aiUsage.lastProcessed.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">AI Opt-Out Options</h4>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Stop AI Training</div>
                <div className="text-xs text-gray-500">Prevent your data from improving AI responses</div>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Delete Conversation History</div>
                <div className="text-xs text-gray-500">Remove all stored AI conversations</div>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Anonymize My Data</div>
                <div className="text-xs text-gray-500">Convert data to anonymous form</div>
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-bold text-gray-900">Privacy Dashboard</h2>
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
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'sharing', label: 'Data Sharing', icon: Settings },
            { id: 'export', label: 'Export Data', icon: Download },
            { id: 'delete', label: 'Delete Data', icon: Trash2 },
            { id: 'ai', label: 'AI Transparency', icon: Eye }
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