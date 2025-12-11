import React from 'react';
import _ from 'lodash';
import Select from 'react-select';
import defaultStyles from './styles';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const SelectComponent = ({ options = [], value, onChange, closeMenuOnSelect, darkMode, ...restProps }) => {
  const selectRef = React.useRef(null);
  const { speak } = useScreenReader();
  const isDarkMode = darkMode ?? localStorage.getItem('darkMode') === 'true';
  const {
    isMulti = false,
    styles = {},
    isLoading = false,
    hasSearch = true,
    height,
    width,
    placeholder = 'Select..',
    customOption = undefined,
    defaultValue = null,
    useMenuPortal = true, // todo: deprecate this prop, use menuPortalTarget instead
    maxMenuHeight = 250,
    menuPortalTarget = null,
    menuPlacement = 'auto',
    useCustomStyles = false,
    isDisabled = false,
    borderRadius,
    openMenuOnFocus = false,
    customClassPrefix = '',
  } = restProps;

  const customStyles = useCustomStyles ? styles : defaultStyles(isDarkMode, width, height, styles, borderRadius);
  const selectOptions =
    Array.isArray(options) && options.length === 0
      ? options
      : options?.map((option) => {
        if (!option.hasOwnProperty('label')) {
          return _.mapKeys(option, (value, key) => (key === 'value' ? key : 'label'));
        }
        return option;
      });

  const currentValue = value ? selectOptions.find((option) => option.value === value) || value : defaultValue;

  const handleOnChange = (data) => {
    if (isMulti) {
      onChange(data);
    } else {
      onChange(data.value);
    }
  };

  const renderCustomOption = (option) => {
    if (customOption) {
      return customOption(option);
    }

    return option.label;
  };

  const handleSelectFocus = () => {
    const label = restProps['aria-label'] || restProps.ariaLabel || restProps.label || 'dropdown';
    const selectedValue = currentValue ? currentValue.label || currentValue.value : 'no selection';
    speak(`${label}, ${selectedValue} selected`);
  };

  return (
    <Select
      {...restProps}
      ref={selectRef}
      selectRef={selectRef} // Exposed ref for custom components if needed
      isLoading={isLoading}
      isDisabled={isDisabled || isLoading}
      options={selectOptions}
      value={currentValue}
      isSearchable={hasSearch}
      onChange={handleOnChange}
      placeholder={placeholder}
      styles={customStyles}
      openMenuOnFocus={openMenuOnFocus}
      onFocus={handleSelectFocus}
      formatOptionLabel={(option) => renderCustomOption(option)}
      menuPlacement={menuPlacement}
      maxMenuHeight={maxMenuHeight}
      menuPortalTarget={useMenuPortal ? document.body : menuPortalTarget}
      closeMenuOnSelect={closeMenuOnSelect ?? true}
      classNamePrefix={`${customClassPrefix} ${isDarkMode && 'dark-theme'} ${'react-select'}`}
      aria-label={restProps['aria-label'] || restProps.ariaLabel || placeholder}
    />
  );
};
