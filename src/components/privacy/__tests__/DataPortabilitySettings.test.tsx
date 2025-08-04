// Tests for Data Portability Settings Component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DataPortabilitySettings } from '../DataPortabilitySettings';
import { useUser } from '../../../contexts/UserContext';
import { getDataPortabilityService } from '../../../services/security/DataPortabilityService';

// Mock the dependencies
vi.mock('../../../contexts/UserContext');
vi.mock('../../../services/security/DataPortabilityService');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dataPortability.title': 'Data Portability & User Rights',
        'dataPortability.tabs.overview': 'Overview',
        'dataPortability.tabs.sharing': 'Data Sharing',
        'dataPortability.tabs.export': 'Export Data',
        'dataPortability.tabs.delete': 'Delete Data',
        'dataPortability.tabs.ai': 'AI Transparency',
        'dataPortability.overview.title': 'Your Data Rights',
        'dataPortability.overview.description': 'You have complete control over your personal data. You can view, export, correct, or delete your information at any time within 30 days.',
        'dataPortability.export.request': 'Request Data Export',
        'dataPortability.delete.request': 'Request Data Deletion',
        'dataPortability.delete.confirm': 'Are you sure you want to delete all your data?',
        'dataPortability.delete.placeholder': 'Type DELETE MY DATA',
        'dataPortability.delete.confirmButton': 'Confirm Deletion'
      };
      return translations[key] || fallback || key;
    }
  })
}));

const mockUserData = {
  id: 'test-user-123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com'
};

const mockDataSharingPreferences = {
  userId: 'test-user-123',
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
  researchSharing: true,
  lastUpdated: new Date()
};

const mockAIUsage = {
  conversationsAnalyzed: 25,
  dataPointsUsed: 500,
  modelTrainingContribution: 'anonymized',
  lastProcessed: new Date()
};

const mockDataPortabilityService = {
  getDataSharingPreferences: vi.fn(),
  getAIDataUsageDashboard: vi.fn(),
  updateDataSharingPreferences: vi.fn(),
  createExportRequest: vi.fn(),
  createDeletionRequest: vi.fn()
};

