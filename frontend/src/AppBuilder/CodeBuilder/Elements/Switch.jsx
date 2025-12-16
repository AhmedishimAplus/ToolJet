import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';
import cx from 'classnames';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const Switch = ({ value, onChange, cyLabel, meta, paramName, isIcon, component, paramLabel }) => {
  const { speak } = useScreenReader();
  const options = meta?.options;
  const defaultValue =
    paramName == 'defaultValue' && (component == 'Checkbox' || component == 'ToggleSwitchV2') ? `{{${value}}}` : value;

  const handleValueChange = (newValue) => {
    onChange(newValue);
    const label = paramLabel || 'Switch';
    const selectedOption = options?.find(opt => opt.value === newValue);
    const displayText = selectedOption?.displayName || newValue;
    speak(`${label} set to ${displayText}`);
  };

  const handleFocus = () => {
    const label = paramLabel || 'Switch';
    speak(`${label} switch group, current value: ${value}`);
  };

  return (
    <div className={cx({ 'w-full': meta?.fullWidth })}>
      <ToggleGroup onValueChange={handleValueChange} defaultValue={defaultValue} className={cx({ 'w-full': meta?.fullWidth })} onFocus={handleFocus}>
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            isIcon={meta.isIcon}
            style={{ width: meta?.fullWidth ? '100%' : '67px' }}
          >
            {meta.isIcon ? option?.iconName ?? '' : option?.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default Switch;
