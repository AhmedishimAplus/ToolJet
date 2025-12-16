import React from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const Input = ({ value, onChange, cyLabel, meta, paramLabel }) => {
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const label = paramLabel || 'input';
    speak(`${label} text input, current value: ${value || 'empty'}`);
  };
  return (
    <div className="form-text">
      <input
        data-cy={`${String(cyLabel)}-input`}
        style={{ width: '142px', height: '32px' }}
        type="text"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder=""
        key={`${String(cyLabel)}-input`}
        id="labelId"
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={handleFocus}
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {meta.staticText?.length > 0 ? meta.staticText : meta.staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
