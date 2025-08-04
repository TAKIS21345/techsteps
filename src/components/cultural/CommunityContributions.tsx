import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCulturalContent } from '../../hooks/useCulturalContent';
import { Plus, Send, Flag, ThumbsUp, ThumbsDown, Eye, CheckCircle, XCircle } from 'lucide-react';

interface CommunityContribution {
  id: string;
  type: 'scenario' | 'example' | 'name' | 'location';
  content: string;
  description: string;
  language: string;
  region: string;
  contributor: string;
  status: 'pending' | 'approved' | 'rejected';
  votes: {
    helpful: number;
    notHelpful: number;
  };
  culturallyAppropriate: boolean;
  ageAppropriate: boolean;
  createdAt: Date;
  moderatorNotes?: string;
}

interface CommunityContributionsProps {
  className?: string;
}

export const CommunityContributions: React.FC<CommunityContributionsProps> = ({
  className = ''
}) => {
  const { t, currentLanguage } = useTranslation();
  const { preferences } = useCulturalContent();
  const [contributions, setContributions] = useState<CommunityContribution[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [newContribution, setNewContribution] = useState({
    type: 'scenario' as const,
    content: '',
    description: '',
    contributor: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('approved');

  // Load contributions from localStorage (in a real app, this would be from a backend)
  useEffect(() => {
    const loadContributions = () => {
      try {
        const stored = localStorage.getItem(`community-contributions-${currentLanguage}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setContributions(parsed.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt)
          })));
        }
      } catch (error) {
        console.error('Failed to load community contributions:', error);
      }
    };

    loadContributions();
  }, [currentLanguage]);

  const saveContributions = (updatedContributions: CommunityContribution[]) => {
    try {
      localStorage.setItem(
        `community-contributions-${currentLanguage}`,
        JSON.stringify(updatedContributions)
      );
      setContributions(updatedContributions);
    } catch (error) {
      console.error('Failed to save community contributions:', error);
    }
  };

  const handleSubmitContribution = async () => {
    if (!newContribution.content.trim() || !newContribution.contributor.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const contribution: CommunityContribution = {
        id: `contrib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: newContribution.type,
        content: newContribution.content.trim(),
        description: newContribution.description.trim(),
        language: currentLanguage,
        region: preferences?.region || 'Global',
        contributor: newContribution.contributor.trim(),
        status: 'pending',
        votes: { helpful: 0, notHelpful: 0 },
        culturallyAppropriate: true, // Would be validated by moderators
        ageAppropriate: true,
        createdAt: new Date()
      };

      const updatedContributions = [...contributions, contribution];
      saveContributions(updatedContributions);

      // Reset form
      setNewContribution({
        type: 'scenario',
        content: '',
        description: '',
        contributor: ''
      });
      setShowSubmissionForm(false);
    } catch (error) {
      console.error('Failed to submit contribution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = (contributionId: string, voteType: 'helpful' | 'notHelpful') => {
    const updatedContributions = contributions.map(contrib => {
      if (contrib.id === contributionId) {
        return {
          ...contrib,
          votes: {
            ...contrib.votes,
            [voteType]: contrib.votes[voteType] + 1
          }
        };
      }
      return contrib;
    });
    saveContributions(updatedContributions);
  };

  const handleReport = (contributionId: string) => {
    // In a real app, this would send a report to moderators
    alert(t('community.reportSubmitted', 'Report submitted for review'));
  };

  const filteredContributions = contributions.filter(contrib => {
    if (filter === 'all') return true;
    return contrib.status === filter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scenario': return '📖';
      case 'example': return '💡';
      case 'name': return '👤';
      case 'location': return '📍';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Plus className="w-6 h-6 text-blue-600 me-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {t('community.contributions', 'Community Contributions')}
          </h2>
        </div>
        <button
          onClick={() => setShowSubmissionForm(!showSubmissionForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 me-2" />
          {t('community.contribute', 'Contribute')}
        </button>
      </div>

      <div className="mb-6 text-sm text-gray-600">
        <p>{t('community.description', 'Help make the platform more culturally relevant by contributing examples, scenarios, and content that reflect your cultural background and experiences.')}</p>
      </div>

      {/* Submission Form */}
      {showSubmissionForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('community.submitContribution', 'Submit a Contribution')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('community.contributionType', 'Contribution Type')}
              </label>
              <select
                value={newContribution.type}
                onChange={(e) => setNewContribution(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scenario">{t('community.scenario', 'Learning Scenario')}</option>
                <option value="example">{t('community.example', 'Cultural Example')}</option>
                <option value="name">{t('community.name', 'Cultural Name')}</option>
                <option value="location">{t('community.location', 'Local Location')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('community.content', 'Content')}
              </label>
              <textarea
                value={newContribution.content}
                onChange={(e) => setNewContribution(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('community.contentPlaceholder', 'Enter your contribution...')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('community.description', 'Description (Optional)')}
              </label>
              <textarea
                value={newContribution.description}
                onChange={(e) => setNewContribution(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('community.descriptionPlaceholder', 'Explain why this is culturally relevant...')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('community.contributor', 'Your Name')}
              </label>
              <input
                type="text"
                value={newContribution.contributor}
                onChange={(e) => setNewContribution(prev => ({ ...prev, contributor: e.target.value }))}
                placeholder={t('community.contributorPlaceholder', 'Enter your name...')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmissionForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSubmitContribution}
                disabled={isSubmitting || !newContribution.content.trim() || !newContribution.contributor.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 me-2" />
                {isSubmitting 
                  ? t('community.submitting', 'Submitting...') 
                  : t('community.submit', 'Submit')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'approved', label: t('community.approved', 'Approved') },
          { key: 'pending', label: t('community.pending', 'Pending') },
          { key: 'all', label: t('community.all', 'All') }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${filter === tab.key 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contributions List */}
      <div className="space-y-4">
        {filteredContributions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t('community.noContributions', 'No contributions found for this filter.')}</p>
          </div>
        ) : (
          filteredContributions.map(contribution => (
            <div key={contribution.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl me-3">{getTypeIcon(contribution.type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 capitalize">
                        {t(`community.${contribution.type}`, contribution.type)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(contribution.status)}`}>
                        {contribution.status === 'approved' && <CheckCircle className="w-3 h-3 inline me-1" />}
                        {contribution.status === 'rejected' && <XCircle className="w-3 h-3 inline me-1" />}
                        {t(`community.${contribution.status}`, contribution.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('community.by', 'By')} {contribution.contributor} • {contribution.region}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-gray-900 mb-2">{contribution.content}</p>
                {contribution.description && (
                  <p className="text-sm text-gray-600">{contribution.description}</p>
                )}
              </div>

              {contribution.moderatorNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                  <p className="text-sm text-yellow-800">
                    <strong>{t('community.moderatorNotes', 'Moderator Notes')}:</strong> {contribution.moderatorNotes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleVote(contribution.id, 'helpful')}
                    className="flex items-center text-sm text-gray-600 hover:text-green-600 focus:outline-none"
                  >
                    <ThumbsUp className="w-4 h-4 me-1" />
                    {contribution.votes.helpful}
                  </button>
                  <button
                    onClick={() => handleVote(contribution.id, 'notHelpful')}
                    className="flex items-center text-sm text-gray-600 hover:text-red-600 focus:outline-none"
                  >
                    <ThumbsDown className="w-4 h-4 me-1" />
                    {contribution.votes.notHelpful}
                  </button>
                </div>
                <button
                  onClick={() => handleReport(contribution.id)}
                  className="flex items-center text-sm text-gray-500 hover:text-red-600 focus:outline-none"
                >
                  <Flag className="w-4 h-4 me-1" />
                  {t('community.report', 'Report')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guidelines */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          {t('community.guidelines', 'Contribution Guidelines')}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {t('community.guideline1', 'Ensure content is culturally appropriate and respectful')}</li>
          <li>• {t('community.guideline2', 'Focus on age-appropriate scenarios for senior learners')}</li>
          <li>• {t('community.guideline3', 'Use clear, simple language that seniors can understand')}</li>
          <li>• {t('community.guideline4', 'Avoid technical jargon or complex terminology')}</li>
          <li>• {t('community.guideline5', 'All contributions are reviewed by moderators before approval')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CommunityContributions;