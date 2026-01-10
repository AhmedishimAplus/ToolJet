import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useStore from '@/AppBuilder/_stores/store';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const HeaderActions = function HeaderActions({ darkMode, showFullWidth }) {
  const { speak } = useScreenReader();
  const desktopButtonRef = useRef(null);
  const mobileButtonRef = useRef(null);
  const {
    currentLayout,
    canUndo,
    canRedo,
    toggleCurrentLayout,
    handleUndo,
    handleRedo,
    showToggleLayoutBtn,
    showUndoRedoBtn,
    clearSelectedComponents,
  } = useStore(
    (state) => ({
      currentLayout: state.currentLayout,
      canUndo: state.canUndo && !(state.isEditorFreezed || state.isVersionReleased),
      canRedo: state.canRedo && !(state.isEditorFreezed || state.isVersionReleased),
      toggleCurrentLayout: state.toggleCurrentLayout,
      showToggleLayoutBtn: state.showToggleLayoutBtn,
      showUndoRedoBtn: state.showUndoRedoBtn,
      handleUndo: state.handleUndo,
      handleRedo: state.handleRedo,
      clearSelectedComponents: state.clearSelectedComponents,
    }),
    shallow
  );
  const clearSelectionBorder = useCallback(() => {
    clearSelectedComponents();
    const selectedElems = document.getElementsByClassName('active-target');
    for (const element of selectedElems) {
      element.classList.remove('active-target');
    }
  }, []);

  // Handle arrow key navigation between view mode buttons
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === desktopButtonRef.current || document.activeElement === mobileButtonRef.current) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          if (document.activeElement === desktopButtonRef.current) {
            mobileButtonRef.current?.focus();
          } else {
            desktopButtonRef.current?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  return (
    <div className={cx('editor-header-actions', { 'w-100': showFullWidth })} data-cy="header-actions">
      {showToggleLayoutBtn && (
        <div
          style={{
            borderRadius: 6,
            ...(currentLayout === 'mobile' && {
              width: '100%',
            }),
          }}
          className={cx({ 'w-100': showFullWidth })}
          data-cy="layout-toggle-container"
        >
          <div
            className="d-flex align-items-center p-1 current-layout"
            style={{
              height: 28,
              background: darkMode ? '#202425' : '#F1F3F5',
              borderRadius: 6,
            }}
            role="tablist"
            aria-orientation="horizontal"
            data-cy="layout-toggle-buttons"
          >
            <button
              ref={desktopButtonRef}
              className={cx('btn border-0 p-1', {
                'bg-transparent': currentLayout !== 'desktop',
                'bg-white opacity-100': currentLayout === 'desktop',
                'w-100': showFullWidth,
                'flex-grow-1': currentLayout === 'mobile',
              })}
              style={{ height: 20 }}
              role="tab"
              type="button"
              aria-selected={currentLayout === 'desktop'}
              aria-label="Switch to desktop layout"
              tabIndex="0"
              onClick={() => {
                toggleCurrentLayout('desktop');
                clearSelectionBorder();
                speak('Desktop view is active');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCurrentLayout('desktop');
                  clearSelectionBorder();
                  speak('Desktop view is active');
                }
              }}
              onFocus={() => speak(`Desktop view ${currentLayout === 'desktop' ? 'currently active' : 'currently not active'}`)}
              data-cy={`button-change-layout-to-desktop`}
            >
              <SolidIcon
                name="computer"
                width="14"
                fill={currentLayout === 'desktop' ? 'var(--slate12)' : 'var(--slate8)'}
              />
            </button>
            <button
              ref={mobileButtonRef}
              className={cx('btn border-0 p-1', {
                'bg-transparent': currentLayout !== 'mobile',
                'bg-white opacity-100': currentLayout === 'mobile',
                'w-100': showFullWidth,
                'flex-grow-1': currentLayout === 'mobile',
              })}
              role="tab"
              type="button"
              style={{ height: 20 }}
              aria-selected={currentLayout === 'mobile'}
              aria-label="Switch to mobile layout"
              tabIndex="0"
              onClick={() => {
                toggleCurrentLayout('mobile');
                clearSelectionBorder();
                speak('Mobile view is active');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCurrentLayout('mobile');
                  clearSelectionBorder();
                  speak('Mobile view is active');
                }
              }}
              onFocus={() => speak(`Mobile view ${currentLayout === 'mobile' ? 'currently active' : 'currently not active'}`)}
              data-cy={`button-change-layout-to-mobile`}
            >
              <SolidIcon
                name="mobile"
                width="14"
                fill={currentLayout !== 'desktop' ? 'var(--slate12)' : 'var(--slate8)'}
              />
            </button>
          </div>
        </div>
      )}
      {showUndoRedoBtn && (
        <div className="undo-redo-container" data-cy="undo-redo-container">
          <button
            onClick={() => {
              handleUndo();
              speak('Undone');
            }}
            onFocus={() => speak('Undo')}
            className="tj-ghost-black-btn"
            data-tooltip-id="tooltip-for-undo"
            data-tooltip-content="Undo"
            data-cy={`editor-undo-button`}
            aria-label="Undo"
          >
            <SolidIcon
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill={darkMode ? '#fff' : '#2c3e50'}
              name="arrowforwardup"
              className={cx('cursor-pointer', {
                disabled: !canUndo,
              })}
              data-cy="undo-icon"
            />
          </button>
          <button
            onClick={() => {
              handleRedo();
              speak('Redone');
            }}
            onFocus={() => speak('Redo')}
            className="tj-ghost-black-btn"
            data-tooltip-id="tooltip-for-redo"
            data-tooltip-content="Redo"
            data-cy={`editor-redo-button`}
            aria-label="Redo"
          >
            <SolidIcon
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill={darkMode ? '#fff' : '#2c3e50'}
              name="arrowbackup"
              className={cx('cursor-pointer', {
                disabled: !canRedo,
              })}
              data-cy="redo-icon"
            />
          </button>
        </div>
      )}
      <Tooltip id="tooltip-for-undo" className="tooltip" data-cy="undo-tooltip" />
      <Tooltip id="tooltip-for-redo" className="tooltip" data-cy="redo-tooltip" />
    </div>
  );
};

export default HeaderActions;
