import React, { useState, useEffect } from 'react';
import { ChakraProvider, Input } from '@chakra-ui/react';

export const AccessibleInput = ({
    height,
    properties,
    styles,
    fireEvent,
    setExposedVariable,
    darkMode,
    dataCy,
}) => {
    const { value, placeholder, ariaLabel, visibility, disabledState, readOnly } = properties;
    const { variant = 'outline', size = 'md' } = styles;

    const [inputValue, setInputValue] = useState(value || '');

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        setExposedVariable('value', inputValue);
    }, [inputValue, setExposedVariable]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setExposedVariable('value', newValue);
        fireEvent('onChange');
    };

    const handleFocus = () => {
        fireEvent('onFocus');
    };

    const handleBlur = () => {
        fireEvent('onBlur');
    };

    if (!visibility) return null;

    return (
        <ChakraProvider>
            <Input
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                variant={variant}
                size={size}
                isDisabled={disabledState}
                isReadOnly={readOnly}
                aria-label={ariaLabel || placeholder}
                data-cy={dataCy}
                width="100%"
                height={`${height}px`}
            />
        </ChakraProvider>
    );
};
