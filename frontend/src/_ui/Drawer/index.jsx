import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import cx from 'classnames';
import useMountTransition from '@/_hooks/useMountTransition';
import { useEventListener } from '@/_hooks/use-event-listener';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import '@/_styles/drawer.scss';
import Toast from '@/_ui/Toast';

function createPortalRoot() {
  const drawerRoot = document.createElement('div');
  drawerRoot.setAttribute('id', 'tooljet-drawer-root');

  return drawerRoot;
}

const Drawer = ({
  isOpen,
  disableFocus = false,
  children,
  className,
  onClose,
  position = 'left',
  removeWhenClosed = true,
  drawerStyle,
  isForeignKeyRelation = false,
  initialFocusRef = null,
}) => {
  const bodyRef = useRef(document.querySelector('body'));
  const portalRootRef = useRef(document.getElementById('tooljet-drawer-root') || createPortalRoot());
  const isTransitioning = useMountTransition(isOpen, 300);
  const [focusTrapActive, setFocusTrapActive] = React.useState(false);

  // Append portal root on mount
  useEffect(() => {
    bodyRef.current.appendChild(portalRootRef.current);
  }, []);

  // Delay focus trap activation to allow initialFocusRef to be set
  useEffect(() => {
    if (isOpen) {
      // Delay activation to ensure refs are ready
      const timer = setTimeout(() => {
        setFocusTrapActive(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setFocusTrapActive(false);
    }
  }, [isOpen]);

  // Prevent page scrolling when the drawer is open
  useEffect(() => {
    const updatePageScroll = () => {
      if (isOpen) {
        bodyRef.current.style.overflow = 'hidden';
      } else {
        bodyRef.current.style.overflow = '';
      }
    };

    updatePageScroll();
  }, [isOpen]);

  if (!isTransitioning && removeWhenClosed && !isOpen) {
    return null;
  }

  const darkMode = localStorage.getItem('darkMode') === 'true';
  let toastOptions = {
    style: {
      wordBreak: 'break-all',
    },
  };

  if (darkMode) {
    toastOptions = {
      className: 'toast-dark-mode',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        wordBreak: 'break-all',
      },
    };
  }

  const isForeignKeyDrawer = isForeignKeyRelation ? 'foreignKeyDrawerRight' : '';
  const isForeignKeyBackdrop = isForeignKeyRelation ? 'foreignKeyBackdrop' : '';

  return createPortal(
    <ErrorBoundary showFallback={true}>
      <FocusTrap
        // The allowOutsideClick option is used to enable or disable clicks outside the popover for functions that are inside the popover but not within the focus trap. On the other hand, clickOutsideDeactivates is used to unfocus the last focused element which is outside the popover.
        focusTrapOptions={{
          initialFocus: initialFocusRef ? () => initialFocusRef.current : false,
          fallbackFocus: () => document.querySelector('.drawer'),
          allowOutsideClick: (e) => {
            // Allow clicks/focus on popovers and overlays that are rendered outside the drawer
            const target = e.target;
            return target.closest('.popover') ||
              target.closest('.create-table-list-items') ||
              target.closest('.overlay') ||
              target.closest('[role="tooltip"]');
          },
          clickOutsideDeactivates: false,
          escapeDeactivates: false, // Let the popover handle its own ESC key
          returnFocusOnDeactivate: false, // Don't return focus when drawer closes
          preventScroll: true, // Prevent scrolling when focusing elements
          checkCanFocusTrap: (trapContainers) => {
            // Wait for content to be ready before activating focus trap
            const results = trapContainers.map((trapContainer) => {
              return new Promise((resolve) => {
                const interval = setInterval(() => {
                  const tabbable = trapContainer.querySelectorAll(
                    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                  );
                  if (tabbable.length > 0) {
                    clearInterval(interval);
                    resolve();
                  }
                }, 50);
                // Timeout after 1 second
                setTimeout(() => {
                  clearInterval(interval);
                  resolve();
                }, 1000);
              });
            });
            return Promise.all(results);
          }
        }}
        active={focusTrapActive && !disableFocus}
      >
        <div
          aria-hidden={`${!isOpen}`}
          className={cx('drawer-container', {
            open: isOpen,
            in: isTransitioning,
            [className]: true,
            'theme-dark dark-theme': darkMode,
          })}
        >
          <Toast toastOptions={toastOptions} />
          <div className={cx('drawer', position, isForeignKeyDrawer)} role="dialog" style={drawerStyle}>
            {children}
          </div>
          <div className={cx('backdrop', isForeignKeyBackdrop)} onClick={onClose} />
        </div>
      </FocusTrap>
    </ErrorBoundary>,
    portalRootRef.current
  );
};

export default Drawer;
