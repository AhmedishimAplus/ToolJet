import React, { useRef, useState, useEffect, useCallback } from 'react';
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

  /** Redirect back to dashboard or workflows **/
  const handleBackClick = (e) => {
    e.preventDefault();
    isWorkflows ? redirectToWorkflows() : redirectToDashboard();
  };

  const backToLinkProps = { to: getPrivateRoute(isWorkflows ? 'workflows' : 'dashboard') };

  /** Handle outside click to close menu **/
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      const menu = document.querySelector('.logo-nav-card.settings-card');
      if (menu && !menu.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /** Handle keyboard nav logic inside menu **/
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;
      const menu = document.querySelector('.logo-nav-card.settings-card');
      if (!menu) return;

      const visibleItems = Array.from(menu.querySelectorAll('a.dropdown-item')).filter(
        (el) => el.offsetParent !== null // only focus visible items
      );
      const currentIndex = visibleItems.indexOf(document.activeElement);

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % visibleItems.length;
        visibleItems[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
        visibleItems[prevIndex]?.focus();
      }
    },
    [isOpen]
  );

  /** Wait until overlay content mounts before focusing first item **/
  useEffect(() => {
    if (!isOpen) return;

    const observer = new MutationObserver(() => {
      const menu = document.querySelector('.logo-nav-card.settings-card');
      if (menu) {
        const links = Array.from(menu.querySelectorAll('a.dropdown-item')).filter(
          (l) => window.getComputedStyle(l).display !== 'none'
        );
        if (links.length) {
          links[0].focus();
          observer.disconnect();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  /** Trigger key/click handlers **/
  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };
  const handleTriggerClick = (e) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const handleToggle = (nextShow) => {
    setIsOpen(nextShow);
    if (!nextShow) triggerRef.current?.focus();
  };

  /** Overlay menu **/
  const getOverlay = () => {
    const session = authenticationService?.currentSessionValue ?? {};
    const dataPerms = session?.data_source_group_permissions;
    const showDataSource =
      session?.user_permissions?.data_source_create ||
      session?.user_permissions?.data_source_delete ||
      dataPerms?.usable_data_sources_id?.length ||
      dataPerms?.is_all_usable ||
      dataPerms?.configurable_data_source_id?.length ||
      dataPerms?.is_all_configurable;
    const isBuilder = hasBuilderRole(session?.role ?? {});

    return (
      <div
        ref={menuRef}
        className={`logo-nav-card settings-card card ${darkMode ? 'dark-theme' : ''}`}
        role="menu"
      >
        {/* Back to Apps */}
        <Link
          className="dropdown-item tj-text tj-text-xsm"
          data-cy="back-to-app-option"
          onClick={handleBackClick}
          tabIndex={0}
          {...backToLinkProps}
        >
          <SolidIcon name="arrowbackdown" width="20" fill="#C1C8CD" />
          <span>Back to {isWorkflows ? 'workflows' : 'apps'}</span>
        </Link>
        <div className="divider"></div>

        {/* Workflows */}
        {!isWorkflows &&
          showWorkflows &&
          workflowsEnabled &&
          admin && (
            <Link
              to={getPrivateRoute('workflows')}
              className="dropdown-item tj-text tj-text-xsm"
              data-cy="workflows-option"
              tabIndex={0}
            >
              <SolidIcon name="workflows" width="20" fill="#C1C8CD" />
              <span>Workflows</span>
            </Link>
          )}

        {/* Database */}
        {(admin || isBuilder) && (
          <Link
            to={getPrivateRoute('database')}
            className="dropdown-item tj-text tj-text-xsm"
            data-cy="database-option"
            tabIndex={0}
          >
            <SolidIcon name="table" width="20" />
            <span>Database</span>
          </Link>
        )}

        {/* Data sources */}
        {(admin || showDataSource) && (
          <Link
            to={getPrivateRoute('data_sources')}
            className="dropdown-item tj-text tj-text-xsm"
            data-cy="data-source-option"
            tabIndex={0}
          >
            <SolidIcon name="datasource" width="20" />
            <span>Data sources</span>
          </Link>
        )}

        {/* Workspace constants */}
        <Link
          to={getPrivateRoute('workspace_constants')}
          className="dropdown-item tj-text tj-text-xsm"
          data-cy="workspace-constants-option"
          tabIndex={0}
        >
          <SolidIcon name="workspaceconstants" width="20" />
          <span>Workspace constants</span>
        </Link>
      </div>
    );
  };

  return (
    <OverlayTrigger
      trigger="manual"
      placement="bottom"
      rootClose={false}
      overlay={getOverlay()}
      show={isOpen}
      onToggle={handleToggle}
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
