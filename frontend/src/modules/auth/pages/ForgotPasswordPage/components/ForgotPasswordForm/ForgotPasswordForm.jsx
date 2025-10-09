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

  // Focus management - auto focus first element on mount
  useEffect(() => {
    setIsNavigationMode(true);
    setCurrentFocusIndex(0);

    setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0 && focusableElements[0]) {
        focusableElements[0].focus();
        // Don't announce here since the screen reader effect will handle it
      }
    }, 100);
  }, []);

  // Get all focusable elements in order
  const getFocusableElements = () => {
    const elements = [];

    // Follow the visual order: signup link first, then form elements
    if (signupLinkRef.current) elements.push(signupLinkRef.current);
    if (emailInputRef.current) elements.push(emailInputRef.current);
    if (submitButtonRef.current) elements.push(submitButtonRef.current);

    return elements.filter(el => el && !el.disabled);
  };

  const handleArrowKeyNavigation = (direction) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    let newIndex = currentFocusIndex;

    if (direction === 'down') {
      newIndex = currentFocusIndex < focusableElements.length - 1 ? currentFocusIndex + 1 : 0;
    } else if (direction === 'up') {
      newIndex = currentFocusIndex > 0 ? currentFocusIndex - 1 : focusableElements.length - 1;
    }

    setCurrentFocusIndex(newIndex);

    const targetElement = focusableElements[newIndex];
    if (targetElement) {
      targetElement.focus();
      setIsNavigationMode(true);
    }
  };

  const handleEnterActivation = () => {
    const focusableElements = getFocusableElements();
    const currentElement = focusableElements[currentFocusIndex];

    if (currentElement) {
      if (currentElement.tagName === 'BUTTON') {
        currentElement.click();
      } else if (currentElement.tagName === 'A') {
        currentElement.click();
      } else if (currentElement.tagName === 'INPUT') {
        // For input fields, just ensure they're focused for typing
        currentElement.focus();
      }
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

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F1 key to activate navigation mode
      if (e.key === 'F1') {
        e.preventDefault();
        setIsNavigationMode(true);
        setCurrentFocusIndex(0);
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
        return;
      }

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const direction = e.key === 'ArrowDown' ? 'down' : 'up';
        handleArrowKeyNavigation(direction);
        return;
      }

      // Enter key activation
      if (e.key === 'Enter' && isNavigationMode) {
        e.preventDefault();
        handleEnterActivation();
        return;
      }

      // Escape to exit navigation mode
      if (e.key === 'Escape') {
        setIsNavigationMode(false);
        return;
      }
    };

    const handleClick = () => {
      // Re-activate navigation on click
      setIsNavigationMode(true);
    };

    // Add event listeners with capture to ensure they work globally
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [currentFocusIndex, isNavigationMode]);

  // Screen reader support
  useEffect(() => {
    if (isNavigationMode) {
      const focusableElements = getFocusableElements();
      const announcement = `Keyboard navigation active. ${focusableElements.length} elements available. Use arrow keys to navigate, Enter to activate, F1 to restart navigation, or Escape to exit.`;

      // Create a temporary screen reader announcement
      const srAnnouncement = document.createElement('div');
      srAnnouncement.setAttribute('aria-live', 'assertive');
      srAnnouncement.setAttribute('aria-atomic', 'true');
      srAnnouncement.className = 'sr-only';
      srAnnouncement.textContent = announcement;
      document.body.appendChild(srAnnouncement);

      setTimeout(() => {
        document.body.removeChild(srAnnouncement);
      }, 1000);
    }
  }, [isNavigationMode]);

  const handleElementFocus = (elementType) => {
    const focusableElements = getFocusableElements();
    const elementMap = {
      'signup-link': signupLinkRef.current,
      'email-input': emailInputRef.current,
      'submit-button': submitButtonRef.current,
    };

    const targetElement = elementMap[elementType];
    if (targetElement) {
      const newIndex = focusableElements.indexOf(targetElement);
      if (newIndex !== -1) {
        setCurrentFocusIndex(newIndex);
        setIsNavigationMode(true);
      }
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
