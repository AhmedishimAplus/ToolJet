import React, { useEffect, useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import './KeyboardNavigation.scss';

const KeyboardNavigation = () => {
    const [isActive, setIsActive] = useState(false);

    // Get all focusable elements on the page in logical order
    const getFocusableElements = useCallback(() => {
        const selectors = [
            // Sidebar navigation items (top to bottom)
            '.tj-leftsidebar-icon-items[data-cy="icon-dashboard"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-workflows"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-database"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-global-datasources"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-workspace-constants"]',
            // Bottom sidebar items
            '.notification-center-nav-item',
            '.tj-leftsidebar-icon-items[data-cy="mode-switch-button"]',
            '.settings-nav-item',
            // Main content area
            '.homepage-app-card-list-item .app-card',
            // Other interactive elements
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'a[href]:not([disabled])',
            '[tabindex="0"]:not([disabled])'
        ];

        const elements = [];

        // Add elements in order of selectors
        selectors.forEach(selector => {
            const foundElements = Array.from(document.querySelectorAll(selector))
                .filter(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 0 &&
                        rect.height > 0 &&
                        el.offsetParent !== null;
                });
            elements.push(...foundElements);
        });

        // Remove duplicates while preserving order
        const uniqueElements = [];
        const seen = new Set();

        elements.forEach(el => {
            if (!seen.has(el)) {
                seen.add(el);
                uniqueElements.push(el);
            }
        });

        return uniqueElements;
    }, []);

    // Navigate to next focusable element
    const navigateToNext = useCallback(() => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const currentIndex = elements.findIndex(el => el === document.activeElement);
        const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;

        if (elements[nextIndex]) {
            elements[nextIndex].focus();
            elements[nextIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }, [getFocusableElements]);

    // Navigate to previous focusable element
    const navigateToPrevious = useCallback(() => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const currentIndex = elements.findIndex(el => el === document.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;

        if (elements[prevIndex]) {
            elements[prevIndex].focus();
            elements[prevIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }, [getFocusableElements]);

    // Activate focused element
    const activateElement = useCallback(() => {
        const activeElement = document.activeElement;
        if (activeElement) {
            // Trigger click event
            activeElement.click();
        }
    }, []);

    // Handle escape to exit keyboard navigation
    const handleEscape = useCallback(() => {
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
            setIsActive(false);
        }
    }, []);

    // Start keyboard navigation mode
    const startNavigation = useCallback(() => {
        const elements = getFocusableElements();
        if (elements.length > 0) {
            elements[0].focus();
            setIsActive(true);
        }
    }, [getFocusableElements]);

    // Arrow key and tab navigation
    useHotkeys('down', (e) => {
        e.preventDefault();
        navigateToNext();
        setIsActive(true);
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('up', (e) => {
        e.preventDefault();
        navigateToPrevious();
        setIsActive(true);
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('tab', (e) => {
        e.preventDefault();
        navigateToNext();
        setIsActive(true);
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('shift+tab', (e) => {
        e.preventDefault();
        navigateToPrevious();
        setIsActive(true);
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('enter', (e) => {
        e.preventDefault();
        activateElement();
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('space', (e) => {
        if (document.activeElement && document.activeElement.getAttribute('role') === 'button') {
            e.preventDefault();
            activateElement();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('escape', handleEscape);
    useHotkeys('f1', (e) => {
        e.preventDefault();
        startNavigation();
    });

    // Auto-focus on first sidebar element when page loads
    useEffect(() => {
        const timer = setTimeout(() => {
            const firstElement = document.querySelector('.tj-leftsidebar-icon-items[data-cy="icon-dashboard"]');
            if (firstElement && (!document.activeElement || document.activeElement === document.body)) {
                firstElement.focus();
                setIsActive(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Show keyboard navigation hint
    return (
        <>
            {isActive && (
                <div className="keyboard-navigation-hint visible">
                    ↑↓ Navigate • Enter Activate • Esc Exit
                </div>
            )}
        </>
    );
};

export default KeyboardNavigation;