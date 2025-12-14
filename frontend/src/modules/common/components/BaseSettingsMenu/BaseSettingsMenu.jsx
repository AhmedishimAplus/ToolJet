// src/modules/common/components/BaseSettingsMenu/BaseSettingsMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { authenticationService, appService, sessionService } from '@/_services';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useTranslation } from 'react-i18next';
import { getPrivateRoute } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useAppDataStore } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import { checkIfToolJetCloud } from '@/_helpers/utils';
import { fetchEdition } from '@/modules/common/helpers/utils';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

function BaseSettingsMenu({
  darkMode,
  checkForUnsavedChanges,
  featureAccess,
  getPreWorkspaceItems = () => null,
  getMidMenuItems = () => null,
  options = {
    hideMarketPlaceMenuItem: false,
  },
}) {
  const { speak } = useScreenReader();
  const edition = fetchEdition();
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTriggerRef = useRef(null);
  const { tooljetVersion } = useAppDataStore(
    (state) => ({
      tooljetVersion: state?.metadata?.installed_version,
    }),
    shallow
  );
  const { t } = useTranslation();

  // Get common user values
  const currentUserValue = authenticationService.currentSessionValue;
  const admin = currentUserValue?.admin;
  const superAdmin = currentUserValue?.super_admin;
  const marketplaceEnabled = admin && !options.hideMarketPlaceMenuItem;
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };
  async function handleLogout() {
    // Get latest config first to ensure we have the most up-to-date custom logout url
    await appService
      .getConfig()
      .then((config) => {
        window.public_config = config;
        const customLogoutUrl = window.public_config?.CUSTOM_LOGOUT_URL;
        if (customLogoutUrl && isValidUrl(customLogoutUrl)) {
          sessionService.logout().then(() => {
            window.location.href = customLogoutUrl;
          });
          return;
        }
        sessionService.logout();
      })
      .catch((error) => {
        sessionService.logout();
      });
  }

  const getOverlay = () => {
    // Get the extension items with the required context
    const preWorkspaceContent = getPreWorkspaceItems({
      admin,
      superAdmin,
      featureAccess,
      checkForUnsavedChanges,
    });
    const midMenuContent = getMidMenuItems({
      admin,
      superAdmin,
      featureAccess,
      checkForUnsavedChanges,
    });

    return (
      <div className={`settings-card tj-text card ${darkMode ? 'dark-theme' : ''}`}>
        {/* Marketplace section */}
        {marketplaceEnabled && tooljetVersion && !checkIfToolJetCloud(tooljetVersion) && (
          <Link
            onClick={(event) => {
              checkForUnsavedChanges('/integrations/marketplace', event);
              setShowOverlay(false);
            }}
            to={'/integrations/marketplace'}
            className="dropdown-item tj-text-xsm"
            data-cy="marketplace-option"
            tabIndex={-1}
          >
            <span>Marketplace</span>
          </Link>
        )}

        {/* Pre-workspace extension point (Audit logs) */}
        {preWorkspaceContent}

        {/* Add divider if either marketplace or pre-workspace items exist */}
        {(marketplaceEnabled || preWorkspaceContent) && <div className="divider"></div>}

        {/* Super Admin Settings */}
        {superAdmin && midMenuContent}

        {/* Specifically for Cloud Edition */}
        {edition === 'cloud' && admin && !superAdmin && midMenuContent}

        {/* Admin section - Workspace settings */}
        {admin && (
          <Link
            onClick={(event) => {
              checkForUnsavedChanges(getPrivateRoute('workspace_settings'), event);
              setShowOverlay(false);
            }}
            to={getPrivateRoute('workspace_settings')}
            className="dropdown-item tj-text-xsm"
            data-cy="workspace-settings"
            tabIndex={-1}
          >
            <span>Workspace settings</span>
          </Link>
        )}

        {/* Profile settings */}
        <Link
          onClick={(event) => {
            checkForUnsavedChanges(getPrivateRoute('profile_settings'), event);
            setShowOverlay(false);
          }}
          to={getPrivateRoute('profile_settings')}
          className="dropdown-item tj-text-xsm"
          data-cy="profile-settings"
          tabIndex={-1}
        >
          <span>Profile settings</span>
        </Link>

        {/* Add divider before logout */}
        <div className="divider"></div>

        {/* Logout */}
        <Link
          data-testid="logoutBtn"
          to="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
            setShowOverlay(false);
          }}
          className="dropdown-item text-danger tj-text-xsm"
          data-cy="logout-link"
          tabIndex={-1}
        >
          <span>{t('header.logout', 'Logout')}</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger
      ref={overlayTriggerRef}
      onToggle={setShowOverlay}
      rootClose={true}
      trigger="click"
      placement="right"
      overlay={getOverlay()}
    >
      <div
        className={cx('settings-nav-item cursor-pointer', { active: showOverlay })}
        data-cy="settings-icon"
        tabIndex="0"
        role="button"
        aria-label="Open settings menu"
        aria-expanded={showOverlay}
        onFocus={() => speak('Settings button')}
      >
        <div className="d-xl-block">
          <SolidIcon name="settings" fill={showOverlay ? '#3E63DD' : 'var(--slate8)'} width={28} />
        </div>
      </div>
    </OverlayTrigger>
  );
}

export default BaseSettingsMenu;
