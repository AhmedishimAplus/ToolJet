import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enhanced keyboard navigation hook for individual areas
 * Works with the new 2-mode navigation system
 */
const useKeyboardNavigation = ({
    containerId,
    itemSelector,
    onSelect = null,
    onEnter = null,
    direction = 'both', // 'horizontal', 'vertical', 'both', 'grid'
    gridColumns = null
}) => {
    // State
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [isActive, setIsActive] = useState(false);
    const [items, setItems] = useState([]);

    // Refs
    const containerRef = useRef(null);
    const itemsRef = useRef([]);
    const isActiveRef = useRef(false);

    // Update items list
    const updateItems = useCallback(() => {
        if (!containerRef.current) return;

        const newItems = Array.from(
            containerRef.current.querySelectorAll(itemSelector)
        ).filter(item => {
            // Filter out hidden or disabled items
            const style = window.getComputedStyle(item);
            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                !item.hasAttribute('disabled') &&
                !item.classList.contains('disabled')
            );
        });

        itemsRef.current = newItems;
        setItems(newItems);

        // Reset focus if current index is out of bounds
        if (focusedIndex >= newItems.length) {
            setFocusedIndex(newItems.length > 0 ? 0 : -1);
        }
    }, [itemSelector, focusedIndex]);

    // Focus on a specific item
    const focusItem = useCallback((index) => {
        const newIndex = Math.max(0, Math.min(index, itemsRef.current.length - 1));

        if (newIndex < itemsRef.current.length && itemsRef.current[newIndex]) {
            const item = itemsRef.current[newIndex];

            // Remove focus from all items
            itemsRef.current.forEach((item, i) => {
                item.classList.remove('keyboard-focused');
                item.setAttribute('tabindex', '-1');
                item.setAttribute('aria-selected', 'false');
            });

            // Focus the target item
            item.classList.add('keyboard-focused');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-selected', 'true');
            item.focus({ preventScroll: true });

            // Scroll into view
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });

            setFocusedIndex(newIndex);

            // Call onSelect callback
            if (onSelect) {
                onSelect(newIndex, item);
            }
        }
    }, [onSelect]);

    // Navigate in a direction
    const navigate = useCallback((direction) => {
        if (!isActiveRef.current || itemsRef.current.length === 0) return;

        const currentIndex = focusedIndex;
        let nextIndex = currentIndex;

        if (direction === 'grid' && gridColumns) {
            // Grid navigation
            const row = Math.floor(currentIndex / gridColumns);
            const col = currentIndex % gridColumns;
            const totalRows = Math.ceil(itemsRef.current.length / gridColumns);

            switch (direction) {
                case 'ArrowUp':
                    if (row > 0) {
                        nextIndex = Math.max(0, currentIndex - gridColumns);
                    }
                    break;
                case 'ArrowDown':
                    if (row < totalRows - 1) {
                        nextIndex = Math.min(itemsRef.current.length - 1, currentIndex + gridColumns);
                    }
                    break;
                case 'ArrowLeft':
                    if (col > 0) {
                        nextIndex = currentIndex - 1;
                    }
                    break;
                case 'ArrowRight':
                    if (col < gridColumns - 1 && currentIndex + 1 < itemsRef.current.length) {
                        nextIndex = currentIndex + 1;
                    }
                    break;
            }
        } else {
            // Linear navigation
            switch (direction) {
                case 'ArrowUp':
                    if (direction === 'vertical' || direction === 'both') {
                        nextIndex = currentIndex > 0 ? currentIndex - 1 : itemsRef.current.length - 1;
                    }
                    break;
                case 'ArrowDown':
                    if (direction === 'vertical' || direction === 'both') {
                        nextIndex = currentIndex < itemsRef.current.length - 1 ? currentIndex + 1 : 0;
                    }
                    break;
                case 'ArrowLeft':
                    if (direction === 'horizontal' || direction === 'both') {
                        nextIndex = currentIndex > 0 ? currentIndex - 1 : itemsRef.current.length - 1;
                    }
                    break;
                case 'ArrowRight':
                    if (direction === 'horizontal' || direction === 'both') {
                        nextIndex = currentIndex < itemsRef.current.length - 1 ? currentIndex + 1 : 0;
                    }
                    break;
            }
        }

        if (nextIndex !== currentIndex) {
            focusItem(nextIndex);
        }
    }, [focusedIndex, direction, gridColumns, focusItem]);

    // Handle navigation key events
    const handleNavigation = useCallback((event) => {
        if (!isActiveRef.current) return;

        const { key } = event;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            event.preventDefault();
            navigate(key);
        } else if (key === 'Enter' && onEnter) {
            event.preventDefault();
            const currentItem = itemsRef.current[focusedIndex];
            if (currentItem) {
                onEnter(focusedIndex, currentItem);
            }
        }
    }, [navigate, focusedIndex, onEnter]);

    // Activate navigation
    const activate = useCallback((startIndex = 0) => {
        setIsActive(true);
        isActiveRef.current = true;
        updateItems();

        // Focus first item or specified index
        setTimeout(() => {
            const targetIndex = Math.max(0, Math.min(startIndex, itemsRef.current.length - 1));
            if (itemsRef.current.length > 0) {
                focusItem(targetIndex);
            }
        }, 50);
    }, [updateItems, focusItem]);

    // Deactivate navigation
    const deactivate = useCallback(() => {
        setIsActive(false);
        isActiveRef.current = false;

        // Remove focus styles from all items
        itemsRef.current.forEach(item => {
            item.classList.remove('keyboard-focused');
            item.setAttribute('tabindex', '-1');
            item.setAttribute('aria-selected', 'false');
        });

        setFocusedIndex(-1);
    }, []);

    // Update items when container or selector changes
    useEffect(() => {
        if (containerRef.current) {
            updateItems();

            // Set up mutation observer for dynamic content
            const observer = new MutationObserver(updateItems);
            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'hidden', 'disabled']
            });

            return () => observer.disconnect();
        }
    }, [updateItems]);

    return {
        // State
        focusedIndex,
        isActive,
        items,

        // Refs
        containerRef,

        // Methods
        activate,
        deactivate,
        focusItem,
        updateItems,
        navigate,
        handleNavigation
    };
};

export default useKeyboardNavigation;