import React, { useEffect, useCallback } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './AddNewDataPopOver.scss';
import { useScreenReader } from '@/modules/common/hooks';

export const AddNewDataPopOver = ({
  disabled,
  children,
  show,
  darkMode,
  toggleAddNewDataMenu,
  handleOnClickCreateNewRow,
  handleOnClickBulkUpdateData,
}) => {
  const { speak } = useScreenReader();

  if (disabled) return children;

  // Focus first menu item when menu opens
  useEffect(() => {
    if (show) {
      setTimeout(() => {
        const firstItem = document.querySelector('[data-cy="add-new-row-option"]');
        if (firstItem) {
          firstItem.focus();
          speak('Add new row');
        }
      }, 100);
    }
  }, [show, speak]);

  // Handle keyboard navigation within menu
  const handleKeyDown = useCallback((e) => {
    const items = [
      document.querySelector('[data-cy="add-new-row-option"]'),
      document.querySelector('[data-cy="bulk-upload-data-option"]')
    ].filter(Boolean);

    const currentIndex = items.indexOf(document.activeElement);

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      speak('Closing add new data menu');
      setTimeout(() => {
        toggleAddNewDataMenu(false);
        // Return focus to the button
        setTimeout(() => {
          const button = document.querySelector('[data-cy="add-new-data-button"]');
          button?.focus();
        }, 50);
      }, 1500);
    }
  }, [speak, toggleAddNewDataMenu]);

  // Attach document-level keydown listener when menu is open
  // Use capture phase (true) to intercept Escape before Bootstrap's rootClose
  useEffect(() => {
    if (!show) return;

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [show, handleKeyDown]);

  const popover = (
    <Popover
      className={`table-list-items add-new-data-popover ${darkMode && 'dark-theme'}`}
      style={{
        width: '160px',
      }}
      onKeyDown={handleKeyDown}
    >
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div
          className="row cursor-pointer add-new-data-menu-item"
          data-cy="add-new-row-option"
          tabIndex="0"
          role="menuitem"
          onClick={(event) => {
            event.stopPropagation();
            speak('Opening add new row drawer');
            setTimeout(() => {
              toggleAddNewDataMenu(false);
              handleOnClickCreateNewRow(true);
            }, 800);
          }}
          onFocus={() => speak('Add new row')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              speak('Opening add new row drawer');
              setTimeout(() => {
                toggleAddNewDataMenu(false);
                handleOnClickCreateNewRow(true);
              }, 800);
            }
          }}
          style={{ margin: 0, padding: '8px 12px', borderRadius: '4px' }}
        >
          <div className="col-auto">
            <SolidIcon name="row" width="14" fill={'#889096'} />
          </div>
          <div className="col text-truncate tj-text tj-text-xsm font-weight-500">Add new row</div>
        </div>
        <div
          className="row mt-3 cursor-pointer add-new-data-menu-item"
          data-cy="bulk-upload-data-option"
          tabIndex="0"
          role="menuitem"
          onClick={(event) => {
            event.stopPropagation();
            speak('Opening bulk upload data drawer');
            setTimeout(() => {
              toggleAddNewDataMenu(false);
              handleOnClickBulkUpdateData(true);
            }, 800);
          }}
          onFocus={() => speak('Bulk upload data')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              speak('Opening bulk upload data drawer');
              setTimeout(() => {
                toggleAddNewDataMenu(false);
                handleOnClickBulkUpdateData(true);
              }, 800);
            }
          }}
          style={{ margin: 0, padding: '8px 12px', borderRadius: '4px' }}
        >
          <div className="col-auto">
            <SolidIcon name="fileupload" width="14" fill={'#889096'} />
          </div>
          <div className="col text-truncate tj-text tj-text-xsm font-weight-500">Bulk upload data</div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger={[]}
      placement="bottom"
      rootClose
      rootCloseEvent="click"
      onToggle={(nextShow) => {
        if (!nextShow) {
          toggleAddNewDataMenu(false);
        }
      }}
      show={show}
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};
