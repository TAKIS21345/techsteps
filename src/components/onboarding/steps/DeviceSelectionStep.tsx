import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';

interface DeviceSelectionStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const DeviceSelectionStep: React.FC<DeviceSelectionStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 2 });

  const devices = [
    'windowscomputer',
    'macapplecomputer',
    'iphone',
    'ipad',
    'androidphoneortablet',
    'smarttv',
    'multipledevices'
  ];

  const handleDeviceSelect = (deviceKey: string) => {
    updateData({ primaryDevice: t(`onboarding.step3.devices.${deviceKey}`) });
  };

  return (
    <div className="space-y-4" data-testid="device-selection-step">
      {devices.map((deviceKey) => (
        <Button
          key={deviceKey}
          variant={data.primaryDevice === t(`onboarding.step3.devices.${deviceKey}`) ? 'primary' : 'outline'}
          size="lg"
          onClick={() => handleDeviceSelect(deviceKey)}
          className="w-full p-4 text-left justify-start"
          data-testid={`device-option-${deviceKey}`}
        >
          <Typography variant="body">
            {t(`onboarding.step3.devices.${deviceKey}`)}
          </Typography>
        </Button>
      ))}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
          {errors.map((error, index) => (
            <Typography key={index} variant="body-sm" className="text-red-700">
              {error}
            </Typography>
          ))}
        </div>
      )}
    </div>
  );
};