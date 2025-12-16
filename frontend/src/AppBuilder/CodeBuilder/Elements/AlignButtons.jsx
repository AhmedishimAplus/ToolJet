import React from 'react';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import AlignLeft from '@/_ui/Icon/solidIcons/AlignLeft';
import AlignCenter from '@/_ui/Icon/solidIcons/AlignCenter';
import AlignRight from '@/_ui/Icon/solidIcons/AlignRight';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const AlignButtons = ({ value, onChange, forceCodeBox, meta, paramLabel }) => {
  const { speak } = useScreenReader();

  function handleOptionChanged(_value) {
    onChange(_value);
    const label = paramLabel || 'Alignment';
    speak(`${label} set to ${_value}`);
  }

  const handleFocus = () => {
    const label = paramLabel || 'Alignment';
    speak(`${label} buttons, current value: ${value}`);
  };

  return (
    <ToggleGroup onValueChange={handleOptionChanged} defaultValue={value} className="inspector-align-buttons" onFocus={handleFocus}>
      <ToggleGroupItem value="left">
        <AlignLeft width={14} />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <AlignCenter width={14} />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <AlignRight width={14} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
