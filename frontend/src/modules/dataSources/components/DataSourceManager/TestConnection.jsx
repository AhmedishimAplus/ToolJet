import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { datasourceService } from '@/_services';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const TestConnection = ({
  kind,
  options,
  pluginId,
  onConnectionTestFailed,
  environmentId,
  dataSourceId,
  dataSourceType,
  appId,
}) => {
  const [isTesting, setTestingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [buttonText, setButtonText] = useState('Test connection');
  const { t } = useTranslation();
  const { speak } = useScreenReader();

  useEffect(() => {
    if (isTesting) {
      setButtonText('Testing connection...');
    } else if (connectionStatus === 'success') {
      setButtonText('Connection verified');
      speak('Connection verified successfully.');
    } else {
      setButtonText('Test connection');
    }
  }, [isTesting, connectionStatus, speak]);

  useEffect(() => {
    setConnectionStatus('unknown');
  }, [options]);

  function testDataSource() {
    setTestingStatus(true);
    posthogHelper.captureEvent('test_connection_datasource', { dataSource: kind, appId });
    //posthog event

    const testConnectionBody = {
      kind,
      options,
      plugin_id: pluginId,
      environment_id: environmentId,
      dataSourceId: dataSourceId,
    };
    const sampleDbTestConnection = {
      kind,
      options,
      plugin_id: pluginId,
      environment_id: environmentId,
      dataSourceId,
    };
    const body = dataSourceType === DATA_SOURCE_TYPE.SAMPLE ? sampleDbTestConnection : testConnectionBody;

    const testFunction =
      dataSourceType === DATA_SOURCE_TYPE.SAMPLE ? datasourceService.testSampleDb : datasourceService.test;
    testFunction(body).then(
      (data) => {
        setTestingStatus(false);
        if (data.status === 'ok') {
          setConnectionStatus('success');
        } else {
          setConnectionStatus('failed');
          onConnectionTestFailed(data);
        }
      },
      ({ error }) => {
        setTestingStatus(false);
        setConnectionStatus('failed');
        toast.error(error, { position: 'top-center' });
      }
    );
  }

  return (
    <div>
      {connectionStatus === 'failed' && (
        <span
          className="badge bg-red-lt"
          data-cy={`test-connection-failed-text`}
          role="status"
          aria-live="polite"
          tabIndex={0}
          onFocus={() => speak('Connection test failed. Could not connect to datasource.')}
        >
          {t('globals.noConnection', 'could not connect')}
        </span>
      )}

      {connectionStatus === 'success' && (
        <span
          className="badge bg-green-lt"
          data-cy={`test-connection-verified-text`}
          role="status"
          aria-live="polite"
          tabIndex={0}
          onFocus={() => speak('Connection verified successfully.')}
        >
          {t('globals.connectionVerified', 'connection verified')}
        </span>
      )}

      {connectionStatus === 'unknown' && (
        <ButtonSolid
          disabled={isTesting || connectionStatus === 'success'}
          onClick={() => testDataSource()}
          data-cy={`test-connection-button`}
          variant="tertiary"
          leftIcon="arrowsort"
          onFocus={() => {
            const status = isTesting ? 'Testing connection' : 'Press Enter to test datasource connection';
            speak(`Test connection button. ${status}.`);
          }}
        >
          {buttonText}
        </ButtonSolid>
      )}
    </div>
  );
};
