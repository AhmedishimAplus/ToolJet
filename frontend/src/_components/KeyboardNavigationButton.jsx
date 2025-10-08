import React from 'react';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard Navigation Toggle Button for the navbar
 * Shows keyboard shortcut guide when clicked
 */
const KeyboardNavigationButton = ({ darkMode = false }) => {
    const { toggleShortcutGuide, shortcutGuideVisible } = useKeyboardNavigationContext();

    const buttonStyle = {
        background: shortcutGuideVisible ?
            (darkMode ? '#4c93ff' : '#4c93ff') :
            (darkMode ? 'transparent' : 'transparent'),
        border: '1px solid #4c93ff',
        borderRadius: '6px',
        padding: '6px 10px',
        color: shortcutGuideVisible ?
            '#fff' :
            (darkMode ? '#4c93ff' : '#4c93ff'),
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s ease',
        minWidth: 'auto',
        height: '32px'
    };

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleShortcutGuide();
    };

    return (
        <button
            onClick={handleClick}
            style={buttonStyle}
            title="Toggle keyboard navigation shortcuts"
            aria-label="Toggle keyboard navigation shortcuts"
            aria-pressed={shortcutGuideVisible}
        >
            <span style={{ fontSize: '14px' }}>⌨️</span>
            <span>Keyboard Nav</span>
        </button>
    );
};

export default KeyboardNavigationButton;