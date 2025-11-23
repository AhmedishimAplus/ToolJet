import React, { useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './AddNewDataPopOver.scss';

export const AddNewDataPopOver = ({
  disabled,
  children,
  show,
  darkMode,
  toggleAddNewDataMenu,
  handleOnClickCreateNewRow,
  handleOnClickBulkUpdateData,
}) => {
  if (disabled) return children;

  // Focus first menu item when menu opens
  useEffect(() => {
    if (show) {
      setTimeout(() => {
        const firstItem = document.querySelector('[data-cy="add-new-row-option"]');
        if (firstItem) {
          firstItem.focus();
        }
      }, 100);
    }
  }, [show]);

  // Handle keyboard navigation within menu
  const handleKeyDown = (e) => {
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
      toggleAddNewDataMenu(false);
    }
  };

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
            toggleAddNewDataMenu(false);
            handleOnClickCreateNewRow(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              toggleAddNewDataMenu(false);
              handleOnClickCreateNewRow(true);
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
            toggleAddNewDataMenu(false);
            handleOnClickBulkUpdateData(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              toggleAddNewDataMenu(false);
              handleOnClickBulkUpdateData(true);
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
      trigger="click"
      placement="bottom"
      rootClose
      onToggle={() => {
        toggleAddNewDataMenu(!show);
      }}
      show={show}
      overlay={popover}
    >
      {children}
    </OverlayTrigger>
  );
};
