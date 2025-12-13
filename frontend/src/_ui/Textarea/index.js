import React, { useState } from 'react';
import OrgConstantVariablesPreviewBox from '../../_components/OrgConstantsVariablesResolver';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const Textarea = ({ helpText, ...props }) => {
  const { workspaceVariables, workspaceConstants, value } = props;
  const [isFocused, setIsFocused] = useState(false);
  const { speak } = useScreenReader();

  const handleFocus = () => {
    setIsFocused(true);
    const label = props['aria-label'] || props.label || props.placeholder || 'textarea';
    const currentValue = value || '';
    const announcement = currentValue ? `${label}, current value: ${currentValue}` : label;
    speak(announcement);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="tj-app-input">
      <textarea {...props} onFocus={handleFocus} onBlur={handleBlur} />
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

export default Textarea;
