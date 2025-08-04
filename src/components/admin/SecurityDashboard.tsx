import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Target,
  BookOpen
} from 'lucide-react';
import { getSecurityMonitoringService } from '../../services/security/SecurityMonitoringService';
import { getIncidentResponseService } from '../../services/security/IncidentResponseService';
import { getPenetrationTestingService } from '../../services/security/PenetrationTestingService';
import { getSecurityTrainingService } from '../../services/security/SecurityTrainingService';

interface SecurityDashboardProps {
  className?: string;
}

interface DashboardData {
  monitoring: any;
  incidents: any;
  penTesting: any;
  training: any;
  loading: boolean;
  error: string | null;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className = '' }) => {
  const [data, setData] = useState<DashboardData>({
    monitoring: null,
    incidents: null,
    penTesting: null,
    training: null,
    loading: true,
    error: null
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'incidents' | 'pentesting' | 'training'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const [monitoring, incidents, penTesting, training] = await Promise.all([
        getSecurityMonitoringService().getSecurityDashboard(),
        getIncidentResponseService().getResponseMetrics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          new Date()
        ),
        getPenetrationTestingService().getPenTestDashboard(),
        getSecurityTrainingService().getTeamTrainingDashboard()
      ]);
      
      setData({
        monitoring,
        incidents,
        penTesting,
        training,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load security dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Threat Level</p>
              <p className={`text-2xl font-bold ${getThreatLevelColor(data.monitoring?.threatLevel).split(' ')[0]}`}>
                {data.monitoring?.threatLevel?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
            <Shield className={`h-8 w-8 ${getThreatLevelColor(data.monitoring?.threatLevel).split(' ')[0]}`} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.monitoring?.overview?.activeAlerts || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Incidents</p>
              <p className="text-2xl font-bold text-red-600">
                {data.monitoring?.overview?.openIncidents || 0}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Compliance</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((data.training?.overview?.fullyCompliant / data.training?.overview?.totalTeamMembers) * 100) || 0}%
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Security Events
          </h3>
          <div className="space-y-3">
            {data.monitoring?.recentEvents?.slice(0, 5).map((event: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'high' ? 'bg-orange-500' :
                    event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.type}</p>
                    <p className="text-xs text-gray-500">{event.source}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No recent events</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Recent Penetration Tests
          </h3>
          <div className="space-y-3">
            {data.penTesting?.recentTests?.slice(0, 5).map((test: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    test.summary.criticalFindings > 0 ? 'bg-red-500' :
                    test.summary.highFindings > 0 ? 'bg-orange-500' :
                    test.summary.mediumFindings > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{test.suiteName}</p>
                    <p className="text-xs text-gray-500">
                      {test.findings.length} findings
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(test.startTime).toLocaleDateString()}
                </span>
              </div>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No recent tests</p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          System Health Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-800">Monitoring Service</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-800">Incident Response</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-800">Security Training</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Monitoring Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.monitoring?.overview?.totalEvents || 0}</p>
            <p className="text-sm text-blue-800">Total Events</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{data.monitoring?.overview?.eventsLast24h || 0}</p>
            <p className="text-sm text-orange-800">Events (24h)</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.monitoring?.overview?.activeAlerts || 0}</p>
            <p className="text-sm text-red-800">Active Alerts</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{data.monitoring?.overview?.criticalIssues || 0}</p>
            <p className="text-sm text-purple-800">Critical Issues</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {data.monitoring?.activeAlerts?.map((alert: any, index: number) => (
            <div key={index} className={`p-4 rounded-lg border ${getThreatLevelColor(alert.severity)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{alert.type}</p>
                  <p className="text-sm opacity-75">{alert.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{alert.severity.toUpperCase()}</p>
                  <p className="text-xs opacity-75">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-8">No active alerts</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderIncidentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Response Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.incidents?.totalIncidents || 0}</p>
            <p className="text-sm text-blue-800">Total Incidents (30d)</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{Math.round(data.incidents?.averageResponseTime || 0)}m</p>
            <p className="text-sm text-green-800">Avg Response Time</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{Math.round(data.incidents?.automationEffectiveness || 0)}%</p>
            <p className="text-sm text-purple-800">Automation Effectiveness</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Incidents</h3>
        <div className="space-y-3">
          {data.monitoring?.openIncidents?.map((incident: any, index: number) => (
            <div key={index} className={`p-4 rounded-lg border ${getThreatLevelColor(incident.severity)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{incident.type}</p>
                  <p className="text-sm opacity-75">{incident.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{incident.status.toUpperCase()}</p>
                  <p className="text-xs opacity-75">{new Date(incident.reportedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-8">No open incidents</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPenTestingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Penetration Testing Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.penTesting?.overview?.totalTests || 0}</p>
            <p className="text-sm text-blue-800">Total Tests</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{data.penTesting?.overview?.testsLast30Days || 0}</p>
            <p className="text-sm text-orange-800">Tests (30d)</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.penTesting?.overview?.criticalVulnerabilities || 0}</p>
            <p className="text-sm text-red-800">Critical Vulns</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{data.penTesting?.overview?.highVulnerabilities || 0}</p>
            <p className="text-sm text-yellow-800">High Vulns</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Coverage</h3>
        <div className="space-y-4">
          {data.penTesting?.testCoverage && Object.entries(data.penTesting.testCoverage).map(([category, coverage]: [string, any]) => (
            category !== 'overall' && (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${coverage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{coverage}%</span>
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tests</h3>
        <div className="space-y-3">
          {data.penTesting?.upcomingTests?.map((test: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{test.suiteName}</p>
                <p className="text-xs text-gray-500">{test.frequency}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(test.scheduledTime).toLocaleDateString()}
              </span>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-4">No upcoming tests scheduled</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderTrainingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Training Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{data.training?.overview?.fullyCompliant || 0}</p>
            <p className="text-sm text-green-800">Fully Compliant</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{data.training?.overview?.partiallyCompliant || 0}</p>
            <p className="text-sm text-yellow-800">Partially Compliant</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.training?.overview?.nonCompliant || 0}</p>
            <p className="text-sm text-red-800">Non-Compliant</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{data.training?.overview?.expiredCertifications || 0}</p>
            <p className="text-sm text-orange-800">Expired Certs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.training?.trainingMetrics?.totalEnrollments || 0}</p>
            <p className="text-sm text-blue-800">Total Enrollments</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{Math.round(data.training?.trainingMetrics?.completionRate || 0)}%</p>
            <p className="text-sm text-green-800">Completion Rate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{Math.round(data.training?.trainingMetrics?.averageScore || 0)}%</p>
            <p className="text-sm text-purple-800">Average Score</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-2">
          {data.training?.recommendations?.map((recommendation: string, index: number) => (
            <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">{recommendation}</p>
            </div>
          )) || (
            <p className="text-center text-gray-500 py-4">No recommendations available</p>
          )}
        </div>
      </div>
    </div>
  );

  if (data.loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-8 ${className}`}>
        <div className="flex items-center justify-center text-red-600">
          <XCircle className="h-8 w-8 mr-3" />
          <span>Error loading dashboard: {data.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Security Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive security monitoring and incident response for the senior learning platform
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
              { id: 'pentesting', label: 'Pen Testing', icon: Target },
              { id: 'training', label: 'Training', icon: BookOpen }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-3 py-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'monitoring' && renderMonitoringTab()}
          {activeTab === 'incidents' && renderIncidentsTab()}
          {activeTab === 'pentesting' && renderPenTestingTab()}
          {activeTab === 'training' && renderTrainingTab()}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Auto-refresh every 30 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;