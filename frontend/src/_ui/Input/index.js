import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import OrgConstantVariablesPreviewBox from '../../_components/OrgConstantsVariablesResolver';
import SolidIcon from '../Icon/SolidIcons';
import { toast } from 'react-hot-toast';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const Input = ({ helpText, onBlur, ...props }) => {
  const { workspaceVariables, workspaceConstants, value, type, disabled, encrypted, isWorkspaceConstant } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { speak } = useScreenReader();
  const inputType = type === 'password' || encrypted ? (showPassword ? 'text' : 'password') : type;
  const iconType = showPassword ? 'eye' : 'eyedisable';

  useEffect(() => {
    if (isWorkspaceConstant) {
      setShowPassword(true);
    }
  }, [isWorkspaceConstant]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleCopyToClipboard = async () => {
    if (type === 'copyToClipboard') {
      try {
        await navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 4000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    const label = props['aria-label'] || props.label || props.placeholder || 'input';
    const currentValue = value || '';
    const encryptedStatus = (type === 'password' || encrypted) ? ', encrypted' : '';
    const announcement = currentValue ? `${label}${encryptedStatus}, current value: ${currentValue}` : `${label}${encryptedStatus}`;
    speak(announcement);
  };

  return (
    <div className="tj-app-input">
      <div
        className={cx('', { 'tj-app-input-wrapper': type === 'password' || type === 'copyToClipboard' || encrypted })}
      >
        <input
          {...props}
          type={inputType}
          onFocus={handleFocus}
          onBlur={(event) => {
            setIsFocused(false);
            if (onBlur) onBlur(event);
          }}
        />
        {(type === 'password' || encrypted) && (
          <div
            onClick={!disabled ? toggleShowPassword : undefined}
            style={{ cursor: !disabled ? 'pointer' : 'default' }}
          >
            <SolidIcon className="eye-icon" name={iconType} />
          </div>
        )}
        {type === 'copyToClipboard' &&
          value &&
          (!isCopied ? (
            <div style={{ cursor: 'pointer' }} onClick={handleCopyToClipboard}>
              <SolidIcon className="copy-icon" name="copy" />
            </div>
          ) : (
            <div style={{ color: 'green' }}>
              <span>Copied!</span>
            </div>
          ))}
      </div>

      <OrgConstantVariablesPreviewBox
        workspaceVariables={workspaceVariables}
        workspaceConstants={workspaceConstants}
        isFocused={isFocused}
        value={value}
      />
      {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
    </div>
  );
};

export default Input;
