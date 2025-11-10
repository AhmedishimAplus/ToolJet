import React from 'react';
import { ChakraProvider, Button } from '@chakra-ui/react';

export const AccessibleButton = ({
    height,
    properties,
    styles,
    fireEvent,
    setExposedVariable,
    darkMode,
    dataCy,
}) => {
    const { text, ariaLabel, loadingState, visibility, disabledState } = properties;
    const { variant = 'solid', colorScheme = 'blue', size = 'md' } = styles;

    const handleClick = () => {
        fireEvent('onClick');
    };

    if (!visibility) return null;

    return (
        <ChakraProvider>
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
        </ChakraProvider>
    );
};
