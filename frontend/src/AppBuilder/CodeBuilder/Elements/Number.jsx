import React, { useEffect, useState } from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const Number = ({ value, onChange, cyLabel, paramLabel }) => {
  const [number, setNumber] = useState(value ? value : 0);
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const label = paramLabel || 'number';
    speak(`${label} number input, current value: ${number}`);
  };

  useEffect(() => {
    setNumber(value);
  }, [value]);

  return (
    <>
      <div className="field tj-app-input" style={{ padding: '0.225rem 0.35rem' }}>
        <input
          className={'inspector-field-number'}
          key={`${String(cyLabel)}-input`}
          type="number"
          onChange={(e) => {
            setNumber(e.target.value);
            onChange(`{{${e.target.value}}}`);
          }}
          value={number}
          data-cy={`${String(cyLabel)}-input-field`}
          onFocus={handleFocus}
        />
      </div>
    </>
  );
};
