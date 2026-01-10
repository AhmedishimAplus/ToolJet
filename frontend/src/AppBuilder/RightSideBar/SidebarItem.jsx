import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { forwardRef, useState } from 'react';
import Tooltip from 'react-bootstrap/Tooltip';
import Overlay from 'react-bootstrap/Overlay';
import { useTranslation } from 'react-i18next';
import { useScreenReader } from '@/modules/common/hooks';

// TODO: remove refs and related dependancies
export const SidebarItem = forwardRef(
  (
    {
      tip = '',
      selectedSidebarItem,
      className,
      icon,
      iconFill = 'var(--slate8)',
      text,
      onClick,
      iconWidth = 20,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { speak } = useScreenReader();
    const [showTooltip, setShowTooltip] = useState(false);
    const [target, setTarget] = useState(null);
    const tooltipTimerRef = React.useRef(null);

    let displayIcon = icon;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onClick) {
        onClick(e);
        speak(`${tip || text || icon} opened`);
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
        speak(`${tip} button`);
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
              className={`sidebar-svg-icon position-relative ${selectedSidebarItem && 'sidebar-item'}`}
              data-cy={`right-sidebar-${icon.toLowerCase()}-button`}
            >
              <SolidIcon name={displayIcon} width={iconWidth} fill={selectedSidebarItem ? '#3E63DD' : iconFill} />
            </div>
          )}
          <p></p>
        </div>

        <Overlay target={target} show={showTooltip} placement="left">
          {(props) => (
            <Tooltip id={`tooltip-${icon}`} {...props}>
              {tip}
            </Tooltip>
          )}
        </Overlay>
      </>
    );
  }
);
