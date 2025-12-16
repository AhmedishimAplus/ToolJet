import React, { useState, useEffect } from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

function Checkbox({ value, onChange, paramLabel }) {
  const [isChecked, setIsChecked] = useState(value);
  const { speak } = useScreenReader();

  useEffect(() => {
    setIsChecked(value);
  }, [value]);

  const handleFocus = () => {
    const label = paramLabel || 'Auto width';
    speak(`${label} checkbox, currently ${isChecked ? 'checked' : 'unchecked'}`);
  };

  const handleChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange(`{{${newValue}}}`);
    const label = paramLabel || 'Auto width';
    speak(`${label} checkbox, ${newValue ? 'checked' : 'unchecked'}`);
  };

  return (
    <div className="d-flex align-items-center color-slate12" style={{ width: '142px', marginTop: '16px' }}>
      <input
        data-cy={`auto-width-checkbox`}
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        onFocus={handleFocus}
        value={isChecked}
        style={{ height: '16px', width: '16px' }}
      />
      <span className="tj-text-xsm" style={{ marginLeft: '8px' }} data-cy={`auto-width-label`}>
        Auto width
      </span>
    </div>
  );
}

export default Checkbox;
