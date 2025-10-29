import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef, useState } from 'react';
import Tooltip from 'react-bootstrap/Tooltip';
import Overlay from 'react-bootstrap/Overlay';
import { useTranslation } from 'react-i18next';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    {
      tip = '',
      selectedSidebarItem,
      className,
      icon,
      iconFill = 'var(--slate8)',
      commentBadge,
      text,
      onClick,
      badge = false,
      count,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [showTooltip, setShowTooltip] = useState(false);
    const [target, setTarget] = useState(null);
    const tooltipTimerRef = React.useRef(null);

    let displayIcon = icon;
    if (icon == 'page') displayIcon = 'file01';

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick(e);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          onClick(e);
        }
      }
    };

    const handleMouseEnter = (e) => {
      if (tip) {
        setTarget(e.currentTarget);
        // Add delay to prevent flashing
        tooltipTimerRef.current = setTimeout(() => {
          setShowTooltip(true);
        }, 500); // 500ms delay
      }
    };

    const handleMouseLeave = () => {
      // Clear timeout if mouse leaves before tooltip shows
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
      setShowTooltip(false);
    };

    const handleFocus = (e) => {
      if (tip) {
        setTarget(e.currentTarget);
        // Show immediately on keyboard focus for accessibility
        setShowTooltip(true);
      }
    };

    const handleBlur = () => {
      // Clear timeout on blur
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
      setShowTooltip(false);
    };

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (tooltipTimerRef.current) {
          clearTimeout(tooltipTimerRef.current);
        }
      };
    }, []);

    return (
      <>
        <div
          {...rest}
          className={className}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
          role="button"
          aria-label={tip || text || icon}
          ref={ref}
        >
          {icon && (
            <div
              className={`sidebar-svg-icon  position-relative ${selectedSidebarItem === icon && selectedSidebarItem != 'comments' && 'sidebar-item'
                }`}
              data-cy={`left-sidebar-${icon.toLowerCase()}-button`}
            >
              <SolidIcon
                name={displayIcon}
                width={icon == 'settings' ? 22.4 : 20}
                fill={selectedSidebarItem === icon ? '#3E63DD' : iconFill}
              />
              {commentBadge && <SidebarItem.CommentBadge />}
            </div>
          )}
          {badge && <SidebarItem.Badge count={count} />}
          <p>{text && t(`leftSidebar.${text}.text`, text)}</p>
        </div>
        {tip && (
          <Overlay target={target} show={showTooltip} placement="right">
            {(props) => (
              <Tooltip id="button-tooltip" {...props}>
                {t(`leftSidebar.${tip}.tip`, tip)}
              </Tooltip>
            )}
          </Overlay>
        )}
      </>
    );
  }
);

function CommentBadge() {
  return (
    <svg
      className="comment-badge"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="5" r="5" fill="#FF6666" />
    </svg>
  );
}

function NotificationBadge({ count }) {
  const fontSize = count > 999 ? '7.5px' : '8.5px';
  return (
    <>
      {count > 0 && (
        <span className="badge bg-red rounded-circle debugger-badge p-0" style={{ fontSize: fontSize }}>
          {count > 999 ? `999+` : count}
        </span>
      )}
    </>
  );
}

SidebarItem.CommentBadge = CommentBadge;
SidebarItem.Badge = NotificationBadge;
