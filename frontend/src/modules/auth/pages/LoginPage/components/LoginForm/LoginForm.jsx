import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail, validatePassword } from '@/_helpers/utils';
// import OnboardingUIWrapper from '../../../../../onboarding/components/OnboardingUIWrapper';
// import OnboardingFormInsideWrapper from '../../../../../onboarding/components/OnboardingFormInsideWrapper/OnboardingFormInsideWrapper';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { FormTextInput, PasswordInput, SubmitButton, FormHeader, SSOAuthModule } from '@/modules/common/components';
import { redirectToDashboard } from '@/_helpers/routes';
import './resources/styles/login-form.styles.scss';
import './resources/styles/accessibility.scss';
import SepratorComponent from '@/modules/common/components/SepratorComponent';

const LoginForm = ({
  configs,
  organizationId,
  paramOrganizationSlug,
  redirectTo,
  setRedirectUrlToCookie,
  onSubmit,
  currentOrganizationName,
  whiteLabelText,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);
  const [isDefaultFormPassword, setisDefaultFormPassword] = useState(true);

  // Refs for keyboard navigation and focus management
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const signUpLinkRef = useRef(null);
  const forgotPasswordLinkRef = useRef(null);
  const passwordToggleRef = useRef(null);
  const ssoButtonsRef = useRef([]);

  // Arrow key navigation state
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(true);

  const defaultfieldStateSetters = {
    email: setisDefaultFormEmail,
    password: setisDefaultFormPassword,
  };
  const isAnySSOEnabled =
    configs?.google?.enabled ||
    configs?.git?.enabled ||
    configs?.ldap?.enabled ||
    configs?.saml?.enabled ||
    configs?.openid?.enabled;

  const noLoginMethodsEnabled = !configs?.form?.enabled && !isAnySSOEnabled;
  const workspaceSignUpEnabled = organizationId && configs?.enable_sign_up;
  const instanceSignUpEnabled = !organizationId && (configs?.form?.enable_sign_up || configs?.enable_sign_up);
  const isSignUpCTAEnabled = workspaceSignUpEnabled || instanceSignUpEnabled || true; // Temporarily force to show for testing

  console.log('LoginForm signup debug:', {
    organizationId,
    'configs?.enable_sign_up': configs?.enable_sign_up,
    'configs?.form?.enable_sign_up': configs?.form?.enable_sign_up,
    workspaceSignUpEnabled,
    instanceSignUpEnabled,
    isSignUpCTAEnabled
  });

  const signUpCTA = workspaceSignUpEnabled ? 'Sign up' : 'Create an account';
  const signupText = workspaceSignUpEnabled
    ? t('loginSignupPage.newToWorkspace', 'New to this workspace?')
    : t('loginSignupPage.newToTooljet', 'New to {whiteLabelText}?', { whiteLabelText });
  const signUpUrl = `/signup${paramOrganizationSlug ? `/${paramOrganizationSlug}` : ''}${redirectTo ? `?redirectTo=${redirectTo}` : ''
    }`;

  // Focus management - auto focus email field on mount
  useEffect(() => {
    if (configs?.form?.enabled) {
      // Always start navigation mode when component mounts
      setIsNavigationMode(true);
      setCurrentFocusIndex(0);

      // Focus the first available element after a short delay
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0 && focusableElements[0]?.ref?.current) {
          focusableElements[0].ref.current.focus();
          announceToScreenReader('Arrow key navigation active. Use arrow keys to navigate, Enter to activate.');
        }
      }, 100);
    }
  }, [configs?.form?.enabled]);

  // Re-activate navigation when clicking outside and then back into form
  useEffect(() => {
    const handleFormClick = (e) => {
      if (e.target.closest('.login-form')) {
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

    if (configs?.form?.enabled) {
      if (emailInputRef.current) elements.push({ ref: emailInputRef, type: 'input', name: 'email' });
       if (forgotPasswordLinkRef.current) elements.push({ ref: forgotPasswordLinkRef, type: 'link', name: 'forgot password' });
      if (passwordInputRef.current) elements.push({ ref: passwordInputRef, type: 'input', name: 'password' });
      if (passwordToggleRef.current) elements.push({ ref: passwordToggleRef, type: 'button', name: 'toggle password visibility' });
     
      if (submitButtonRef.current) elements.push({ ref: submitButtonRef, type: 'button', name: 'sign in' });
    }

    // Add SSO buttons
    ssoButtonsRef.current.forEach((btn, index) => {
      if (btn) elements.push({ ref: { current: btn }, type: 'button', name: `SSO login ${index + 1}` });
    });

    // Only include sign up link if it's actually rendered
    if (isSignUpCTAEnabled && signUpLinkRef.current) elements.push({ ref: signUpLinkRef, type: 'link', name: 'sign up' });

    return elements;
  };  // Arrow key navigation handler
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
        if (name === 'sign in') {
          handleSubmit({ preventDefault: () => { } });
        } else if (name === 'toggle password visibility') {
          element.ref.current.click();
        } else {
          element.ref.current.click();
        }
        announceToScreenReader(`${name} activated`);
        break;
      case 'link':
        element.ref.current.click();
        announceToScreenReader(`${name} link activated`);
        break;
    }
  };

  // Global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Always allow arrow key navigation when on the login page
      // Check if we're in the login form area or if no other input is focused
      const isInForm = e.target.closest('.login-form') ||
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
        }
      }
    };

    document.addEventListener('keydown', handleGlobalActivation);
    return () => document.removeEventListener('keydown', handleGlobalActivation);
  }, []);

  const checkFormValidity = () => {
    const isValid = email.trim() !== '' && validateEmail(email) && password.trim() !== '' && password.length >= 5;
    setIsFormValid(isValid);
  };
  useEffect(() => {
    checkFormValidity();
    const newErrors = {};
    let isValid = true;
    const emailFieldError = !isDefaultFormEmail && validateField('email', email);
    newErrors['email'] = emailFieldError;
    const passwordFieldError = !isDefaultFormPassword && validateField('password', password);
    newErrors['password'] = passwordFieldError;
    if (emailFieldError || passwordFieldError) isValid = false;
    setErrors(newErrors);
    setIsFormValid(isValid && email != '' && password != '');
  }, [email, password]);

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return value.trim() ? (validateEmail(value) ? '' : 'Email is invalid') : 'Email is required';
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (defaultfieldStateSetters[name]) {
      defaultfieldStateSetters[name](false);
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Handle input field focus
  const handleInputFocus = (fieldName) => {
    const focusableElements = getFocusableElements();
    const index = focusableElements.findIndex(el => el.name === fieldName);
    if (index !== -1) {
      setCurrentFocusIndex(index);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Announce form submission to screen readers
    announceToScreenReader('Signing in, please wait...');

    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Invalid Email' }));
      announceToScreenReader('Error: Invalid email address');
      setIsLoading(false);
      emailInputRef.current?.focus();
      return;
    }
    if (!password || !password.trim()) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      announceToScreenReader('Error: Password is required');
      setIsLoading(false);
      passwordInputRef.current?.focus();
      return;
    }
    if (password.length > 100) {
      setErrors((prev) => ({ ...prev, password: 'Password can be at max 100 characters long' }));
      announceToScreenReader('Error: Password is too long');
      setIsLoading(false);
      passwordInputRef.current?.focus();
      return;
    }
    onSubmit(email, password, () => {
      setIsLoading(false);
      announceToScreenReader('Sign in failed, please check your credentials and try again');
    });
  };

  return (
    <div className="login-form" data-navigation-mode={isNavigationMode ? 'true' : 'false'}>
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          {noLoginMethodsEnabled ? (
            <div className="text-center-onboard" role="alert" aria-live="polite">
              <h2 data-cy="no-login-methods-warning">
                {t('loginSignupPage.noLoginMethodsEnabled', 'No login methods enabled for this workspace')}
              </h2>
            </div>
          ) : (
            <>
              <div className="keyboard-navigation-instructions" role="banner" aria-live="polite">
                <p className="sr-only">
                  Keyboard navigation: Use arrow keys to move between elements, Enter to activate or edit, Escape to exit edit mode. Press F1 to activate navigation from anywhere.
                </p>
                {isNavigationMode && (
                  <div className="navigation-status" aria-live="polite">
                    <small> Arrow key navigation active - Use ↑↓←→ to navigate, Enter to activate</small>
                  </div>
                )}
              </div>
              <FormHeader role="heading" aria-level="1">
                {t('loginSignupPage.signIn', 'Sign in')}
              </FormHeader>
              {organizationId || isSignUpCTAEnabled ? (
                <p className="signup-info" data-cy="signup-info" role="banner">
                  {organizationId && (
                    <>
                      Sign in to the workspace -{' '}
                      <span className="workspace-name" data-cy="workspace-name">
                        {configs?.name}
                      </span>
                      .
                    </>
                  )}{' '}
                  {isSignUpCTAEnabled && (
                    <>
                      {' '}
                      {signupText}{' '}
                      <Link
                        to={signUpUrl}
                        className="signin-link"
                        ref={signUpLinkRef}
                        data-cy="create-an-account-link"
                        onFocus={() => handleInputFocus('sign up')}
                        aria-label={`${signupText} ${t('createToolJetAccount', signUpCTA)}`}
                      >
                        {t('createToolJetAccount', signUpCTA)}
                      </Link>
                    </>
                  )}
                </p>
              ) : (
                <>
                  <span className="free-space"></span>
                </>
              )}
              {configs?.form?.enabled && (
                <form
                  onSubmit={handleSubmit}
                  className="form-input-area"
                  role="form"
                  aria-label="Sign in form"
                  noValidate
                >
                  <FormTextInput
                    ref={emailInputRef}
                    label={t('loginSignupPage.workEmail', 'Email')}
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    onFocus={() => handleInputFocus('email')}
                    placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                    error={errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                    aria-required="true"
                    autoComplete="email"
                    data-navigation-hint="Use arrow keys to navigate, Enter to edit, Escape to exit edit mode"
                  />
                  <PasswordInput
                    ref={passwordInputRef}
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    onFocus={() => handleInputFocus('password')}
                    placeholder={t('loginSignupPage.enterPassword', 'Enter your password')}
                    error={errors.password}
                    showForgotPassword={true}
                    hint={''}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    aria-required="true"
                    autoComplete="current-password"
                    forgotPasswordRef={forgotPasswordLinkRef}
                    passwordToggleRef={passwordToggleRef}
                    onPasswordToggleFocus={() => handleInputFocus('toggle password visibility')}
                    onForgotPasswordFocus={() => handleInputFocus('forgot password')}
                  />
                  <SubmitButton
                    ref={submitButtonRef}
                    buttonText={t('loginSignupPage.sigin', 'Sign in')}
                    disabled={!isFormValid || isLoading}
                    isLoading={isLoading}
                    onFocus={() => handleInputFocus('sign in')}
                    aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to your account'}
                    aria-describedby={!isFormValid ? 'form-validation-info' : undefined}
                  />
                  {!isFormValid && (
                    <div id="form-validation-info" className="sr-only" aria-live="polite">
                      Please fill in all required fields with valid information to sign in
                    </div>
                  )}
                </form>
              )}
              {isAnySSOEnabled && configs?.form?.enabled && <SepratorComponent />}
              <SSOAuthModule
                configs={configs}
                organizationSlug={paramOrganizationSlug}
                setRedirectUrlToCookie={setRedirectUrlToCookie}
                buttonText="Sign in with"
                aria-label="Single Sign-On options"
                ssoButtonsRef={ssoButtonsRef}
                onSSOButtonFocus={(index) => handleInputFocus(`SSO login ${index + 1}`)}
              />
              {currentOrganizationName && organizationId && (
                <div
                  className="text-center-onboard mt-3"
                  data-cy={`back-to-${String(currentOrganizationName).toLowerCase().replace(/\s+/g, '-')}`}
                  role="navigation"
                  aria-label="Back to workspace"
                >
                  back to&nbsp;
                  <Link
                    onClick={() => redirectToDashboard()}
                    aria-label={`Go back to ${currentOrganizationName} workspace`}
                  >
                    {currentOrganizationName}
                  </Link>
                </div>
              )}
            </>
          )}
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default LoginForm;
