import React, { forwardRef } from 'react';
import EnterIcon from './resources/images/enter-icon.svg';
import Spinner from './components/Spinner';
import './resources/styles/submit-button.styles.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';

const SubmitButton = forwardRef(({
  onClick = () => { },
  onFocus,
  disabled,
  buttonText,
  dataCy = (buttonText || 'Get started for free').toLowerCase().replace(/\s+/g, '-'),
  isLoading,
  darkMode,
  isSignUpButtonDisabled,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...rest
}, ref) => {
  const classes = cx('submit-button', {
    disabled: disabled,
    ...(className ? { [className]: true } : {}),
  });
  return (
    <div>
      <ButtonSolid
        ref={ref}
        type="submit"
        className={classes}
        onClick={onClick}
        onFocus={onFocus}
        disabled={disabled || isLoading}
        data-cy={`${dataCy}-button`}
        aria-label={ariaLabel || (buttonText || 'Get started for free')}
        aria-describedby={ariaDescribedBy}
        {...rest}
      >
        {isLoading ? (
          <div className="spinner-center">
            <Spinner />
          </div>
        ) : (
          <>
            <span className="button-text">{buttonText || 'Get started for free'}</span>
            <EnterIcon />
          </>
        )}
      </ButtonSolid>
    </div>
  );
});

export default SubmitButton;
