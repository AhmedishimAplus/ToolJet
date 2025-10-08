import React, { useEffect, useRef, useCallback } from 'react';
import useKeyboardNavigation from '@/_hooks/useKeyboardNavigation';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard navigation wrapper for the Query Panel (Bottom Panel)
 * Enables arrow key navigation through queries, tabs, and controls
 */
const KeyboardNavigatedQueryPanel = ({
    children,
    onQueryPanelItemSelect = null,
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
        containerId: 'query-panel',
        itemSelector: '.query-tab, .query-item, button, .btn, .query-control, [role="tab"], [role="button"]',
        onSelect: (index, element) => {
            // Add accessibility attributes
            element.setAttribute('aria-selected', 'true');
            element.setAttribute('aria-describedby', 'querypanel-description');

            // Get item info for screen readers
            const itemText = element.textContent?.trim() ||
                element.getAttribute('aria-label') ||
                element.getAttribute('title') ||
                'Query panel item';

            element.setAttribute('aria-label', `${itemText} - Press Enter to activate`);

            // Remove aria-selected from other items
            const allItems = wrapperRef.current?.querySelectorAll('.query-tab, .query-item, button, .btn, .query-control, [role="tab"], [role="button"]');
            allItems?.forEach(item => {
                if (item !== element) {
                    item.setAttribute('aria-selected', 'false');
                }
            });

            // Highlight the item
            highlightQueryPanelItem(element);
        },
        onEnter: (index, element) => {
            // Activate the query panel item
            const itemText = element.textContent?.trim() || 'Query panel item';

            // Trigger click event
            element.click();

            // Create custom event
            const selectEvent = new CustomEvent('querypanel-keyboard-select', {
                detail: {
                    index,
                    element,
                    itemText
                }
            });

            element.dispatchEvent(selectEvent);

            if (onQueryPanelItemSelect) {
                onQueryPanelItemSelect(index, element, itemText);
            }

            // Announce to screen readers
            announceQueryPanelSelection(itemText);
        },
        direction: 'horizontal'
    });

    // Highlight query panel item with keyboard focus
    const highlightQueryPanelItem = useCallback((element) => {
        // Remove highlight from all items
        const allItems = wrapperRef.current?.querySelectorAll('.query-tab, .query-item, button, .btn, .query-control, [role="tab"], [role="button"]');
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
    const announceQueryPanelSelection = useCallback((itemText) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${itemText} activated in query panel.`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    // Register with keyboard navigation manager
    useEffect(() => {
        if (!disabled) {
            registerArea(AREAS.QUERY_PANEL, {
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
                unregisterArea(AREAS.QUERY_PANEL);
            };
        }
    }, [disabled, activate, deactivate, focusItem, updateItems, handleNavigation, registerArea, unregisterArea, AREAS.QUERY_PANEL]);

    // Set up container ref
    useEffect(() => {
        if (wrapperRef.current) {
            containerRef.current = wrapperRef.current;
        }
    }, []);

    // Add data attributes for keyboard navigation
    useEffect(() => {
        const addQueryPanelAttributes = () => {
            const selectors = [
                '.query-tab',
                '.query-item',
                'button',
                '.btn',
                '.query-control',
                '[role="tab"]',
                '[role="button"]'
            ];

            selectors.forEach(selector => {
                const items = wrapperRef.current?.querySelectorAll(selector);
                items?.forEach((item, index) => {
                    if (!item.getAttribute('data-querypanel-nav')) {
                        item.setAttribute('data-querypanel-nav', 'true');
                        item.setAttribute('data-querypanel-index', index);
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('aria-selected', 'false');

                        // Get item info for accessibility
                        const itemText = item.textContent?.trim() ||
                            item.getAttribute('aria-label') ||
                            item.getAttribute('title') ||
                            'Query panel item';

                        item.setAttribute('aria-label', `${itemText} - Press Enter to activate`);
                    }
                });
            });
        };

        // Add attributes initially and when DOM changes
        addQueryPanelAttributes();

        // Observer for dynamic content
        const observer = new MutationObserver(addQueryPanelAttributes);
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
            className={`keyboard-navigated-query-panel keyboard-nav-area ${isActive ? 'active' : ''}`}
            role="region"
            aria-label="Query Panel - Data queries and operations"
            aria-description="Use arrow keys to navigate between query items, Enter to activate"
        >
            {/* Hidden description for screen readers */}
            <div id="querypanel-description" className="sr-only">
                Navigate through query panel items using left and right arrow keys. Press Enter to activate the focused item.
                Current focus: {focusedIndex >= 0 ? `Item ${focusedIndex + 1}` : 'None'}
            </div>

            {children}

            {/* Query panel status for screen readers */}
            <div className="sr-only" aria-live="polite">
                {isActive ? 'Query panel navigation active' : ''}
            </div>
        </div>
    );
};

export default KeyboardNavigatedQueryPanel;