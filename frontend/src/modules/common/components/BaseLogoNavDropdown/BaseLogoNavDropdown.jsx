import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { authenticationService } from '@/_services';
import { getPrivateRoute, redirectToDashboard, redirectToWorkflows } from '@/_helpers/routes';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import AppLogo from '@/_components/AppLogo';
import { hasBuilderRole } from '@/_helpers/utils';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';

const BaseLogoNavDropdown = ({ darkMode, showWorkflows = false, type = 'apps' }) => {
  const { admin } = authenticationService?.currentSessionValue ?? {};
  const isWorkflows = type === 'workflows';
  const workflowsEnabled = admin && isWorkflowsFeatureEnabled();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const overlayRef = useRef(null);

  const handleBackClick = (e) => {
    e.preventDefault();
    // Force a reload for clearing interval triggers
    isWorkflows ? redirectToWorkflows() : redirectToDashboard();
  };

  const backToLinkProps = { to: getPrivateRoute(isWorkflows ? 'workflows' : 'dashboard') };

  // Focus management - move focus to first menu item when opened
  useEffect(() => {
    if (isOpen) {
      // Query the DOM directly since overlay is in a portal
      const menuInDom = document.querySelector('.logo-nav-card.settings-card');
      console.log('Menu in DOM:', menuInDom);
      if (menuInDom) {
        const firstLink = menuInDom.querySelector('a.dropdown-item');
        console.log('First link found:', firstLink);

        // Debug: log all links
        const allLinks = menuInDom.querySelectorAll('a.dropdown-item');
        console.log('All menu items found:', allLinks.length);
        allLinks.forEach((link, index) => {
          console.log(`Item ${index}:`, link.textContent.trim(), 'visible:', window.getComputedStyle(link).display !== 'none', 'tabIndex:', link.tabIndex);
        });

        if (firstLink) {
          setTimeout(() => {
            firstLink.focus();
            console.log('Focused on:', document.activeElement);
          }, 100);
        }
      }
    }
  }, [isOpen]);

  // Handle clicks outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const menuInDom = document.querySelector('.logo-nav-card.settings-card');
      if (
        menuInDom &&
        !menuInDom.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Add global keyboard listener for menu navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e) => {
      handleKeyDown(e);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Focus trap - keep focus within the menu
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    // Query DOM directly for menu items since overlay is in a portal
    const menuInDom = document.querySelector('.logo-nav-card.settings-card');
    if (!menuInDom) return;

    const menuItems = menuInDom.querySelectorAll('a.dropdown-item');
    const menuItemsArray = Array.from(menuItems);
    const currentIndex = menuItemsArray.indexOf(document.activeElement);

    console.log('Key pressed:', e.key, 'Current index:', currentIndex, 'Total items:', menuItemsArray.length);

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % menuItemsArray.length;
      console.log('Moving to index:', nextIndex, menuItemsArray[nextIndex]);
      menuItemsArray[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + menuItemsArray.length) % menuItemsArray.length;
      console.log('Moving to index:', prevIndex, menuItemsArray[prevIndex]);
      menuItemsArray[prevIndex]?.focus();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab cycles through menu items (focus trap)
      if (e.shiftKey) {
        const prevIndex = (currentIndex - 1 + menuItemsArray.length) % menuItemsArray.length;
        console.log('Tab Shift - Moving to index:', prevIndex, menuItemsArray[prevIndex]);
        menuItemsArray[prevIndex]?.focus();
      } else {
        const nextIndex = (currentIndex + 1) % menuItemsArray.length;
        console.log('Tab - Moving to index:', nextIndex, menuItemsArray[nextIndex]);
        menuItemsArray[nextIndex]?.focus();
      }
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  const handleTriggerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleToggle = (nextShow) => {
    setIsOpen(nextShow);
    if (!nextShow) {
      // Return focus to trigger when menu closes
      triggerRef.current?.focus();
    }
  };

  const getOverlay = () => {
    const { admin } = authenticationService?.currentSessionValue ?? {};
    const data_source_group_permissions = authenticationService?.currentSessionValue?.data_source_group_permissions;
    const showDataSource =
      authenticationService?.currentSessionValue?.user_permissions?.data_source_create === true ||
      authenticationService?.currentSessionValue?.user_permissions?.data_source_delete === true ||
      data_source_group_permissions?.usable_data_sources_id?.length ||
      data_source_group_permissions?.is_all_usable ||
      data_source_group_permissions?.configurable_data_source_id?.length ||
      data_source_group_permissions?.is_all_configurable;
    const isBuilder = hasBuilderRole(authenticationService?.currentSessionValue?.role ?? {});

    return (
      <div
        ref={menuRef}
        className={`logo-nav-card settings-card card ${darkMode && 'dark-theme'}`}
        onKeyDown={handleKeyDown}
      >
        <Link
          className="dropdown-item tj-text tj-text-xsm"
          data-cy="back-to-app-option"
          onClick={handleBackClick}
          tabIndex={0}
          {...backToLinkProps}
        >
          <SolidIcon name="arrowbackdown" width="20" viewBox="0 0 20 20" fill="#C1C8CD" />
          <span>Back to {isWorkflows ? 'workflows' : 'apps'}</span>
        </Link>
        <div className="divider"></div>
        {isWorkflows || !showWorkflows
          ? null
          : workflowsEnabled &&
          showWorkflows &&
          admin && (
            <Link target="_blank" to={getPrivateRoute('workflows')} className="dropdown-item tj-text tj-text-xsm" tabIndex={0}>
              <SolidIcon name={'workflows'} width="20" fill="#C1C8CD" />
              <span>{'Workflows'}</span>
            </Link>
          )}
        {(admin || isBuilder) && (
          <Link
            target="_blank"
            to={getPrivateRoute('database')}
            className="dropdown-item tj-text tj-text-xsm"
            data-cy="database-option"
            tabIndex={0}
          >
            <SolidIcon name="table" width="20" />
            <span>Database</span>
          </Link>
        )}
        {(admin || showDataSource) && (
          <Link
            to={getPrivateRoute('data_sources')}
            className="dropdown-item tj-text tj-text-xsm"
            target="_blank"
            data-cy="data-source-option"
            tabIndex={0}
          >
            <SolidIcon name="datasource" width="20" />
            <span>Data sources</span>
          </Link>
        )}
        <Link
          to={getPrivateRoute('workspace_constants')}
          className="dropdown-item tj-text tj-text-xsm"
          target="_blank"
          data-cy="workspace-constants-option"
          tabIndex={0}
        >
          <SolidIcon name="workspaceconstants" width="20" viewBox="0 0 20 20" />
          <span>Workspace constants</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger
      trigger="manual"
      placement={'bottom'}
      rootClose={false}
      overlay={getOverlay()}
      show={isOpen}
      onToggle={handleToggle}
      style={{ transform: 'translate(5px, 52px)', zIndex: '100' }}
    >
      <div
        ref={triggerRef}
        className="cursor-pointer"
        tabIndex={0}
        role="button"
        aria-label="Navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onKeyDown={handleTriggerKeyDown}
        onClick={handleTriggerClick}
      >
        <AppLogo isLoadingFromHeader={false} />
      </div>
    </OverlayTrigger>
  );
};

export default BaseLogoNavDropdown;