describe('DataPortabilitySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useUser as any).mockReturnValue({
      userData: mockUserData
    });

    (getDataPortabilityService as any).mockReturnValue(mockDataPortabilityService);

    mockDataPortabilityService.getDataSharingPreferences.mockResolvedValue(mockDataSharingPreferences);
    mockDataPortabilityService.getAIDataUsageDashboard.mockResolvedValue({
      dataUsage: mockAIUsage
    });
  });

  it('renders all main tabs', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Data Sharing')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('Delete Data')).toBeInTheDocument();
      expect(screen.getByText('AI Transparency')).toBeInTheDocument();
    });
  });

  it('displays user rights information in overview tab', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Your Data Rights')).toBeInTheDocument();
      expect(screen.getByText('You have complete control over your personal data. You can view, export, correct, or delete your information at any time within 30 days.')).toBeInTheDocument();
    });
  });

  it('loads and displays data sharing preferences', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Data Sharing')).toBeInTheDocument();
    });

    // Switch to sharing tab
    fireEvent.click(screen.getByText('Data Sharing'));

    await waitFor(() => {
      expect(mockDataPortabilityService.getDataSharingPreferences).toHaveBeenCalledWith('test-user-123');
    });
  });

  it('allows toggling data sharing preferences', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Data Sharing')).toBeInTheDocument();
    });

    // Switch to sharing tab
    fireEvent.click(screen.getByText('Data Sharing'));

    await waitFor(() => {
      // Find toggle switches and click one
      const toggles = screen.getAllByRole('checkbox');
      if (toggles.length > 0) {
        fireEvent.click(toggles[0]);
      }
    });

    await waitFor(() => {
      expect(mockDataPortabilityService.updateDataSharingPreferences).toHaveBeenCalled();
    });
  });

  it('handles data export request', async () => {
    const mockExportRequest = {
      id: 'export-123',
      status: 'pending',
      requestDate: new Date(),
      format: 'json'
    };

    mockDataPortabilityService.createExportRequest.mockResolvedValue(mockExportRequest);

    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    // Switch to export tab
    fireEvent.click(screen.getByText('Export Data'));

    await waitFor(() => {
      const exportButton = screen.getByText('Request Data Export');
      fireEvent.click(exportButton);
    });

    await waitFor(() => {
      expect(mockDataPortabilityService.createExportRequest).toHaveBeenCalledWith(
        'test-user-123',
        'json'
      );
    });
  });

  it('handles data deletion request with confirmation', async () => {
    const mockDeletionRequest = {
      id: 'deletion-123',
      status: 'pending',
      requestDate: new Date(),
      type: 'complete',
      verification: { verified: false }
    };

    mockDataPortabilityService.createDeletionRequest.mockResolvedValue(mockDeletionRequest);

    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Delete Data')).toBeInTheDocument();
    });

    // Switch to delete tab
    fireEvent.click(screen.getByText('Delete Data'));

    await waitFor(() => {
      // Click initial delete button
      const deleteButton = screen.getByText('Request Data Deletion');
      fireEvent.click(deleteButton);
    });

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete all your data?')).toBeInTheDocument();
    });

    // Type confirmation text
    const confirmationInput = screen.getByPlaceholderText('Type DELETE MY DATA');
    fireEvent.change(confirmationInput, { target: { value: 'DELETE MY DATA' } });

    // Click confirm button
    const confirmButton = screen.getByText('Confirm Deletion');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDataPortabilityService.createDeletionRequest).toHaveBeenCalledWith(
        'test-user-123',
        'complete',
        undefined,
        'User requested complete data deletion'
      );
    });
  });

  it('displays AI data usage information', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('AI Transparency')).toBeInTheDocument();
    });

    // Switch to AI tab
    fireEvent.click(screen.getByText('AI Transparency'));

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // conversations analyzed
      expect(screen.getByText('500')).toBeInTheDocument(); // data points used
      expect(screen.getByText('anonymized')).toBeInTheDocument(); // training contribution
    });
  });

  it('shows loading state initially', () => {
    mockDataPortabilityService.getDataSharingPreferences.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(<DataPortabilitySettings />);

    expect(screen.getByText('Data Portability & User Rights')).toBeInTheDocument();
  });

  it('handles export format selection', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    // Switch to export tab
    fireEvent.click(screen.getByText('Export Data'));

    await waitFor(() => {
      // Select CSV format
      const csvOption = screen.getByDisplayValue('csv');
      fireEvent.click(csvOption);
    });

    // Verify format is selected
    expect(screen.getByDisplayValue('csv')).toBeChecked();
  });

  it('prevents deletion without proper confirmation', async () => {
    render(<DataPortabilitySettings />);

    await waitFor(() => {
      expect(screen.getByText('Delete Data')).toBeInTheDocument();
    });

    // Switch to delete tab
    fireEvent.click(screen.getByText('Delete Data'));

    await waitFor(() => {
      // Click initial delete button
      const deleteButton = screen.getByText('Request Data Deletion');
      fireEvent.click(deleteButton);
    });

    // Try to confirm without typing the confirmation text
    const confirmButton = screen.getByText('Confirm Deletion');
    expect(confirmButton).toBeDisabled();

    // Type wrong confirmation text
    const confirmationInput = screen.getByPlaceholderText('Type DELETE MY DATA');
    fireEvent.change(confirmationInput, { target: { value: 'wrong text' } });

    expect(confirmButton).toBeDisabled();
  });

  it('displays error handling for failed requests', async () => {
    mockDataPortabilityService.getDataSharingPreferences.mockRejectedValue(
      new Error('Failed to load preferences')
    );

    render(<DataPortabilitySettings />);

    // Should handle the error gracefully and not crash
    await waitFor(() => {
      expect(screen.getByText('Data Portability & User Rights')).toBeInTheDocument();
    });
  });
});