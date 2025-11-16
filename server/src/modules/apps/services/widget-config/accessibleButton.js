export const accessibleButtonConfig = {
    name: 'AccessibleButton',
    displayName: 'Accessible Button',
    description: 'Chakra UI button with built-in accessibility features',
    component: 'AccessibleButton',
    defaultSize: {
        width: 5,
        height: 40,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        text: {
            type: 'code',
            displayName: 'Label',
            validation: {
                schema: { type: 'string' },
            },
        },
        ariaLabel: {
            type: 'code',
            displayName: 'ARIA Label',
            validation: {
                schema: { type: 'string' },
            },
            section: 'additionalActions',
        },
        loadingState: {
            type: 'toggle',
            displayName: 'Loading state',
            validation: { schema: { type: 'boolean' } },
            section: 'additionalActions',
        },
        visibility: {
            type: 'toggle',
            displayName: 'Visibility',
            validation: { schema: { type: 'boolean' } },
            section: 'additionalActions',
        },
        disabledState: {
            type: 'toggle',
            displayName: 'Disable',
            validation: { schema: { type: 'boolean' } },
            section: 'additionalActions',
        },
    },
    events: {
        onClick: { displayName: 'On click' },
    },
    styles: {
        variant: {
            type: 'switch',
            displayName: 'Variant',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Solid', value: 'solid' },
                { displayName: 'Outline', value: 'outline' },
                { displayName: 'Ghost', value: 'ghost' },
            ],
            accordian: 'button',
        },
        colorScheme: {
            type: 'switch',
            displayName: 'Color Scheme',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Blue', value: 'blue' },
                { displayName: 'Green', value: 'green' },
                { displayName: 'Red', value: 'red' },
                { displayName: 'Gray', value: 'gray' },
            ],
            accordian: 'button',
        },
        size: {
            type: 'switch',
            displayName: 'Size',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Small', value: 'sm' },
                { displayName: 'Medium', value: 'md' },
                { displayName: 'Large', value: 'lg' },
            ],
            accordian: 'button',
        },
    },
    exposedVariables: {},
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            text: { value: 'Button' },
            ariaLabel: { value: '' },
            loadingState: { value: '{{false}}' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
        },
        events: [],
        styles: {
            variant: { value: 'solid' },
            colorScheme: { value: 'blue' },
            size: { value: 'md' },
        },
    },
};
