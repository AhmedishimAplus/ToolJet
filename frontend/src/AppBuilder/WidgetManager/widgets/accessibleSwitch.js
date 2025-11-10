export const accessibleSwitchConfig = {
    name: 'AccessibleSwitch',
    displayName: 'Accessible Switch',
    description: 'Chakra UI toggle switch with built-in accessibility features',
    component: 'AccessibleSwitch',
    defaultSize: {
        width: 4,
        height: 30,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        label: {
            type: 'code',
            displayName: 'Label',
            validation: {
                schema: { type: 'string' },
            },
        },
        checked: {
            type: 'toggle',
            displayName: 'Default state',
            validation: {
                schema: { type: 'boolean' },
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
    },
    events: {
        onChange: { displayName: 'On change' },
    },
    styles: {
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
            accordian: 'switch',
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
            accordian: 'switch',
        },
    },
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            label: { value: 'Toggle' },
            checked: { value: '{{false}}' },
            ariaLabel: { value: '' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
        },
        events: [],
        styles: {
            colorScheme: { value: 'blue' },
            size: { value: 'md' },
        },
    },
};
