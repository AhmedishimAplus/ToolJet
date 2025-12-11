import React from 'react';
import cx from 'classnames';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import EditIcon from '../../Icons/EditColumn.svg';
// import CloneIcon from './Icons/Clone.svg';
import DeleteIcon from './Icons/Delete.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Menu from '../../Icons/Menu.svg';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const ListItemPopover = ({
  onEdit,
  onDelete,
  darkMode,
  handleExportTable,
  onMenuToggle,
  onAddNewColumnBtnClick,
}) => {
  const { speak } = useScreenReader();
  const [show, setShow] = React.useState(false);
  const [isOpening, setIsOpening] = React.useState(false);
  const closeMenu = () => {
    document.body.click();
  };

  // Focus trap for keyboard navigation within menu
  React.useEffect(() => {
    if (show) {
      // Focus first option when menu opens
      setTimeout(() => {
        const firstOption = document.querySelector('.table-list-items [tabindex="0"]');
        if (firstOption) {
          firstOption.focus();
        }
      }, 100);

      // Handle keyboard navigation within menu
      const handleKeyDown = (e) => {
        // Only handle if we're inside the table options menu
        if (!document.activeElement?.closest('.table-list-items')) return;

        // Get all focusable elements in the menu
        const getFocusableElements = () => {
          const popup = document.querySelector('.table-list-items');
          if (!popup) return [];

          const selectors = [
            '[tabindex="0"]',
            'button:not([disabled])',
            'a[href]:not([disabled])'
          ].join(', ');

          return Array.from(popup.querySelectorAll(selectors)).filter(el => {
            return el.offsetParent !== null;
          });
        };

        if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const items = getFocusableElements();
          const currentIndex = items.indexOf(document.activeElement);

          if (e.shiftKey) {
            // Shift+Tab: go to previous item (wrap around)
            const prevIndex = (currentIndex - 1 + items.length) % items.length;
            items[prevIndex]?.focus();
          } else {
            // Tab: go to next item (wrap around)
            const nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex]?.focus();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          speak('Closing table options menu');
          setTimeout(() => {
            setShow(false);
          }, 800);
        }
      };

      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [show, speak]);

  const popover = (
    <Popover id="popover-contained" className={`table-list-items ${darkMode && 'dark-theme'}`}>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div
          className={`row cursor-pointer`}
          tabIndex="0"
          onFocus={() => speak('Edit table option')}
          onClick={(event) => {
            event.stopPropagation();
            closeMenu();
            onEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              closeMenu();
              onEdit();
            }
          }}
        >
          <div className="col-auto" data-cy="edit-option-icon">
            <EditIcon />
          </div>
          <div
            className="col text-truncate"
            data-cy="rename-table-option"
          >
            Edit table
          </div>
        </div>
        <div
          className={`row mt-3 cursor-pointer`}
          tabIndex="0"
          onFocus={() => speak('Add new column option')}
          onClick={(event) => {
            event.stopPropagation();
            closeMenu();
            onAddNewColumnBtnClick();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              closeMenu();
              onAddNewColumnBtnClick();
            }
          }}
        >
          <div className="col-auto" data-cy="add-new-column-icon">
            <SolidIcon name="column" width="14" />
          </div>
          <div
            className="col text-truncate"
            data-cy="add-new-column-option"
          >
            Add new column
          </div>
        </div>
        <div
          className="row mt-3 cursor-pointer"
          tabIndex="0"
          onFocus={() => speak('Export schema option')}
          onClick={() => {
            closeMenu();
            handleExportTable();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              closeMenu();
              handleExportTable();
            }
          }}
        >
          <div className="col-auto" data-cy="export-schema-option-icon">
            <SolidIcon name="filedownload" width="14" viewBox="0 0 25 25" />
          </div>
          <div
            className="col text-truncate"
            data-cy="export-schema-option"
          >
            Export schema
          </div>
        </div>
        {/* <div className="row mt-3">
          <div className="col-auto">
            <CloneIcon />
          </div>
          <div className="col text-truncate">Duplicate</div>
        </div> */}
        <div
          className="row mt-3 cursor-pointer"
          tabIndex="0"
          onFocus={() => speak('Delete table option')}
          onClick={() => {
            closeMenu();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              closeMenu();
              onDelete();
            }
          }}
        >
          <div className="col-auto" data-cy="delete-table-option-icon">
            <DeleteIcon />
          </div>
          <div
            className="col text-truncate"
            data-cy="delete-table-option"
          >
            Delete table
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  const handleToggle = (nextShow) => {
    setShow(nextShow);
    onMenuToggle(nextShow);
  };

  const handleClick = (e) => {
    if (isOpening) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!show) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpening(true);
      speak('Opening table options menu');

      setTimeout(() => {
        setIsOpening(false);
        setShow(true);
      }, 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (isOpening) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!show) {
        setIsOpening(true);
        speak('Opening table options menu');

        setTimeout(() => {
          setIsOpening(false);
          setShow(true);
        }, 800);
      }
    }
  };

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      rootClose
      show={show}
      onToggle={handleToggle}
      overlay={popover}
    >
      <div
        className={cx(`float-right cursor-pointer table-list-item-popover`)}
        data-cy="table-kebab-icon"
        tabIndex="0"
        role="button"
        onFocus={() => speak('Table options menu')}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <Menu width="20" height="20" />
      </div>
    </OverlayTrigger>
  );
};
