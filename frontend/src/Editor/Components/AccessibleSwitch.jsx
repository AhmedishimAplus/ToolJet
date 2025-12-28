import React, { useState, useEffect } from 'react';
import { Switch, FormControl, FormLabel } from '@chakra-ui/react';

export const AccessibleSwitch = ({
    height,
    properties,
    styles,
    fireEvent,
    setExposedVariable,
    darkMode,
    dataCy,
}) => {
    const { label = '', checked = false, ariaLabel = '', visibility = true, disabledState = false } = properties || {};
    const { colorScheme = 'blue', size = 'md' } = styles || {};

    const [isChecked, setIsChecked] = useState(checked || false);

    useEffect(() => {
        setIsChecked(checked || false);
    }, [checked]);

    useEffect(() => {
        if (setExposedVariable) {
            setExposedVariable('value', isChecked);
        }
    }, [isChecked, setExposedVariable]);

    const handleChange = (e) => {
        const newValue = e.target.checked;
        setIsChecked(newValue);
        if (setExposedVariable) {
            setExposedVariable('value', newValue);
        }
        if (fireEvent) {
            fireEvent('onChange');
        }
    };

    if (!visibility) return null;

    return (
        <FormControl display="flex" alignItems="center" height={`${height}px`}>
            <Switch
                id={`switch-${dataCy}`}
                isChecked={isChecked}
                onChange={handleChange}
                colorScheme={colorScheme}
                size={size}
                isDisabled={disabledState}
                aria-label={ariaLabel || label}
                data-cy={dataCy}
            />
            {label && (
                <FormLabel htmlFor={`switch-${dataCy}`} mb="0" ml="2">
                    {label}
                </FormLabel>
            )}
        </FormControl>
    );
};
