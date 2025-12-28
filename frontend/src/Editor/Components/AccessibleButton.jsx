import React from 'react';
import { Button } from '@chakra-ui/react';

export const AccessibleButton = ({
    height,
    properties,
    styles,
    fireEvent,
    setExposedVariable,
    darkMode,
    dataCy,
}) => {
    const { text = 'Button', ariaLabel = '', loadingState = false, visibility = true, disabledState = false } = properties || {};
    const { variant = 'solid', colorScheme = 'blue', size = 'md' } = styles || {};

    const handleClick = () => {
        if (fireEvent) {
            fireEvent('onClick');
        }
    };

    if (!visibility) return null;

    return (
        <Button
            onClick={handleClick}
            variant={variant}
            colorScheme={colorScheme}
            size={size}
            isLoading={loadingState}
            isDisabled={disabledState}
            aria-label={ariaLabel || text}
            data-cy={dataCy}
            width="100%"
            height={`${height}px`}
        >
            {text}
        </Button>
    );
};
