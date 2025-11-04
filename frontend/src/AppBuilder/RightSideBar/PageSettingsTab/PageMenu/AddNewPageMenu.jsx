import React, { useRef, useState, useEffect } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { AddEditPagePopup } from './AddNewPagePopup';
import PageOptions from './PageOptions';
import { ToolTip as LicenseTooltip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function AddNewPageMenu({ darkMode, isLicensed }) {
  const newPageBtnRef = useRef(null);
  const moreOptionsButtonRef = useRef(null);
  const menuItemsRef = useRef([]);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const setNewPagePopupConfig = useStore((state) => state.setNewPagePopupConfig);
  const setEditingPage = useStore((state) => state.setEditingPage);
  const newPagePopupConfig = useStore((state) => state.newPagePopupConfig);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (showMenuPopover && menuItemsRef.current[0]) {
      menuItemsRef.current[0].focus();
    }
  }, [showMenuPopover]);

  // Handle menu close and return focus to button
  const closeMenu = () => {
    setShowMenuPopover(false);
    if (moreOptionsButtonRef.current) {
      moreOptionsButtonRef.current.focus();
    }
  };

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = (e, index) => {
    const menuItems = menuItemsRef.current.filter(item => item !== null);

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: go to previous item or wrap to last
        const prevIndex = index === 0 ? menuItems.length - 1 : index - 1;
        menuItems[prevIndex]?.focus();
      } else {
        // Tab: go to next item or wrap to first
        const nextIndex = index === menuItems.length - 1 ? 0 : index + 1;
        menuItems[nextIndex]?.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
    }
  };

  const handleOpenPopup = (type) => {
    closeMenu();
    setNewPagePopupConfig({ type, show: true, mode: 'add' });
  };

  return (
    <div className={`page-type-buttons-container ${darkMode && 'dark-mode'}`}>
      <Button
        ref={newPageBtnRef}
        key="new-page-btn"
        fill="var(--icon-default)"
        leadingIcon="plus"
        variant="outline"
        className="add-new-page icon-btn"
        id="add-new-page"
        onClick={() => {
          setNewPagePopupConfig({ show: true, mode: 'add', type: 'default' });
        }}
      >
        New page
      </Button>

      <Button
        ref={moreOptionsButtonRef}
        iconOnly
        leadingIcon="morevertical01"
        className="more-page-opts"
        onClick={() => {
          setShowMenuPopover((prev) => !prev);
          setNewPagePopupConfig({ show: false, mode: null, type: null });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && showMenuPopover) {
            e.preventDefault();
            closeMenu();
          }
        }}
        variant="outline"
        aria-expanded={showMenuPopover}
        aria-label="More options"
      />

      <Overlay
        target={newPageBtnRef.current}
        show={showMenuPopover}
        placement="bottom"
        rootClose
        onHide={() => setShowMenuPopover(false)}
      >
        <Popover className={darkMode && 'dark-theme theme-dark'} id="add-new-page-popover">
          <div className="menu-options mb-0">
            <PageOptions
              ref={(el) => (menuItemsRef.current[0] = el)}
              type="url"
              text="Add nav item with URL"
              icon="addnavitemurl"
              darkMode={darkMode}
              onClick={() => handleOpenPopup('url')}
              onKeyDown={(e) => {
                handleMenuKeyDown(e, 0);
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenPopup('url');
                }
              }}
            />
            <PageOptions
              ref={(el) => (menuItemsRef.current[1] = el)}
              type="app"
              text="Add nav item ToolJet app"
              icon="apps"
              darkMode={darkMode}
              onClick={() => handleOpenPopup('app')}
              onKeyDown={(e) => {
                handleMenuKeyDown(e, 1);
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenPopup('app');
                }
              }}
            />
            <div className={`${!isLicensed && 'd-flex disabled licensed-page-option'}`}>
              <PageOptions
                ref={(el) => (menuItemsRef.current[2] = el)}
                type="group"
                text="Add nav group"
                icon="folder"
                darkMode={darkMode}
                onClick={() => handleOpenPopup('group')}
                onKeyDown={(e) => {
                  handleMenuKeyDown(e, 2);
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isLicensed) {
                      handleOpenPopup('group');
                    }
                  }
                }}
              />
              <LicenseTooltip
                message={"Nav group can't be created on free plans"}
                placement="bottom"
                show={!isLicensed}
              >
                <div className="d-flex align-items-center">{!isLicensed && <SolidIcon name="enterprisecrown" />}</div>
              </LicenseTooltip>
            </div>
          </div>
        </Popover>
      </Overlay>

      <Overlay
        target={newPageBtnRef.current}
        show={newPagePopupConfig.show && newPagePopupConfig?.mode == 'add'}
        placement="left-start"
        rootClose
        onHide={() => {
          setNewPagePopupConfig({ show: false, mode: null, type: null });
          setEditingPage(null);
        }}
      >
        <AddEditPagePopup darkMode={darkMode} />
      </Overlay>
    </div>
  );
}
