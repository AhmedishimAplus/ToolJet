import React from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const NumberInput = ({ value, onChange, cyLabel, meta, paramLabel }) => {
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const label = paramLabel || 'number';
    speak(`${label} input, current value: ${value || 'empty'}`);
  };

  return (
    <div className="form-text tj-number-input-element">
      <input
        style={{ width: '142px', height: '32px' }}
        data-cy={`${String(cyLabel)}-input`}
        type="number"
        className="tj-input-element tj-text-xsm"
        value={value}
        placeholder=""
        id="labelId"
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={handleFocus}
        autoComplete="off"
      />
      <label for="labelId" className="static-value tj-text-xsm">
        {meta.staticText?.length > 0 ? meta.staticText : meta.staticText?.length == 0 ? '' : 'px'}
      </label>
    </div>
  );
};
