import React, { useState, forwardRef } from 'react';
import './resources/styles/password-input.styles.scss';
import EyeClose from './resources/images/eyeclose.svg';
import EyeOpen from './resources/images/eyeopen.svg';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PasswordInput = forwardRef(({
  label = 'Password',
  placeholder = 'Create a password',
  value,
  onChange,
  onKeyDown,
  onFocus,
  error,
  name = 'password',
  dataCy = 'password',
  minLength = 5,
  hint = `Password must be at least ${minLength} characters`,
  disabled = false,
  showForgotPassword = false,
  autoComplete,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  forgotPasswordRef,
  passwordToggleRef,
  onPasswordToggleFocus,
  onForgotPasswordFocus,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const passwordClasses = cx('password-input', {
    'password-input--error': error,
    disabled: disabled,
  });

  return (
    <div className={passwordClasses}>
      <div className="password-input__label-wrapper">
        <label htmlFor={name} className="password-input__label" data-cy={`${dataCy}-label`}>
          {label} <span className="password-input__required">*</span>
        </label>
        {showForgotPassword && (
          <Link
            ref={forgotPasswordRef}
            to="/forgot-password"
            className="forgot-password"
            data-cy="forgot-password-link"
            onFocus={onForgotPasswordFocus}
            aria-label="Forgot your password? Click here to reset it"
          >
            {t('loginSignupPage.forgot', 'Forgot?')}
          </Link>
        )}
      </div>
      <div className="password-input__field-wrapper">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className="password-input__field"
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          required
          minLength={minLength}
          data-cy={`${dataCy}-input`}
          autoComplete={autoComplete || "current-password"}
          aria-describedby={ariaDescribedBy || (error ? `${name}-error` : `${name}-hint`)}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
          {...rest}
        />
        <button
          ref={passwordToggleRef}
          type="button"
          className="password-input__toggle"
          onClick={togglePasswordVisibility}
          onFocus={onPasswordToggleFocus}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex="0"
        >
          <div className="toggle-icon">{showPassword ? <EyeOpen /> : <EyeClose />}</div>
        </button>
      </div>
      {error ? (
        <p
          id={`${name}-error`}
          className="tj-input-error password-input__error"
          data-cy={`${dataCy}-error`}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : (
        <p
          id={`${name}-hint`}
          className="password-input__hint"
          data-cy={`${dataCy}-hint`}
          aria-live="polite"
        >
          {hint}
        </p>
      )}
    </div>
  );
});

export default PasswordInput;
