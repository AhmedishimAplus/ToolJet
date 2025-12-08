import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useScreenReader } from '@/modules/common/hooks';

const BaseImportAppMenu = ({
  showTemplateLibraryModal = () => null,
  readAndImport = () => null,
  showEEMenuItems = false,
  EEMenuComponent = () => null,
  showCloudMenuItems = false,
  CloudMenuComponent = () => null,
  darkMode = false,
  appType = 'front-end',
  ...props
}) => {
  const fileInput = React.createRef();
  const { t } = useTranslation();
  const { speak } = useScreenReader();
  return (
    <Dropdown.Menu className="import-lg-position new-app-dropdown">
      {appType !== 'workflow' && appType !== 'module' && (
        <Dropdown.Item
          className="homepage-dropdown-style tj-text tj-text-xsm"
          onClick={showTemplateLibraryModal}
          onFocus={() => speak('Choose from template')}
          data-cy="choose-from-template-button"
        >
          {t('homePage.header.chooseFromTemplate', 'Choose from template')}
        </Dropdown.Item>
      )}
      <label
        className="homepage-dropdown-style tj-text tj-text-xsm dropdown-item"
        data-cy="import-option-label"
        onChange={readAndImport}
        onFocus={() => speak('Import from device')}
        tabIndex="0"
        style={{ cursor: 'pointer' }}
      >
        {t('homePage.header.import', 'Import from device')}
        <input type="file" accept=".json" ref={fileInput} style={{ display: 'none' }} data-cy="import-option-input" />
      </label>
      {showEEMenuItems && <EEMenuComponent {...props} />}
      {showCloudMenuItems && <CloudMenuComponent {...props} />}
    </Dropdown.Menu>
  );
};

export default BaseImportAppMenu;
