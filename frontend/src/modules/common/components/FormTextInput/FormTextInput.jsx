import React, { forwardRef } from 'react';
import './resources/styles/form-text-input.styles.scss';

const FormTextInput = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onFocus,
  type = 'text',
  error,
  disabled,
  name,
  dataCy = label ? label.toLowerCase().replace(/\s+/g, '-') : value ? value.toLowerCase().replace(/\s+/g, '-') : '',
  maxLength,
  disableStartAdornment = false,
  autoComplete,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...rest
}, ref) => {
  const handleChange = (event) => {
    const { name, value } = event.target;
    // Trimming the value from front and back field for email
    const trimmedValue = name === 'email' ? value.trim() : value;
    onChange({ target: { name, value: trimmedValue } });
  };
  return (
    <div className={`form-input ${disabled ? 'form-input--disabled' : ''}`}>
      {!disabled ? (
        <label htmlFor={name} className="form-input__label" data-cy={`${dataCy}-label`}>
          {label} {!disableStartAdornment && <span className="form-input__required">*</span>}
        </label>
      ) : (
        <label htmlFor={name} className="form-input__label" data-cy={`${dataCy}-label`}>
          {label} {!disableStartAdornment && <span className="form-input__required-disabled">*</span>}
        </label>
      )}

      {disabled ? (
        <p className="form-input__field form-input__field--disabled" data-cy={`${dataCy}-input-value`}>
          {value}
        </p>
      ) : (
        <>
          <input
            ref={ref}
            type={type}
            className="form-input__field"
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            required
            data-cy={`${dataCy}-input`}
            autoComplete={autoComplete || "off"}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={ariaRequired}
            {...(maxLength ? { maxLength } : {})}
            {...rest}
          />
          <span
            id={error ? `${name}-error` : undefined}
            className={`tj-input-error form-input__error${error ? '__error-enabled' : ''}`}
            data-cy={`${dataCy}-error-message`}
            role={error ? "alert" : undefined}
            aria-live={error ? "polite" : undefined}
          >
            {error}
          </span>
        </>
      )}
    </div>
  );
});

export default FormTextInput;
