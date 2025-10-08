import React, { useEffect, useRef, useCallback } from 'react';
import useKeyboardNavigation from '@/_hooks/useKeyboardNavigation';
import { useKeyboardNavigationContext } from './KeyboardNavigationManager';

/**
 * Keyboard navigation wrapper for the Canvas Area
 * Enables arrow key navigation through placed components
 */
const KeyboardNavigatedCanvas = ({
    children,
    setSelectedComponent,
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
        containerId: 'canvas',
        itemSelector: '.react-draggable, .canvas-component, [data-component-id]',
        onSelect: (index, element) => {
            // Add accessibility attributes
            element.setAttribute('aria-selected', 'true');
            element.setAttribute('aria-describedby', 'canvas-description');

            // Get component info
            const componentId = element.getAttribute('data-component-id') || element.id;
            const componentType = element.getAttribute('data-component-type') || 'Component';

            // Remove aria-selected from other components
            const allComponents = wrapperRef.current?.querySelectorAll('.react-draggable, .canvas-component, [data-component-id]');
            allComponents?.forEach(comp => {
                if (comp !== element) {
                    comp.setAttribute('aria-selected', 'false');
                }
            });

            // Highlight the component
            highlightComponent(element);

            // Update ToolJet's component selection if available
            if (setSelectedComponent && componentId) {
                setSelectedComponent(componentId);
            }
        },
        onEnter: (index, element) => {
            // Activate component selection
            const componentId = element.getAttribute('data-component-id') || element.id;
            const componentType = element.getAttribute('data-component-type') || 'Component';

            // Trigger click event for component selection
            element.click();

            // Create custom event for component selection
            const selectEvent = new CustomEvent('canvas-keyboard-select', {
                detail: {
                    index,
                    element,
                    componentId,
                    componentType
                }
            });

            element.dispatchEvent(selectEvent);

            // Announce to screen readers
            announceComponentSelection(componentType, componentId);
        },
        direction: 'both'
    });

    // Highlight component with keyboard focus
    const highlightComponent = useCallback((element) => {
        // Remove highlight from all components
        const allComponents = wrapperRef.current?.querySelectorAll('.react-draggable, .canvas-component, [data-component-id]');
        allComponents?.forEach(comp => {
            comp.classList.remove('keyboard-focused-component');
        });

        // Add highlight to current component
        element.classList.add('keyboard-focused-component');

        // Ensure component is visible
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }, []);

    // Announce component selection to screen readers
    const announceComponentSelection = useCallback((componentType, componentId) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `${componentType} component selected. Use arrow keys to navigate to other components.`;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    // Register with keyboard navigation manager
    useEffect(() => {
        if (!disabled) {
            registerArea(AREAS.CANVAS, {
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
                unregisterArea(AREAS.CANVAS);
            };
        }
    }, [disabled, activate, deactivate, focusItem, updateItems, handleNavigation, registerArea, unregisterArea, AREAS.CANVAS]);

    // Set up container ref
    useEffect(() => {
        if (wrapperRef.current) {
            containerRef.current = wrapperRef.current;
        }
    }, []);

    // Add component data attributes for keyboard navigation
    useEffect(() => {
        const addComponentAttributes = () => {
            // Common component selectors
            const selectors = [
                '.react-draggable',
                '.canvas-component',
                '[data-component-id]'
            ];

            selectors.forEach(selector => {
                const items = wrapperRef.current?.querySelectorAll(selector);
                items?.forEach((item, index) => {
                    if (!item.getAttribute('data-canvas-nav')) {
                        item.setAttribute('data-canvas-nav', 'true');
                        item.setAttribute('data-canvas-index', index);
                        item.setAttribute('role', 'button');
                        item.setAttribute('tabindex', '-1');
                        item.setAttribute('aria-selected', 'false');

                        // Get component info for accessibility
                        const componentId = item.getAttribute('data-component-id') || item.id || `component-${index}`;
                        const componentType = item.getAttribute('data-component-type') ||
                            item.className.split(' ').find(cls => cls.includes('component')) ||
                            'Component';

                        item.setAttribute('aria-label', `${componentType} component - Press Enter to select`);
                        item.setAttribute('data-component-id', componentId);
                        item.setAttribute('data-component-type', componentType);
                    }
                });
            });
        };

        // Add attributes initially and when DOM changes
        addComponentAttributes();

        // Observer for dynamic content (when components are added/removed)
        const observer = new MutationObserver(addComponentAttributes);
        if (wrapperRef.current) {
            observer.observe(wrapperRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-component-id', 'data-component-type']
            });
        }

        return () => observer.disconnect();
    }, [children]);

    return (
        <div
            ref={wrapperRef}
            className={`keyboard-navigated-canvas keyboard-nav-area ${isActive ? 'active' : ''}`}
            role="main"
            aria-label="Canvas Area - Application components"
            aria-description="Use arrow keys to navigate between components, Enter to select"
        >
            {/* Hidden description for screen readers */}
            <div id="canvas-description" className="sr-only">
                Navigate through canvas components using arrow keys. Press Enter to select the focused component.
                Current focus: {focusedIndex >= 0 ? `Component ${focusedIndex + 1}` : 'None'}
            </div>

            {children}

            {/* Canvas status for screen readers */}
            <div className="sr-only" aria-live="polite">
                {isActive ? 'Canvas navigation active' : ''}
            </div>
        </div>
    );
};

export default KeyboardNavigatedCanvas;