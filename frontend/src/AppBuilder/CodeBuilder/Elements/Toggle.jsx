import React from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const Toggle = ({ value, onChange, cyLabel, meta, paramLabel }) => {
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const label = paramLabel || meta?.toggleLabel || 'toggle';
    speak(`${label} toggle, currently ${value ? 'enabled' : 'disabled'}`);
  };

  const handleChange = () => {
    const newValue = !value;
    onChange(`{{${newValue}}}`);
    const label = paramLabel || meta?.toggleLabel || 'toggle';
    speak(`${label} toggle, ${newValue ? 'enabled' : 'disabled'}`);
  };
  return (
    <div className="row fx-container">
      <div className="col d-flex align-items-center">
        <div className="field">
          <label
            className="form-check form-switch mb-0 d-flex justify-content-end"
            style={{ marginBottom: '0px', paddingLeft: '28px' }}
          >
            {meta?.toggleLabel && (
              <span
                className="font-weight-400 font-size-12 d-flex align-items-center color-slate12"
                style={{ marginRight: '78px' }}
              >
                {meta?.toggleLabel}
              </span>
            )}
            <input
              className="form-check-input"
              type="checkbox"
              onClick={handleChange}
              onFocus={handleFocus}
              checked={value}
              data-cy={`${cyLabel}-toggle-button`}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
