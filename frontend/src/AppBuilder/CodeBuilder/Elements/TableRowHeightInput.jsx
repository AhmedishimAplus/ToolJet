import React, { useEffect, useState } from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const MIN_TABLE_ROW_HEIGHT_CONDENSED = 39;
const MIN_TABLE_ROW_HEIGHT_DEFAULT = 45;

const TableRowHeightInput = ({ value, onChange, cyLabel, staticText, styleDefinition, paramLabel }) => {
  const [inputValue, setInputValue] = useState(value);
  const { speak } = useScreenReader();
  const minValue =
    styleDefinition.cellSize?.value === 'condensed' ? MIN_TABLE_ROW_HEIGHT_CONDENSED : MIN_TABLE_ROW_HEIGHT_DEFAULT;

  useEffect(() => {
    setInputValue(value < minValue ? minValue : value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, styleDefinition.cellSize?.value]);

  const handleFocus = () => {
    const label = paramLabel || 'Row height';
    speak(`${label} input, current value: ${inputValue} pixels`);
  };

  const handleBlur = () => {
    const newValue = Math.max(inputValue, minValue);
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="form-text tj-number-input-element">
      <input
        style={{ width: '142px', height: '32px' }}
        data-cy={`${cyLabel}-input`}
        type="number"
        className="tj-input-element tj-text-xsm"
        value={inputValue}
        placeholder=""
        id="labelId"
        min={minValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        autoComplete="off"
      />
      <label htmlFor="labelId" className="static-value tj-text-xsm">
        {staticText ? staticText : 'px'}
      </label>
    </div>
  );
};

export default TableRowHeightInput;
