import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormTextInput, SubmitButton, FormHeader } from '@/modules/common/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import useScreenReader from '@/modules/common/hooks/useScreenReader';
import './resources/styles/forgot-password-form.styles.scss';
import '../../../LoginPage/components/LoginForm/resources/styles/accessibility.scss';
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

  // Web Speech API for screen reader
  const { speak, announceFocus, announceError, announceNavigationMode } = useScreenReader();

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
      if (focusableElements.length > 0 && focusableElements[0]?.ref?.current) {
        focusableElements[0].ref.current.focus();
        announceToScreenReader('Arrow key navigation active. Use arrow keys to navigate, Enter to activate.');
        speak('Arrow key navigation active. Use arrow keys to navigate, Enter to activate.');
      }
    }, 100);
  }, []);

  // Re-activate navigation when clicking outside and then back into form
  useEffect(() => {
    const handleFormClick = (e) => {
      if (e.target.closest('.forgot-password-form')) {
        setIsNavigationMode(true);
        const focusableElements = getFocusableElements();

        // Find the clicked element in our navigation list
        let clickedIndex = -1;
        focusableElements.forEach((element, index) => {
          if (element.ref.current === e.target || element.ref.current?.contains(e.target)) {
            clickedIndex = index;
          }
        });

        if (clickedIndex !== -1) {
          setCurrentFocusIndex(clickedIndex);
        }
      }
    };

    document.addEventListener('click', handleFormClick);
    return () => document.removeEventListener('click', handleFormClick);
  }, []);

  // Get all focusable elements in order
  const getFocusableElements = () => {
    const elements = [];

    // Follow the visual order: signup link first, then form elements
    if (signupLinkRef.current) elements.push({ ref: signupLinkRef, type: 'link', name: 'sign up' });
    if (emailInputRef.current) elements.push({ ref: emailInputRef, type: 'input', name: 'email' });
    if (submitButtonRef.current) elements.push({ ref: submitButtonRef, type: 'button', name: 'send reset link' });

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
        announceNavigationMode(true);
        return;
      default:
        return;
    }

    setCurrentFocusIndex(newIndex);
    const targetElement = focusableElements[newIndex];

    if (targetElement?.ref?.current) {
      targetElement.ref.current.focus();
      announceToScreenReader(`Focused on ${targetElement.name} ${targetElement.type}`);
      announceFocus(targetElement.name, targetElement.type);
    }
  };  // Handle Enter key activation
  const handleEnterActivation = (element) => {
    if (!element?.ref?.current) return;

    const { type, name } = element;

    switch (type) {
      case 'input':
        setIsNavigationMode(false);
        announceToScreenReader(`Editing ${name} field. Press Escape to return to navigation mode.`);
        speak(`Editing ${name} field. Press Escape to return to navigation mode.`);
        break;
      case 'button':
        if (name === 'send reset link') {
          // Check if button is disabled before clicking
          if (!element.ref.current.disabled) {
            // Announce THEN wait before clicking
            announceToScreenReader(`${name} activated`);
            speak(`${name} button activated`);
            setTimeout(() => {
              element.ref.current.click();
            }, 1200);
          } else {
            announceToScreenReader('Button is disabled and cannot be activated');
            speak('Button is disabled and cannot be activated');
          }
        } else {
          // Announce THEN wait before clicking
          announceToScreenReader(`${name} activated`);
          speak(`${name} button activated`);
          setTimeout(() => {
            element.ref.current.click();
          }, 1200);
        }
        break;
      case 'link':
        // Announce THEN wait before navigating
        announceToScreenReader(`${name} link activated`);
        speak(`Navigating to ${name}`);
        setTimeout(() => {
          element.ref.current.click();
        }, 1200);
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
      // Always allow arrow key navigation when on the forgot password page
      // Check if we're in the form area or if no other input is focused
      const isInForm = e.target.closest('.forgot-password-form') ||
        document.activeElement === document.body ||
        document.activeElement.tagName === 'BODY';

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
        // Always handle navigation keys for accessibility
        handleArrowKeyNavigation(e);
      }
    };

    // Use capture phase to ensure we catch all events
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [currentFocusIndex, isNavigationMode]);

  // Add global activation shortcut
  useEffect(() => {
    const handleGlobalActivation = (e) => {
      // Press F1 to activate arrow key navigation from anywhere on the page
      if (e.key === 'F1') {
        e.preventDefault();
        setIsNavigationMode(true);
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          setCurrentFocusIndex(0);
          focusableElements[0].ref.current?.focus();
          announceToScreenReader('Arrow key navigation activated. Use arrow keys to navigate, Enter to activate.');
          speak('Arrow key navigation activated. Use arrow keys to navigate, Enter to activate.');
        }
      }
    };

    document.addEventListener('keydown', handleGlobalActivation);
    return () => document.removeEventListener('keydown', handleGlobalActivation);
  }, []);

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

  // Handle input field focus
  const handleInputFocus = (fieldName) => {
    const focusableElements = getFocusableElements();
    const index = focusableElements.findIndex(el => el.name === fieldName);
    if (index !== -1) {
      setCurrentFocusIndex(index);
    }

    // Announce what element is focused
    const element = focusableElements.find(el => el.name === fieldName);
    if (element) {
      speak(`${fieldName} ${element.type}`);
    }
  };

  const handleElementFocus = (elementType) => {
    const focusableElements = getFocusableElements();
    const index = focusableElements.findIndex(el => el.name === elementType);
    if (index !== -1) {
      setCurrentFocusIndex(index);
      setIsNavigationMode(true);
    }
  }; useEffect(() => {
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
      announceError('Invalid Email');
      return;
    }
    setIsLoading(true);
    speak('Sending reset link, please wait...');
    await onSubmit(email);
    setIsLoading(false);
  };

  return (
    <div className="forgot-password-form" data-navigation-mode={isNavigationMode ? 'true' : 'false'}>
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          <div className="keyboard-navigation-instructions" role="banner" aria-live="polite">
            <p className="sr-only">
              Keyboard navigation: Use arrow keys to move between elements, Enter to activate or edit, Escape to exit edit mode. Press F1 to activate navigation from anywhere.
            </p>
            {isNavigationMode && (
              <div className="navigation-status" aria-live="polite">
                <small>🎯 Arrow key navigation active - Use ↑↓←→ to navigate, Enter to activate</small>
              </div>
            )}
          </div>

          <FormHeader role="heading" aria-level="1">
            {t('forgotPasswordPage.forgotPassword', 'Forgot Password')}
          </FormHeader>
          <p className="forgot-password-form-signup-redirect" data-cy="signup-redirect-text" role="banner">
            {t('forgotPasswordPage.newTo', 'New to')} {whiteLabelText}?{' '}
            <Link
              ref={signupLinkRef}
              to="/signup"
              className="signup-link"
              data-cy="create-an-account-link"
              state={{ from: '/forgot-password' }}
              onFocus={() => handleInputFocus('sign up')}
              aria-label={`New to ${whiteLabelText}? Create an account`}
            >
              {t('forgotPasswordPage.createAnAccount', 'Create an account')}
            </Link>
          </p>
          <form
            onSubmit={handleSubmit}
            className="form-input-area"
            role="form"
            aria-label="Forgot password form"
            noValidate
          >
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
              onFocus={() => handleInputFocus('email')}
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={!!emailError}
              aria-required="true"
              autoComplete="email"
              data-navigation-hint="Use arrow keys to navigate, Enter to edit, Escape to exit edit mode"
            />
            <SubmitButton
              ref={submitButtonRef}
              buttonText={t('forgotPasswordPage.sendResetLink', 'Send a reset link')}
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
              onFocus={() => handleInputFocus('send reset link')}
              aria-label={isLoading ? 'Sending reset link, please wait' : 'Send password reset link'}
              aria-describedby={!isFormValid ? 'form-validation-info' : undefined}
            />
            {!isFormValid && (
              <div id="form-validation-info" className="sr-only" aria-live="polite">
                Please enter a valid email address to send password reset link
              </div>
            )}
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
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default ForgotPasswordForm;
