export const accessibleInputConfig = {
    name: 'AccessibleInput',
    displayName: 'Accessible Input',
    description: 'Chakra UI input with built-in accessibility features',
    component: 'AccessibleInput',
    defaultSize: {
        width: 5,
        height: 40,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        value: {
            type: 'code',
            displayName: 'Default value',
            validation: {
                schema: { type: 'string' },
            },
        },
        placeholder: {
            type: 'code',
            displayName: 'Placeholder',
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
        readOnly: {
            type: 'toggle',
            displayName: 'Read only',
            validation: { schema: { type: 'boolean' } },
            section: 'additionalActions',
        },
    },
    events: {
        onChange: { displayName: 'On change' },
        onFocus: { displayName: 'On focus' },
        onBlur: { displayName: 'On blur' },
    },
    styles: {
        variant: {
            type: 'switch',
            displayName: 'Variant',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Outline', value: 'outline' },
                { displayName: 'Filled', value: 'filled' },
                { displayName: 'Flushed', value: 'flushed' },
            ],
            accordian: 'input',
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
            accordian: 'input',
        },
    },
    exposedVariables: {
        value: '',
    },
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            value: { value: '' },
            placeholder: { value: 'Enter text' },
            ariaLabel: { value: '' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
            readOnly: { value: '{{false}}' },
        },
        events: [],
        styles: {
            variant: { value: 'outline' },
            size: { value: 'md' },
        },
    },
};
