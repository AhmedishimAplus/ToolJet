import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const ClientServerSwitch = ({ value, onChange, meta, paramLabel }) => {
  const options = meta?.options;
  const defaultValue = value ? 'serverSide' : 'clientSide';
  const { speak } = useScreenReader();

  const handleChange = (_value) => {
    onChange(`{{${_value === 'serverSide'}}}`);
    const selectedOption = options?.find(opt => opt.value === _value);
    const label = paramLabel || 'Client/Server switch';
    speak(`${label} set to ${selectedOption?.displayName || _value}`);
  };

  const handleFocus = () => {
    const label = paramLabel || 'Client/Server switch';
    const selectedOption = options?.find(opt => opt.value === defaultValue);
    speak(`${label}, current value: ${selectedOption?.displayName || defaultValue}`);
  };

  return (
    <div>
      <ToggleGroup onValueChange={handleChange} defaultValue={defaultValue} onFocus={handleFocus}>
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.displayName}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default ClientServerSwitch;
