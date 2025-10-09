import React from 'react';
import './resources/styles/sso-button-wrapper.styles.scss';

const SSOButtonWrapper = ({ onClick, onFocus, icon, text, dataCy }) => {
  const handleKeyDown = (e) => {
    // Handle Enter and Space keys for button activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="sso-button-wrapper">
      <button
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        className="sso-button"
        data-cy={dataCy}
        aria-label={`${text} - Single Sign-On option`}
        type="button"
      >
        <img src={icon} alt={`${text} icon`} className="sso-icon" aria-hidden="true" />
        <span className="sso-text" data-cy={`${dataCy}-text`}>
          {text}
        </span>
      </button>
    </div>
  );
};

export default SSOButtonWrapper;
