import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail, validatePassword } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import {
  FormTextInput,
  PasswordInput,
  SubmitButton,
  FormHeader,
  SSOAuthModule,
  TermsAndPrivacyInfo,
} from '@/modules/common/components';
import SignupStatusCard from './components/SignupStatusCard';
import useScreenReader from '@/modules/common/hooks/useScreenReader';
import './resources/styles/sign-up-form.styles.scss';
import SepratorComponent from '@/modules/common/components/SepratorComponent';
import { checkWhiteLabelsDefaultState } from '@white-label/whiteLabelling';

const SignupForm = ({
  configs,
  organizationId,
  paramOrganizationSlug,
  organizationToken,
  inviteeEmail,
  redirectTo,
  onSubmit,
  setSignupOrganizationDetails,
  initialData,
}) => {
  const defaultState = checkWhiteLabelsDefaultState();
  const { t } = useTranslation();

  // Web Speech API for screen reader
  const { speak, announceFocus, announceError, announceNavigationMode } = useScreenReader();

  // Navigation state for arrow key navigation
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);

  // Refs for navigation
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const passwordToggleRef = useRef(null);
  const submitButtonRef = useRef(null);
  const signinLinkRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormName, setisDefaultFormName] = useState(true);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);
  const [isDefaultFormPassword, setisDefaultFormPassword] = useState(true);
  const isAnySSOEnabled =
    configs?.google?.enabled ||
    configs?.git?.enabled ||
    configs?.ldap?.enabled ||
    configs?.saml?.enabled ||
    configs?.openid?.enabled;

  const isFormSignUpEnabled = organizationId ? configs?.form?.enabled : configs?.form?.enable_sign_up;
  const shouldShowSignInCTA = !organizationToken;
  const comingFromInviteFlow = !!organizationToken;
  const shouldShowSignupDisabledCard = !organizationToken && !configs?.enable_sign_up && !configs?.form?.enable_sign_up;
  const signUpDisabledText = `Signup has been disabled by your ${organizationId ? 'workspace' : 'super'} admin.`;
  const defaultfieldStateSetters = {
    name: setisDefaultFormName,
    email: setisDefaultFormEmail,
    password: setisDefaultFormPassword,
  };

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, password: '' });
    }
    if (inviteeEmail) {
      setFormData((prev) => ({ ...prev, email: inviteeEmail }));
    }
  }, [initialData, inviteeEmail]);

  const checkFormValidity = () => {
    const isValid =
      formData.email.trim() !== '' &&
      validateEmail(formData.email) &&
      formData.password.trim() !== '' &&
      formData.password.length >= 5 &&
      (comingFromInviteFlow || formData.name.trim() !== '');
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (defaultfieldStateSetters[name]) {
      defaultfieldStateSetters[name](false);
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'email':
        return value.trim() ? (validateEmail(value) ? '' : 'Email is invalid') : 'Email is required';
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };
  const formInputFields = {
    name: isDefaultFormName,
    email: isDefaultFormEmail,
    password: isDefaultFormPassword,
  };
  useEffect(() => {
    const newErrors = {};
    let fieldsValid = true;
    Object.keys(formData).forEach((fieldName) => {
      // only if the field is edited by the user -- after that we show validation error message
      const fieldError = !formInputFields[fieldName] && validateField(fieldName, formData[fieldName]);
      newErrors[fieldName] = fieldError;
      if (fieldError) fieldsValid = false;
    });
    setErrors(newErrors);
    // form validity -> used for checking all the validation checks in the form
    const isFormValid = fieldsValid && checkFormValidity();
    setIsFormValid(isFormValid);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    speak('Signing up, please wait...');
    if (validateForm()) {
      onSubmit(
        formData,
        () => {
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
          announceError('Sign up failed, please check your information and try again');
        }
      );
    } else {
      setIsLoading(false);
      announceError('Please fill in all required fields correctly');
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!comingFromInviteFlow && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters long';
    }
    if (formData.password.length > 100) {
      newErrors.password = 'Password can be at max 100 characters long';
    }
    setErrors(newErrors);

    // Announce validation errors
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.values(newErrors).join(', ');
      announceError(errorMessages);
    }

    return Object.keys(newErrors).length === 0;
  };

  // Navigation helper functions
  const getFocusableElements = () => {
    const elements = [];

    // Add form elements in order
    if (!comingFromInviteFlow && nameInputRef.current) {
      elements.push(nameInputRef.current);
    }
    if (emailInputRef.current) {
      elements.push(emailInputRef.current);
    }
    if (passwordInputRef.current) {
      elements.push(passwordInputRef.current);
    }
    if (passwordToggleRef.current) {
      elements.push(passwordToggleRef.current);
    }
    if (submitButtonRef.current) {
      elements.push(submitButtonRef.current);
    }
    // Only include signin link if it's actually rendered
    if (shouldShowSignInCTA && signinLinkRef.current) {
      elements.push(signinLinkRef.current);
    }

    return elements.filter(el => el && !el.disabled);
  };

  const handleArrowKeyNavigation = (direction) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    let newIndex = currentFocusIndex;

    if (direction === 'down' || direction === 'right') {
      newIndex = currentFocusIndex < focusableElements.length - 1 ? currentFocusIndex + 1 : 0;
    } else if (direction === 'up' || direction === 'left') {
      newIndex = currentFocusIndex > 0 ? currentFocusIndex - 1 : focusableElements.length - 1;
    }

    setCurrentFocusIndex(newIndex);

    const targetElement = focusableElements[newIndex];
    if (targetElement) {
      targetElement.focus();
      setIsNavigationMode(true);

      // Announce the focused element
      const elementName = getElementName(targetElement);
      const elementType = getElementType(targetElement);
      announceFocus(elementName, elementType);
    }
  };

  // Helper function to get element name
  const getElementName = (element) => {
    if (element === nameInputRef.current) return 'name';
    if (element === emailInputRef.current) return 'email';
    if (element === passwordInputRef.current) return 'password';
    if (element === passwordToggleRef.current) return 'toggle password visibility';
    if (element === submitButtonRef.current) return 'sign up';
    if (element === signinLinkRef.current) return 'sign in';
    return 'element';
  };

  // Helper function to get element type
  const getElementType = (element) => {
    if (element.tagName === 'INPUT') return 'input';
    if (element.tagName === 'BUTTON') return 'button';
    if (element.tagName === 'A') return 'link';
    return 'element';
  };

  const handleEnterActivation = () => {
    const focusableElements = getFocusableElements();
    const currentElement = focusableElements[currentFocusIndex];

    if (currentElement) {
      if (currentElement.tagName === 'BUTTON') {
        // Announce THEN wait before clicking
        const elementName = getElementName(currentElement);
        speak(`${elementName} button activated`);

        // Use longer delay for sign up button
        const delay = elementName === 'sign up' ? 2000 : 1200;

        setTimeout(() => {
          currentElement.click();
        }, delay);
      } else if (currentElement.tagName === 'A') {
        // Announce THEN wait before navigating
        speak(`Navigating to ${getElementName(currentElement)}`);
        setTimeout(() => {
          currentElement.click();
        }, 1200);
      } else if (currentElement.tagName === 'INPUT') {
        // For input fields, just ensure they're focused for typing
        currentElement.focus();
        setIsNavigationMode(false);
        speak(`Editing ${getElementName(currentElement)} field. Press Escape to return to navigation mode.`);
      }
    }
  };

  const handleElementFocus = (elementType) => {
    const focusableElements = getFocusableElements();
    const elementMap = {
      'name-input': nameInputRef.current,
      'email-input': emailInputRef.current,
      'password-input': passwordInputRef.current,
      'password-toggle': passwordToggleRef.current,
      'submit-button': submitButtonRef.current,
      'signin-link': signinLinkRef.current,
    };

    const targetElement = elementMap[elementType];
    if (targetElement) {
      const newIndex = focusableElements.indexOf(targetElement);
      if (newIndex !== -1) {
        setCurrentFocusIndex(newIndex);
        setIsNavigationMode(true);
      }

      // Announce what element is focused
      const elementName = getElementName(targetElement);
      const elementTypeDesc = getElementType(targetElement);
      speak(`${elementName} ${elementTypeDesc}`);
    }
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
          speak('Arrow key navigation activated. Use arrow keys to navigate, Enter to activate.');
        }
        return;
      }

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        let direction;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          direction = 'down';
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          direction = 'up';
        }
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
        announceNavigationMode(false);
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
  }, [currentFocusIndex, isNavigationMode, comingFromInviteFlow]);

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

  return (
    <div className="signup-form">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          {/* Navigation Status Indicator */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {isNavigationMode && `Navigation active. Use arrow keys to move between form elements. Current position: ${currentFocusIndex + 1} of ${getFocusableElements().length}. Press Enter to activate selected element or F1 to start navigation.`}
          </div>

          <FormHeader>{t('loginSignupPage.signUp', 'Sign up')}</FormHeader>
          {(organizationId || shouldShowSignInCTA) && (
            <p className="signup-info" data-cy="signup-info">
              {organizationId && (
                <>
                  Sign up to the workspace -{' '}
                  <span className="workspace-name" data-cy="workspace-name">
                    {configs?.name}
                  </span>
                  .
                </>
              )}{' '}
              {shouldShowSignInCTA && (
                <>
                  {t('loginSignupPage.alreadyHaveAnAccount', 'Already have an account?')}{' '}
                  <Link
                    ref={signinLinkRef}
                    to={`/login${paramOrganizationSlug ? `/${paramOrganizationSlug}` : ''}${redirectTo ? `?redirectTo=${redirectTo}` : ''
                      }`}
                    className="signin-link"
                    tabIndex="0"
                    data-cy="signin-link"
                    onFocus={() => handleElementFocus('signin-link')}
                  >
                    {t('loginSignupPage.signIn', 'Sign in')}
                  </Link>
                </>
              )}
            </p>
          )}
          {shouldShowSignupDisabledCard ? (
            <SignupStatusCard text={signUpDisabledText} />
          ) : (
            <>
              {isFormSignUpEnabled && (
                <form onSubmit={handleSubmit} className="form-input-area">
                  {!comingFromInviteFlow && (
                    <FormTextInput
                      ref={nameInputRef}
                      label={t('loginSignupPage.name', 'Name')}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('loginSignupPage.enterFullName', 'Enter your full name')}
                      error={errors.name}
                      onFocus={() => handleElementFocus('name-input')}
                    />
                  )}
                  <FormTextInput
                    ref={emailInputRef}
                    label={t('loginSignupPage.workEmail', 'Email')}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                    error={errors.email}
                    disabled={!!inviteeEmail}
                    onFocus={() => handleElementFocus('email-input')}
                  />
                  <PasswordInput
                    ref={passwordInputRef}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    label={organizationToken ? 'Create a password' : 'Password'}
                    onFocus={() => handleElementFocus('password-input')}
                    passwordToggleRef={passwordToggleRef}
                    onPasswordToggleFocus={() => handleElementFocus('password-toggle')}
                  />
                  <SubmitButton
                    ref={submitButtonRef}
                    buttonText={t('loginSignupPage.signUp', 'Sign up')}
                    disabled={!isFormValid || isLoading}
                    isLoading={isLoading}
                    onFocus={() => handleElementFocus('submit-button')}
                  />
                </form>
              )}
              {isAnySSOEnabled && isFormSignUpEnabled && <SepratorComponent />}
              <SSOAuthModule
                configs={configs}
                organizationSlug={paramOrganizationSlug}
                buttonText="Sign up with"
                setSignupOrganizationDetails={() => setSignupOrganizationDetails()}
              />
              {defaultState && <TermsAndPrivacyInfo />}
            </>
          )}
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default SignupForm;
