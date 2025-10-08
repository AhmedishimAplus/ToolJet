import React, { useEffect, useRef, useCallback } from 'react';
import useKeyboardNavigation from '@/_hooks/useKeyboardNavigation';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard navigation wrapper for the Widget Manager (Right Sidebar)
 * Enables arrow key navigation through draggable widgets in a grid layout
 */
const KeyboardNavigatedWidgetManager = ({
    children,
    onWidgetSelect = null,
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
        containerId: 'widget-manager',
        itemSelector: '.widget-item, .draggable-widget, [data-widget-type], .toolbox-widget',
        onSelect: (index, element) => {
            // Add accessibility attributes
            element.setAttribute('aria-selected', 'true');
            element.setAttribute('aria-describedby', 'widget-description');

            // Get widget info for screen readers
            const widgetType = element.getAttribute('data-widget-type') ||
                element.textContent?.trim() || 'Widget';

            element.setAttribute('aria-label', `${widgetType} widget - Press Enter to select for dragging`);

            // Remove aria-selected from other widgets
            const allWidgets = wrapperRef.current?.querySelectorAll('.widget-item, .draggable-widget, [data-widget-type], .toolbox-widget');
            allWidgets?.forEach(widget => {
                if (widget !== element) {
                    widget.setAttribute('aria-selected', 'false');
                }
            });

            // Highlight the widget
            highlightWidget(element);
        },
        onEnter: (index, element) => {
            // Activate widget for dragging
            const widgetType = element.getAttribute('data-widget-type') ||
                element.textContent?.trim() || 'Widget';

            // Create custom event for widget selection
            const selectEvent = new CustomEvent('widget-keyboard-select', {
                detail: {
                    index,
                    element,
                    widgetType
                }
            });

            element.dispatchEvent(selectEvent);

            // Trigger drag start if possible
            if (element.draggable) {
                const dragEvent = new DragEvent('dragstart', {
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(dragEvent);
            } else {
                // Fallback: trigger click
                element.click();
            }

            if (onWidgetSelect) {
                onWidgetSelect(index, element, widgetType);
            }

            // Announce to screen readers
            announceWidgetSelection(widgetType);
        },
        direction: 'grid',
        gridColumns: 3 // Typical widget manager has 3 columns
    });

    // Highlight widget with keyboard focus
    const highlightWidget = useCallback((element) => {
        // Remove highlight from all widgets
        const allWidgets = wrapperRef.current?.querySelectorAll('.widget-item, .draggable-widget, [data-widget-type], .toolbox-widget');
        allWidgets?.forEach(widget => {
            widget.classList.remove('keyboard-focused-widget');
        });

        // Add highlight to current widget
        element.classList.add('keyboard-focused-widget');

        // Ensure widget is visible
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, []);

    // Announce widget selection to screen readers
    const announceWidgetSelection = useCallback((widgetType) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${widgetType} widget selected. Drag to canvas to add to your application.`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    // Register with keyboard navigation manager
    useEffect(() => {
        if (!disabled) {
            registerArea(AREAS.RIGHT_SIDEBAR, {
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
                unregisterArea(AREAS.RIGHT_SIDEBAR);
            };
        }
    }, [disabled, activate, deactivate, focusItem, updateItems, handleNavigation, registerArea, unregisterArea, AREAS.RIGHT_SIDEBAR]);

    // Set up container ref
    useEffect(() => {
        if (wrapperRef.current) {
            containerRef.current = wrapperRef.current;
        }
    }, []);

    // Add widget data attributes for keyboard navigation
    useEffect(() => {
        const addWidgetAttributes = () => {
            // Common widget selectors
            const selectors = [
                '.widget-item',
                '.draggable-widget',
                '[data-widget-type]',
                '.toolbox-widget',
                '.toolbox-item',
                '.widget-card'
            ];

            selectors.forEach(selector => {
                const items = wrapperRef.current?.querySelectorAll(selector);
                items?.forEach((item, index) => {
                    if (!item.getAttribute('data-widget-nav')) {
                        item.setAttribute('data-widget-nav', 'true');
                        item.setAttribute('data-widget-index', index);
                        item.setAttribute('role', 'button');
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('aria-selected', 'false');
                        item.setAttribute('draggable', 'true');

                        // Get widget info for accessibility
                        const widgetType = item.getAttribute('data-widget-type') ||
                            item.textContent?.trim() ||
                            item.querySelector('.widget-name')?.textContent?.trim() ||
                            `Widget ${index + 1}`;

                        item.setAttribute('aria-label', `${widgetType} widget - Press Enter to select for dragging`);

                        if (!item.getAttribute('data-widget-type')) {
                            item.setAttribute('data-widget-type', widgetType);
                        }
                    }
                });
            });
        };

        // Add attributes initially and when DOM changes
        addWidgetAttributes();

        // Observer for dynamic content
        const observer = new MutationObserver(addWidgetAttributes);
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
            className={`keyboard-navigated-widget-manager keyboard-nav-area ${isActive ? 'active' : ''}`}
            role="region"
            aria-label="Widget Manager - Available widgets for your application"
            aria-description="Use arrow keys to navigate between widgets, Enter to select for dragging"
        >
            {/* Hidden description for screen readers */}
            <div id="widget-description" className="sr-only">
                Navigate through available widgets using arrow keys. Press Enter to select a widget for dragging to the canvas.
                Current focus: {focusedIndex >= 0 ? `Widget ${focusedIndex + 1}` : 'None'}
            </div>

            {children}

            {/* Widget manager status for screen readers */}
            <div className="sr-only" aria-live="polite">
                {isActive ? 'Widget manager navigation active' : ''}
            </div>
        </div>
    );
};

export default KeyboardNavigatedWidgetManager;