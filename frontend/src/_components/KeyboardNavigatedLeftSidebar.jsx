import React, { useEffect, useRef, useCallback } from 'react';
import useKeyboardNavigation from '@/_hooks/useKeyboardNavigation';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard navigation wrapper for the Left Sidebar
 * Enables arrow key navigation through sidebar options (Inspector, Data Sources, Debugger, etc.)
 */
const KeyboardNavigatedLeftSidebar = ({
    children,
    onSidebarItemSelect = null,
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
        containerId: 'left-sidebar',
        itemSelector: '.sidebar-item, .left-sidebar-item, [data-sidebar-nav], button[data-cy]',
        onSelect: (index, element) => {
            // Add accessibility attributes
            element.setAttribute('aria-selected', 'true');
            element.setAttribute('aria-describedby', 'sidebar-description');

            // Get sidebar item info for screen readers
            const itemText = element.textContent?.trim() || element.getAttribute('aria-label') || 'Sidebar item';
            element.setAttribute('aria-label', `${itemText} - Press Enter to activate`);

            // Remove aria-selected from other items
            const allItems = wrapperRef.current?.querySelectorAll('.sidebar-item, .left-sidebar-item, [data-sidebar-nav], button[data-cy]');
            allItems?.forEach(item => {
                if (item !== element) {
                    item.setAttribute('aria-selected', 'false');
                }
            });

            // Highlight the sidebar item
            highlightSidebarItem(element);
        },
        onEnter: (index, element) => {
            // Activate the sidebar item
            const itemText = element.textContent?.trim() || 'Sidebar item';
            const itemType = element.getAttribute('data-sidebar-type') || 'unknown';

            // Trigger click event on the element
            element.click();

            // Create custom event for sidebar item selection
            const selectEvent = new CustomEvent('sidebar-keyboard-select', {
                detail: {
                    index,
                    element,
                    itemText,
                    itemType
                }
            });

            element.dispatchEvent(selectEvent);

            if (onSidebarItemSelect) {
                onSidebarItemSelect(index, element, itemText);
            }

            // Announce to screen readers
            announceSidebarSelection(itemText);
        },
        direction: 'vertical'
    });

    // Highlight sidebar item with keyboard focus
    const highlightSidebarItem = useCallback((element) => {
        // Remove highlight from all items
        const allItems = wrapperRef.current?.querySelectorAll('.sidebar-item, .left-sidebar-item, [data-sidebar-nav], button[data-cy]');
        allItems?.forEach(item => {
            item.classList.remove('keyboard-focused-sidebar');
        });

        // Add highlight to current item
        element.classList.add('keyboard-focused-sidebar');

        // Ensure item is visible
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, []);

    // Announce sidebar selection to screen readers
    const announceSidebarSelection = useCallback((itemText) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${itemText} activated. Use arrow keys to navigate other sidebar options.`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    // Register with keyboard navigation manager
    useEffect(() => {
        if (!disabled) {
            registerArea(AREAS.LEFT_SIDEBAR, {
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
                unregisterArea(AREAS.LEFT_SIDEBAR);
            };
        }
    }, [disabled, activate, deactivate, focusItem, updateItems, handleNavigation, registerArea, unregisterArea, AREAS.LEFT_SIDEBAR]);

    // Set up container ref
    useEffect(() => {
        if (wrapperRef.current) {
            containerRef.current = wrapperRef.current;
        }
    }, []);

    // Add sidebar data attributes for keyboard navigation
    useEffect(() => {
        const addSidebarAttributes = () => {
            // Common sidebar selectors
            const selectors = [
                '.sidebar-item',
                '.left-sidebar-item',
                'button[data-cy]',
                '.sidebar-nav-item',
                '.popover-trigger',
                '[role="button"]'
            ];

            selectors.forEach(selector => {
                const items = wrapperRef.current?.querySelectorAll(selector);
                items?.forEach((item, index) => {
                    if (!item.getAttribute('data-sidebar-nav')) {
                        item.setAttribute('data-sidebar-nav', 'true');
                        item.setAttribute('data-sidebar-index', index);
                        item.setAttribute('role', 'button');
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('aria-selected', 'false');

                        // Get item info for accessibility
                        const itemText = item.textContent?.trim() ||
                            item.getAttribute('aria-label') ||
                            item.getAttribute('title') ||
                            'Sidebar option';

                        item.setAttribute('aria-label', `${itemText} - Press Enter to activate`);

                        // Determine item type
                        const itemType = item.getAttribute('data-cy') ||
                            item.className.split(' ')[0] ||
                            'sidebar-item';
                        item.setAttribute('data-sidebar-type', itemType);
                    }
                });
            });
        };

        // Add attributes initially and when DOM changes
        addSidebarAttributes();

        // Observer for dynamic content
        const observer = new MutationObserver(addSidebarAttributes);
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
            className={`keyboard-navigated-left-sidebar keyboard-nav-area ${isActive ? 'active' : ''}`}
            role="navigation"
            aria-label="Left Sidebar - Editor navigation and tools"
            aria-description="Use arrow keys to navigate between sidebar options, Enter to activate"
        >
            {/* Hidden description for screen readers */}
            <div id="sidebar-description" className="sr-only">
                Navigate through sidebar options using up and down arrow keys. Press Enter to activate the focused option.
                Current focus: {focusedIndex >= 0 ? `Option ${focusedIndex + 1}` : 'None'}
            </div>

            {children}

            {/* Sidebar status for screen readers */}
            <div className="sr-only" aria-live="polite">
                {isActive ? 'Left sidebar navigation active' : ''}
            </div>
        </div>
    );
};

export default KeyboardNavigatedLeftSidebar;