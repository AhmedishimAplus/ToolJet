import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const KeyboardNavigationContext = createContext();

/**
 * Navigation Areas - 5 total areas that can be navigated between
 */
export const NAVIGATION_AREAS = {
    TOP_BAR: 'TOP_BAR',
    LEFT_SIDEBAR: 'LEFT_SIDEBAR',
    CANVAS: 'CANVAS',
    RIGHT_SIDEBAR: 'RIGHT_SIDEBAR',
    QUERY_PANEL: 'QUERY_PANEL'
};

/**
 * Navigation Modes
 */
export const NAVIGATION_MODES = {
    BAR_TO_BAR: 'BAR_TO_BAR',    // Ctrl+Arrow to move between bars (blue outline)
    WITHIN_BAR: 'WITHIN_BAR'     // Arrow keys to navigate within bar (red outline)
};

/**
 * Advanced Keyboard Navigation Manager
 * Supports 2-mode navigation:
 * 1. Bar-to-bar mode: Ctrl+Arrow keys to move between 5 areas
 * 2. Within-bar mode: Arrow keys to navigate within the selected area
 */
const KeyboardNavigationManager = ({ children, disabled = false }) => {
    // Navigation state
    const [currentMode, setCurrentMode] = useState(NAVIGATION_MODES.BAR_TO_BAR);
    const [currentArea, setCurrentArea] = useState(NAVIGATION_AREAS.LEFT_SIDEBAR);
    const [registeredAreas, setRegisteredAreas] = useState({});
    const [shortcutGuideVisible, setShortcutGuideVisible] = useState(false);

    // References
    const keyListenerRef = useRef(null);
    const isActiveRef = useRef(true); // Always active (permanently on)

    // Toggle shortcut guide visibility
    const toggleShortcutGuide = useCallback(() => {
        setShortcutGuideVisible(prev => !prev);
    }, []);

    // Area registration
    const registerArea = useCallback((areaId, config) => {
        console.log('Registering area:', areaId, config);
        setRegisteredAreas(prev => ({
            ...prev,
            [areaId]: config
        }));
    }, []);

    const unregisterArea = useCallback((areaId) => {
        console.log('Unregistering area:', areaId);
        setRegisteredAreas(prev => {
            const newAreas = { ...prev };
            delete newAreas[areaId];
            return newAreas;
        });
    }, []);

    // Visual feedback - Add/remove outline styles
    const updateAreaOutline = useCallback((areaId, mode) => {
        // Remove all outlines first
        Object.keys(NAVIGATION_AREAS).forEach(area => {
            const config = registeredAreas[area];
            if (config && config.element) {
                config.element.classList.remove('keyboard-nav-blue-outline', 'keyboard-nav-red-outline');
            }
        });

        // Add appropriate outline to current area
        const config = registeredAreas[areaId];
        if (config && config.element) {
            const outlineClass = mode === NAVIGATION_MODES.BAR_TO_BAR
                ? 'keyboard-nav-blue-outline'
                : 'keyboard-nav-red-outline';
            config.element.classList.add(outlineClass);
        }
    }, [registeredAreas]);

    // Get next area in navigation order
    const getNextArea = useCallback((direction) => {
        const areaOrder = [
            NAVIGATION_AREAS.TOP_BAR,
            NAVIGATION_AREAS.LEFT_SIDEBAR,
            NAVIGATION_AREAS.CANVAS,
            NAVIGATION_AREAS.RIGHT_SIDEBAR,
            NAVIGATION_AREAS.QUERY_PANEL
        ];

        const currentIndex = areaOrder.indexOf(currentArea);
        let nextIndex;

        switch (direction) {
            case 'ArrowUp':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : areaOrder.length - 1;
                break;
            case 'ArrowDown':
                nextIndex = currentIndex < areaOrder.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowLeft':
                // Left: Top Bar -> Left Sidebar -> Query Panel
                if (currentArea === NAVIGATION_AREAS.TOP_BAR) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.LEFT_SIDEBAR);
                else if (currentArea === NAVIGATION_AREAS.CANVAS) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.LEFT_SIDEBAR);
                else if (currentArea === NAVIGATION_AREAS.RIGHT_SIDEBAR) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.CANVAS);
                else nextIndex = currentIndex;
                break;
            case 'ArrowRight':
                // Right: Left Sidebar -> Canvas -> Right Sidebar
                if (currentArea === NAVIGATION_AREAS.LEFT_SIDEBAR) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.CANVAS);
                else if (currentArea === NAVIGATION_AREAS.CANVAS) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.RIGHT_SIDEBAR);
                else if (currentArea === NAVIGATION_AREAS.TOP_BAR) nextIndex = areaOrder.indexOf(NAVIGATION_AREAS.RIGHT_SIDEBAR);
                else nextIndex = currentIndex;
                break;
            default:
                nextIndex = currentIndex;
        }

        return areaOrder[nextIndex];
    }, [currentArea]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event) => {
        if (disabled) {
            console.log('Keyboard navigation disabled');
            return;
        }

        const { key, ctrlKey } = event;
        console.log('Key pressed:', { key, ctrlKey, currentMode, currentArea, registeredAreasCount: Object.keys(registeredAreas).length });

        // Bar-to-bar navigation (Ctrl + Arrow keys)
        if (currentMode === NAVIGATION_MODES.BAR_TO_BAR && ctrlKey &&
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {

            event.preventDefault();
            const nextArea = getNextArea(key);

            if (nextArea !== currentArea && registeredAreas[nextArea]) {
                setCurrentArea(nextArea);
                updateAreaOutline(nextArea, NAVIGATION_MODES.BAR_TO_BAR);

                // Announce area change
                announceAreaChange(nextArea);
            }
            return;
        }

        // Enter bar (Enter key in bar-to-bar mode)
        if (currentMode === NAVIGATION_MODES.BAR_TO_BAR && key === 'Enter') {
            event.preventDefault();
            const areaConfig = registeredAreas[currentArea];

            if (areaConfig && areaConfig.activate) {
                setCurrentMode(NAVIGATION_MODES.WITHIN_BAR);
                updateAreaOutline(currentArea, NAVIGATION_MODES.WITHIN_BAR);
                areaConfig.activate();

                // Announce mode change
                announceWithinBarMode(currentArea);
            }
            return;
        }

        // Exit bar (Escape key in within-bar mode)
        if (currentMode === NAVIGATION_MODES.WITHIN_BAR && key === 'Escape') {
            event.preventDefault();
            const areaConfig = registeredAreas[currentArea];

            if (areaConfig && areaConfig.deactivate) {
                areaConfig.deactivate();
            }

            setCurrentMode(NAVIGATION_MODES.BAR_TO_BAR);
            updateAreaOutline(currentArea, NAVIGATION_MODES.BAR_TO_BAR);

            // Announce mode change
            announceBarToBarMode();
            return;
        }

        // Within-bar navigation (Arrow keys in within-bar mode)
        if (currentMode === NAVIGATION_MODES.WITHIN_BAR &&
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {

            const areaConfig = registeredAreas[currentArea];
            if (areaConfig && areaConfig.handleNavigation) {
                areaConfig.handleNavigation(event);
            }
            return;
        }

    }, [currentMode, currentArea, registeredAreas, disabled, getNextArea, updateAreaOutline]);

    // Screen reader announcements
    const announceAreaChange = (areaId) => {
        const areaNames = {
            [NAVIGATION_AREAS.TOP_BAR]: 'Top Bar',
            [NAVIGATION_AREAS.LEFT_SIDEBAR]: 'Left Sidebar',
            [NAVIGATION_AREAS.CANVAS]: 'Canvas Area',
            [NAVIGATION_AREAS.RIGHT_SIDEBAR]: 'Widget Manager',
            [NAVIGATION_AREAS.QUERY_PANEL]: 'Query Panel'
        };

        announceToScreenReader(`Focused on ${areaNames[areaId]}. Press Enter to navigate within this area.`);
    };

    const announceWithinBarMode = (areaId) => {
        const areaNames = {
            [NAVIGATION_AREAS.TOP_BAR]: 'Top Bar',
            [NAVIGATION_AREAS.LEFT_SIDEBAR]: 'Left Sidebar',
            [NAVIGATION_AREAS.CANVAS]: 'Canvas Area',
            [NAVIGATION_AREAS.RIGHT_SIDEBAR]: 'Widget Manager',
            [NAVIGATION_AREAS.QUERY_PANEL]: 'Query Panel'
        };

        announceToScreenReader(`Entered ${areaNames[areaId]}. Use arrow keys to navigate. Press Escape to exit.`);
    };

    const announceBarToBarMode = () => {
        announceToScreenReader('Exited to area navigation mode. Use Ctrl+Arrow keys to move between areas.');
    };

    const announceToScreenReader = (message) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    // Set up keyboard listeners
    useEffect(() => {
        if (!disabled) {
            keyListenerRef.current = handleKeyDown;
            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [handleKeyDown, disabled]);

    // Initialize with default area outline
    useEffect(() => {
        if (!disabled && Object.keys(registeredAreas).length > 0) {
            updateAreaOutline(currentArea, currentMode);
        }
    }, [registeredAreas, currentArea, currentMode, disabled, updateAreaOutline]);

    // Context value
    const contextValue = {
        // Registration
        registerArea,
        unregisterArea,

        // State
        currentMode,
        currentArea,
        isActive: isActiveRef.current && !disabled,
        shortcutGuideVisible,

        // Constants
        AREAS: NAVIGATION_AREAS,
        MODES: NAVIGATION_MODES,

        // Helpers
        announceToScreenReader,
        toggleShortcutGuide
    };

    return (
        <KeyboardNavigationContext.Provider value={contextValue}>
            <div className="keyboard-navigation-manager">
                {/* Shortcut Reference - Toggleable */}
                {shortcutGuideVisible && (
                    <div className="keyboard-nav-shortcuts" style={{
                        position: 'fixed',
                        top: '60px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        zIndex: 99999,
                        display: 'block',
                        border: '1px solid #4c93ff',
                        minWidth: '220px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ marginBottom: '8px' }}><strong>🎮 Keyboard Navigation</strong></div>
                        <div>Ctrl+↑↓←→ Move between areas</div>
                        <div>Enter: Enter area</div>
                        <div>↑↓←→ Navigate within area</div>
                        <div>Esc: Exit to area mode</div>
                        <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7, borderTop: '1px solid #444', paddingTop: '6px' }}>
                            Mode: {currentMode === NAVIGATION_MODES.BAR_TO_BAR ? 'Area Selection' : 'Within Area'}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            Areas: {Object.keys(registeredAreas).length} | Current: {currentArea}
                        </div>
                    </div>
                )}

                {children}
            </div>
        </KeyboardNavigationContext.Provider>
    );
};

// Hook to use the keyboard navigation context
export const useKeyboardNavigationContext = () => {
    const context = useContext(KeyboardNavigationContext);
    if (!context) {
        throw new Error('useKeyboardNavigationContext must be used within a KeyboardNavigationManager');
    }
    return context;
};

export default KeyboardNavigationManager;