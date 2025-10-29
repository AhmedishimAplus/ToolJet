import React, { useEffect, useCallback, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useCanvasDropHandler } from './useCanvasDropHandler';
import WidgetIcon from '@/../assets/images/icons/widgets';

export const KeyboardPlacementOverlay = () => {
    const keyboardPlacementMode = useStore((state) => state.getKeyboardPlacementMode?.(), shallow);
    const moveKeyboardPlacementPosition = useStore((state) => state.moveKeyboardPlacementPosition, shallow);
    const cancelKeyboardPlacement = useStore((state) => state.cancelKeyboardPlacement, shallow);
    const { handleDrop } = useCanvasDropHandler();

    const { active, component, position } = keyboardPlacementMode || {};

    // Track if this is the initial activation to prevent immediate placement
    const justActivatedRef = useRef(false);

    // Reset the justActivated flag when mode becomes inactive
    useEffect(() => {
        if (!active) {
            justActivatedRef.current = false;
        }
    }, [active]);

    // Set justActivated flag with a small delay when mode becomes active
    useEffect(() => {
        if (active && !justActivatedRef.current) {
            justActivatedRef.current = true;
            // Clear the flag after a short delay to allow Enter key to work for placement
            const timer = setTimeout(() => {
                justActivatedRef.current = false;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [active]);

    const handleKeyDown = useCallback(
        (e) => {
            if (!active) return;

            // Arrow keys - move the component
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                moveKeyboardPlacementPosition(e.key);
                return;
            }

            // Enter - place the component (but not if just activated)
            if (e.key === 'Enter') {
                // Prevent placement if we just activated the mode
                if (justActivatedRef.current) {
                    e.preventDefault();
                    return;
                }

                e.preventDefault();
                if (component) {
                    // Create a temporary component at the keyboard placement position
                    const item = { componentType: component.component, component };

                    // Set the position on the canvas before dropping
                    // We need to inject the position into the drop handler
                    const canvas = document.getElementById('real-canvas');
                    if (canvas) {
                        // Temporarily store position for the drop handler to use
                        canvas.setAttribute('data-keyboard-drop-position', JSON.stringify(position));
                    }

                    const currentDragCanvasId = 'canvas'; // Default to main canvas
                    handleDrop(item, currentDragCanvasId);
                    cancelKeyboardPlacement();
                }
                return;
            }

            // Escape - cancel placement
            if (e.key === 'Escape') {
                e.preventDefault();
                cancelKeyboardPlacement();
                return;
            }
        },
        [active, component, position, moveKeyboardPlacementPosition, cancelKeyboardPlacement, handleDrop]
    );

    useEffect(() => {
        if (active) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [active, handleKeyDown]);

    if (!active || !component) return null;

    // Calculate pixel position from grid position
    // Assuming grid is ~43 columns wide and each column is percentage based
    const canvasWidth = document.querySelector('.real-canvas')?.clientWidth || 1200;
    const gridUnitWidth = canvasWidth / 43; // Approximate grid unit size
    const leftPx = position.left * gridUnitWidth;
    const topPx = position.top;

    // Get component default size or use defaults
    const componentWidth = component.defaultSize?.width || 10;
    const componentHeight = component.defaultSize?.height || 40;
    const widthPx = componentWidth * gridUnitWidth;
    const heightPx = componentHeight;

    return (
        <>
            {/* Ghost preview - same style as mouse drag */}
            <div
                id="keyboard-placement-ghost"
                style={{
                    position: 'absolute',
                    left: `${leftPx}px`,
                    top: `${topPx}px`,
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    background: '#D9E2FC',
                    opacity: '0.7',
                    zIndex: 4,
                    pointerEvents: 'none',
                }}
            />
            {/* Instructions tooltip */}
            <div
                style={{
                    position: 'absolute',
                    left: `${leftPx}px`,
                    top: `${topPx - 28}px`,
                    fontSize: '11px',
                    color: 'var(--slate11)',
                    backgroundColor: 'var(--slate3)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    zIndex: 9999,
                    pointerEvents: 'none',
                }}
            >
                Arrow keys to move • Enter to place • Esc to cancel
            </div>
        </>
    );
};
