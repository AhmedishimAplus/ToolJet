import React from 'react';
import { GoogleSSOLoginButton, GitSSOLoginButton } from '..';

const BaseSSOAuthModule = ({
  configs,
  setRedirectUrlToCookie,
  buttonText,
  setSignupOrganizationDetails,
  gitSSORef,
  googleSSORef,
  ssoButtonsRef,
  onSSOButtonFocus,
  'aria-label': ariaLabel,
}) => {
  const handleButtonRef = (element, index) => {
    if (ssoButtonsRef && ssoButtonsRef.current) {
      ssoButtonsRef.current[index] = element;
    }
  };

  return (
    <div role="group" aria-label={ariaLabel || "Single Sign-On login options"}>
      {configs?.git?.enabled && (
        <div className="login-sso-wrapper">
          <GitSSOLoginButton
            ref={(el) => {
              if (gitSSORef) gitSSORef.current = el;
              handleButtonRef(el, 0);
            }}
            configs={configs?.git?.configs}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
            onFocus={() => onSSOButtonFocus && onSSOButtonFocus(0)}
          />
        </div>
      )}
      {configs?.google?.enabled && (
        <div className="login-sso-wrapper">
          <GoogleSSOLoginButton
            ref={(el) => {
              if (googleSSORef) googleSSORef.current = el;
              handleButtonRef(el, configs?.git?.enabled ? 1 : 0);
            }}
            configs={configs?.google?.configs}
            configId={configs?.google?.config_id}
            setRedirectUrlToCookie={setRedirectUrlToCookie}
            setSignupOrganizationDetails={setSignupOrganizationDetails}
            buttonText={buttonText}
            onFocus={() => onSSOButtonFocus && onSSOButtonFocus(configs?.git?.enabled ? 1 : 0)}
          />
        </div>
      )}
    </div>
  );
};

export default BaseSSOAuthModule;
