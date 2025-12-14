import React, { forwardRef } from 'react';
import './AppButton.scss';
import SolidIcon from '../Icon/solidIcons/index';
import { Spinner } from 'react-bootstrap';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const ButtonBase = forwardRef(function ButtonBase(props, ref) {
  const { speak } = useScreenReader();
  const mapBaseSize = {
    lg: 'tj-large-btn',
    md: 'tj-medium-btn',
    sm: 'tj-small-btn',
    xs: 'tj-extra-small-btn',
  };

  const {
    className,
    size = 'lg', // specify size otherwise large button dimesnions will be applied with min width
    as = 'button', // render it as a button or an anchor.
    children,
    disabled,
    leftIcon,
    rightIcon,
    backgroundColor,
    type,
    isLoading,
    fill,
    iconCustomClass,
    iconWidth,
    customStyles = {},
    iconViewBox,
    ...restProps
  } = props;

  const isAnchor = (!!restProps.href || as === 'a') && !disabled;
  const Element = as ? as : isAnchor ? 'a' : 'button';

  // Helper function to extract text content from children
  const getTextFromChildren = (children) => {
    if (typeof children === 'string') {
      return children;
    }
    if (typeof children === 'number') {
      return String(children);
    }
    if (React.isValidElement(children) && children.props.children) {
      return getTextFromChildren(children.props.children);
    }
    if (Array.isArray(children)) {
      return children.map(getTextFromChildren).join(' ');
    }
    return '';
  };

  const handleFocus = (e) => {
    const buttonText = getTextFromChildren(children) || restProps['aria-label'] || restProps.title || 'button';
    // Avoid saying "button button" for icon-only buttons
    const announcement = buttonText.toLowerCase() === 'button' ? buttonText : `${buttonText} button`;
    speak(announcement);
    if (restProps.onFocus) {
      restProps.onFocus(e);
    }
  };

  return (
    <Element
      {...restProps}
      ref={ref}
      className={`tj-base-btn ${mapBaseSize[size]}  ${className}`}
      disabled={disabled}
      style={
        ({
          backgroundColor: backgroundColor && backgroundColor,
        },
          { ...restProps.style, ...customStyles })
      }
      type={isAnchor ? undefined : type || 'button'}
      onFocus={handleFocus}
    >
      {!isLoading && leftIcon && (
        <span className="tj-btn-left-icon">
          {
            <SolidIcon
              fill={fill}
              className={iconCustomClass}
              name={leftIcon}
              width={iconWidth}
              viewBox={iconViewBox}
            />
          }
        </span>
      )}
      {isLoading ? (
        <div className="spinner">
          <Spinner />
        </div>
      ) : (
        children
      )}
      {!isLoading && rightIcon && (
        <span className="tj-btn-right-icon">
          {<SolidIcon className={iconCustomClass} fill={fill} name={rightIcon} width={iconWidth} />}
        </span>
      )}
    </Element>
  );
});

export const ButtonSolid = forwardRef(function ButtonSolid(props, ref) {
  const mapVariant = {
    primary: 'tj-primary-btn',
    ghostBlue: 'tj-ghost-blue-btn',
    ghostBlack: 'tj-ghost-black-btn',
    secondary: 'tj-secondary-btn',
    tertiary: 'tj-tertiary-btn',
    dangerPrimary: 'tj-primary-danger-btn',
    dangerSecondary: 'tj-secondary-danger-btn',
    dangerTertiary: 'tj-tertiary-danger-btn',
    dangerGhost: 'tj-ghost-danger-btn',
    zBlack: 'tj-zBlack-btn',
  };

  const { variant = 'primary', className, ...restProps } = props;
  return <ButtonBase {...restProps} ref={ref} className={`${mapVariant[variant]} ${className && className}`} />;
});
