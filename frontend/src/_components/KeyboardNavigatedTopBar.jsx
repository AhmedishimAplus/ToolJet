import React, { useEffect, useRef, useCallback } from 'react';
import useKeyboardNavigation from '@/_hooks/useKeyboardNavigation';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard navigation wrapper for the Top Bar
 * Enables arrow key navigation through toolbar buttons, menus, and controls
 */
const KeyboardNavigatedTopBar = ({
    children,
    onTopBarItemSelect = null,
    disabled = false
}) => {
    const wrapperRef = useRef(null);
    const { registerArea, unregisterArea, AREAS } = useKeyboardNavigationContext();

    const {
        containerRef,
        focusedIndex,
        isActive,
        activate,
        deactivate,
        focusItem,
        updateItems,
        handleNavigation
    } = useKeyboardNavigation({
        containerId: 'top-bar',
        itemSelector: 'button, .btn, .toolbar-item, [role="button"], .dropdown-toggle, .nav-item',
        onSelect: (index, element) => {
            // Add accessibility attributes
            element.setAttribute('aria-selected', 'true');
            element.setAttribute('aria-describedby', 'topbar-description');

            // Get item info for screen readers
            const itemText = element.textContent?.trim() ||
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                'Top bar item';

            element.setAttribute('aria-label', `${itemText} - Press Enter to activate`);

            // Remove aria-selected from other items
            const allItems = wrapperRef.current?.querySelectorAll('button, .btn, .toolbar-item, [role="button"], .dropdown-toggle, .nav-item');
            allItems?.forEach(item => {
                if (item !== element) {
                    item.setAttribute('aria-selected', 'false');
                }
            });

            // Highlight the item
            highlightTopBarItem(element);
        },
        onEnter: (index, element) => {
            // Activate the top bar item
            const itemText = element.textContent?.trim() || 'Top bar item';

            // Trigger click event
            element.click();

            // Create custom event
            const selectEvent = new CustomEvent('topbar-keyboard-select', {
                detail: {
                    index,
                    element,
                    itemText
                }
            });

            element.dispatchEvent(selectEvent);

            if (onTopBarItemSelect) {
                onTopBarItemSelect(index, element, itemText);
            }

            // Announce to screen readers
            announceTopBarSelection(itemText);
        },
        direction: 'horizontal'
    });

    // Highlight top bar item with keyboard focus
    const highlightTopBarItem = useCallback((element) => {
        // Remove highlight from all items
        const allItems = wrapperRef.current?.querySelectorAll('button, .btn, .toolbar-item, [role="button"], .dropdown-toggle, .nav-item');
        allItems?.forEach(item => {
            item.classList.remove('keyboard-focused');
        });

        // Add highlight to current item
        element.classList.add('keyboard-focused');

        // Ensure item is visible
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });
    }, []);

    // Announce selection to screen readers
    const announceTopBarSelection = useCallback((itemText) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${itemText} activated.`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    // Register with keyboard navigation manager
    useEffect(() => {
        if (!disabled) {
            registerArea(AREAS.TOP_BAR, {
                element: containerRef.current,
                activate: (startIndex = 0) => {
                    updateItems();
                    activate(startIndex);
                },
                deactivate: () => {
                    deactivate();
                },
                handleNavigation,
                focusItem,
                updateItems
            });

            return () => {
                unregisterArea(AREAS.TOP_BAR);
            };
        }
    }, [disabled, activate, deactivate, focusItem, updateItems, handleNavigation, registerArea, unregisterArea, AREAS.TOP_BAR]);

    // Set up container ref
    useEffect(() => {
        if (wrapperRef.current) {
            containerRef.current = wrapperRef.current;
        }
    }, []);

    // Add data attributes for keyboard navigation
    useEffect(() => {
        const addTopBarAttributes = () => {
            const selectors = [
                'button',
                '.btn',
                '.toolbar-item',
                '[role="button"]',
                '.dropdown-toggle',
                '.nav-item'
            ];

            selectors.forEach(selector => {
                const items = wrapperRef.current?.querySelectorAll(selector);
                items?.forEach((item, index) => {
                    if (!item.getAttribute('data-topbar-nav')) {
                        item.setAttribute('data-topbar-nav', 'true');
                        item.setAttribute('data-topbar-index', index);
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('aria-selected', 'false');

                        // Get item info for accessibility
                        const itemText = item.textContent?.trim() ||
                            item.getAttribute('aria-label') ||
                            item.getAttribute('title') ||
                            'Top bar item';

                        item.setAttribute('aria-label', `${itemText} - Press Enter to activate`);
                    }
                });
            });
        };

        // Add attributes initially and when DOM changes
        addTopBarAttributes();

        // Observer for dynamic content
        const observer = new MutationObserver(addTopBarAttributes);
        if (wrapperRef.current) {
            observer.observe(wrapperRef.current, {
                childList: true,
                subtree: true,
                attributes: false
            });
        }

        return () => observer.disconnect();
    }, [children]);

    return (
        <div
            ref={wrapperRef}
            className={`keyboard-navigated-top-bar keyboard-nav-area ${isActive ? 'active' : ''}`}
            role="banner"
            aria-label="Top Bar - Application toolbar and navigation"
            aria-description="Use arrow keys to navigate between toolbar items, Enter to activate"
        >
            {/* Hidden description for screen readers */}
            <div id="topbar-description" className="sr-only">
                Navigate through top bar items using left and right arrow keys. Press Enter to activate the focused item.
                Current focus: {focusedIndex >= 0 ? `Item ${focusedIndex + 1}` : 'None'}
            </div>

            {children}

            {/* Top bar status for screen readers */}
            <div className="sr-only" aria-live="polite">
                {isActive ? 'Top bar navigation active' : ''}
            </div>
        </div>
    );
};

export default KeyboardNavigatedTopBar;