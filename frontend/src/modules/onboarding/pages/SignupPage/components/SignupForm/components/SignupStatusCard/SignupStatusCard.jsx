import React from 'react';

const SignupStatusCard = ({ text }) => {
  return (
    <div className="signup-status-card-wrapper">
      <img src="assets/images/onboardingassets/Icons/info.svg" alt="Information icon" />
      <p>{text}</p>
    </div>
  );
};

export default SignupStatusCard;
