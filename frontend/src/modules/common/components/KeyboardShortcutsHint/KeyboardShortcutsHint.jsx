import React, { useState, useRef, useEffect } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useScreenReader } from '@/modules/common/hooks';
import './styles.scss';

const KeyboardShortcutsHint = ({ darkMode }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const { speak } = useScreenReader();

    const shortcuts = [
        { key: 'Ctrl + I', description: 'Opening inspector' },
        { key: '← / →', description: 'Navigate through items' },
        { key: 'Enter', description: 'Select/Expand item' },
        { key: 'Escape', description: 'Close panels or exit selection' },
        { key: 'Tab', description: 'Move focus to next element' },
        { key: 'Shift + Tab', description: 'Move focus to previous element' },
        { key: '= + Arrow keys', description: 'Expanding component' },
        { key: '- + Arrow keys', description: 'Shrinking component' },
        { key: 'Backspace', description: 'Deleting selected component' },
        { key: 'Ctrl + C', description: 'Copy component' },
        { key: 'Ctrl + V', description: 'Pasting component' },
        { key: 'Ctrl + Z', description: 'Undo last action' },
        { key: 'Ctrl + Y', description: 'Redo last action' },
        { key: 'Ctrl + Arrow keys', description: 'Move canvas scroll bar' },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowMenu(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showMenu) {
                setShowMenu(false);
                speak('Keyboard shortcuts menu closed');
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showMenu, speak]);

    const handleToggle = () => {
        const newState = !showMenu;
        setShowMenu(newState);
        speak(newState ? 'Keyboard shortcuts menu opened' : 'Keyboard shortcuts menu closed');
    };

    return (
        <div className="keyboard-shortcuts-hint-container">
            <ToolTip message="Keyboard Shortcuts" placement="right">
                <div
                    ref={buttonRef}
                    className="cursor-pointer tj-leftsidebar-icon-items"
                    onClick={handleToggle}
                    onFocus={() => speak('Keyboard shortcuts button')}
                    onMouseEnter={() => speak('Keyboard shortcuts')}
                    tabIndex="0"
                    role="button"
                    aria-label="Show keyboard shortcuts"
                    aria-expanded={showMenu}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggle();
                        }
                    }}
                    data-cy="keyboard-shortcuts-button"
                >
                    <SolidIcon name="help" fill="var(--slate8)" />
                </div>
            </ToolTip>

            {showMenu && (
                <div
                    ref={menuRef}
                    className={`keyboard-shortcuts-menu ${darkMode ? 'dark-theme' : ''}`}
                    role="menu"
                    aria-label="Keyboard shortcuts list"
                >
                    <div className="shortcuts-header">
                        <span className="shortcuts-title">Keyboard Shortcuts</span>
                    </div>
                    <div className="shortcuts-list">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="shortcut-item"
                                tabIndex="0"
                                role="menuitem"
                                onFocus={() => speak(`${shortcut.key}, ${shortcut.description}`)}
                                onMouseEnter={() => speak(`${shortcut.key}, ${shortcut.description}`)}
                                data-cy={`shortcut-item-${index}`}
                            >
                                <kbd className="shortcut-key">{shortcut.key}</kbd>
                                <span className="shortcut-description">{shortcut.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeyboardShortcutsHint;
