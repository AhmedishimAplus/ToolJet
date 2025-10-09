import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormTextInput, SubmitButton, FormHeader } from '@/modules/common/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import './resources/styles/forgot-password-form.styles.scss';
import { Alert } from '@/_ui/Alert';
import SepratorComponent from '@/modules/common/components/SepratorComponent';
import { fetchEdition } from '@/modules/common/helpers/utils';
const ForgotPasswordForm = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);

  // Arrow key navigation state
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(true);

  // Refs for navigation
  const emailInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const signupLinkRef = useRef(null);

  const whiteLabelText = retrieveWhiteLabelText();
  const edition = fetchEdition();
  const adminUser = edition === 'cloud' ? 'admin' : 'super admin';

  // Focus management - auto focus email field on mount
  useEffect(() => {
    setIsNavigationMode(true);
    setCurrentFocusIndex(0);

    setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0 && focusableElements[0]?.ref?.current) {
        focusableElements[0].ref.current.focus();
        announceToScreenReader('Arrow key navigation active. Use arrow keys to navigate, Enter to activate.');
      }
    }, 100);
  }, []);

  // Get all focusable elements in order
  const getFocusableElements = () => {
    const elements = [];

    if (emailInputRef.current) elements.push({ ref: emailInputRef, type: 'input', name: 'email' });
    if (submitButtonRef.current) elements.push({ ref: submitButtonRef, type: 'button', name: 'send reset link' });
    if (signupLinkRef.current) elements.push({ ref: signupLinkRef, type: 'link', name: 'create account' });

    return elements;
  };

  // Arrow key navigation handler
  const handleArrowKeyNavigation = (e) => {
    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    let newIndex = currentFocusIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (currentFocusIndex + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentFocusIndex === 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
        break;
      case 'Enter':
        e.preventDefault();
        const currentElement = focusableElements[currentFocusIndex];
        handleEnterActivation(currentElement);
        return;
      case 'Escape':
        e.preventDefault();
        setIsNavigationMode(true);
        announceToScreenReader('Navigation mode activated. Use arrow keys to move between elements, Enter to activate.');
        return;
      default:
        return;
    }

    setCurrentFocusIndex(newIndex);
    const targetElement = focusableElements[newIndex];

    if (targetElement?.ref?.current) {
      targetElement.ref.current.focus();
      announceToScreenReader(`Focused on ${targetElement.name} ${targetElement.type}`);
    }
  };

  // Handle Enter key activation
  const handleEnterActivation = (element) => {
    if (!element?.ref?.current) return;

    const { type, name } = element;

    switch (type) {
      case 'input':
        setIsNavigationMode(false);
        announceToScreenReader(`Editing ${name} field. Press Escape to return to navigation mode.`);
        break;
      case 'button':
        handleSubmit({ preventDefault: () => { } });
        announceToScreenReader(`${name} activated`);
        break;
      case 'link':
        element.ref.current.click();
        announceToScreenReader(`${name} link activated`);
        break;
    }
  };

  // Screen reader announcements
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInForm = e.target.closest('.forgot-password-form') ||
        document.activeElement === document.body ||
        document.activeElement.tagName === 'BODY';

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
        handleArrowKeyNavigation(e);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [currentFocusIndex, isNavigationMode]);

  // F1 activation shortcut
  useEffect(() => {
    const handleGlobalActivation = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsNavigationMode(true);
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          setCurrentFocusIndex(0);
          focusableElements[0].ref.current?.focus();
          announceToScreenReader('Arrow key navigation activated. Use arrow keys to navigate, Enter to activate.');
        }
      }
    };

    document.addEventListener('keydown', handleGlobalActivation);
    return () => document.removeEventListener('keydown', handleGlobalActivation);
  }, []);

  // Handle input focus
  const handleInputFocus = (fieldName) => {
    const focusableElements = getFocusableElements();
    const index = focusableElements.findIndex(el => el.name === fieldName);
    if (index !== -1) {
      setCurrentFocusIndex(index);
    }
  };

  useEffect(() => {
    setIsFormValid(validateEmail(email));
    const emailError =
      !isDefaultFormEmail && (email.trim() ? (validateEmail(email) ? '' : 'Email is invalid') : 'Email is required');
    setEmailError(emailError === '' ? '' : emailError);
  }, [email]);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setisDefaultFormEmail(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError(t('forgotPasswordPage.invalidEmail', 'Invalid Email'));
      return;
    }
    setIsLoading(true);
    await onSubmit(email);
    setIsLoading(false);
  };

  return (
    <OnboardingUIWrapper>
      <OnboardingFormInsideWrapper>
        <div className="forgot-password-form">
          {/* Navigation Status Indicator */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isNavigationMode && `Navigation active. Use arrow keys to move between form elements. Current position: ${currentFocusIndex + 1} of ${getFocusableElements().length}. Press Enter to activate selected element or F1 to start navigation.`}
          </div>

          <FormHeader>{t('forgotPasswordPage.forgotPassword', 'Forgot Password')}</FormHeader>
          <p className="forgot-password-form-signup-redirect" data-cy="signup-redirect-text">
            {t('forgotPasswordPage.newTo', 'New to')} {whiteLabelText}?{' '}
            <Link
              ref={signupLinkRef}
              to="/signup"
              className="signup-link"
              data-cy="create-an-account-link"
              state={{ from: '/forgot-password' }}
              onFocus={() => handleElementFocus('signup-link')}
            >
              {t('forgotPasswordPage.createAnAccount', 'Create an account')}
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="form-input-area">
            <FormTextInput
              ref={emailInputRef}
              type="email"
              label={t('forgotPasswordPage.emailAddress', 'Email address')}
              placeholder={t('forgotPasswordPage.enterEmailAddress', 'Enter email address')}
              onChange={handleInputChange}
              value={email}
              name="email"
              error={emailError}
              dataCy="email-input-field"
              onFocus={() => handleElementFocus('email-input')}
            />
            <SubmitButton
              ref={submitButtonRef}
              buttonText={t('forgotPasswordPage.sendResetLink', 'Send a reset link')}
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
              onFocus={() => handleElementFocus('submit-button')}
            />
          </form>
          <SepratorComponent />
          <Alert
            svg="tj-info"
            cls="reset-password-info-banner justify-content-center"
            useDarkMode={false}
            imgHeight={'25px'}
            imgWidth={'25px'}
          >
            <div className="reset-password-info-text" data-cy="reset-password-info-banner">
              {`Contact ${adminUser} to reset your password`}
            </div>
          </Alert>
        </div>
      </OnboardingFormInsideWrapper>
    </OnboardingUIWrapper>
  );
};

export default ForgotPasswordForm;
