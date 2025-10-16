import React, { useEffect, useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import './KeyboardNavigation.scss';

const KeyboardNavigation = () => {
    const [isActive, setIsActive] = useState(true); // Always active now
    const [isInputMode, setIsInputMode] = useState(false); // Track if we're in input typing mode
    const [currentInputElement, setCurrentInputElement] = useState(null); // Track current input
    const [expandedCard, setExpandedCard] = useState(null); // Track which card is expanded for button navigation
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Track if 3-dots menu is open for navigation

    // Get all focusable elements on the page in logical order
    const getFocusableElements = useCallback(() => {
        const elements = [];

        // If menu is open, only return menu items for navigation (highest priority)
        if (isMenuOpen) {
            const menuItems = getMenuItems();
            console.log('Menu is open, returning only menu items:', menuItems.length);
            return menuItems;
        }

        // If a card is expanded, only return its buttons for navigation
        if (expandedCard) {
            const cardButtons = getCardButtons(expandedCard);
            console.log('Card is expanded, returning only card buttons:', cardButtons.length);
            return cardButtons;
        }

        // Normal navigation when no card is expanded
        // 1. Sidebar navigation items (in order)
        const sidebarSelectors = [
            '.tj-leftsidebar-icon-items[data-cy="icon-dashboard"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-workflows"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-database"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-global-datasources"]',
            '.tj-leftsidebar-icon-items[data-cy="icon-workspace-constants"]',
            '.notification-center-nav-item',
            '.tj-leftsidebar-icon-items[data-cy="mode-switch-button"]',
            '.settings-nav-item'
        ];

        sidebarSelectors.forEach(selector => {
            const el = document.querySelector(selector);
            if (el && isElementVisible(el)) {
                elements.push(el);
            }
        });

        // 2. Search input
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"], .form-control[type="text"]');
        if (searchInput && isElementVisible(searchInput)) {
            elements.push(searchInput);
        }

        // 3. App cards - only the cards themselves (not their buttons)
        const appCards = Array.from(document.querySelectorAll('.app-card'))
            .filter(el => isElementVisible(el) && el.classList.contains('homepage-app-card'));
        elements.push(...appCards);

        // 4. Other buttons and interactive elements (excluding already added ones)
        const otherElements = Array.from(document.querySelectorAll('button:not([disabled]), a[href]:not([disabled])'))
            .filter(el => isElementVisible(el) && !elements.includes(el));
        elements.push(...otherElements);

        // Debug logging
        console.log(`All focusable elements found: ${elements.length}`);
        console.log('App cards found:', appCards.length);
        console.log('Expanded card mode:', expandedCard ? 'LOCKED to card buttons' : 'NORMAL navigation');

        return elements;
    }, [isElementVisible, expandedCard, getCardButtons, isMenuOpen, getMenuItems]);

    // Helper function to check if element is visible
    const isElementVisible = useCallback((el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0 &&
            el.offsetParent !== null;
    }, []);    // Check if element is an input field
    const isInputElement = useCallback((element) => {
        return element && (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT'
        );
    }, []);

    // Check if element is an app card
    const isAppCard = useCallback((element) => {
        return element && (
            element.classList.contains('homepage-app-card') ||
            element.classList.contains('app-card')
        );
    }, []);

    // Check if element is a menu button (3-dots)
    const isMenuButton = useCallback((element) => {
        return element && (
            element.classList.contains('menu-ico') ||
            element.classList.contains('menu-icon--trigger') ||
            element.getAttribute('data-cy') === 'app-card-menu-icon'
        );
    }, []);

    // Check if element is a menu item (within a popover menu)
    const isMenuItem = useCallback((element) => {
        if (!element) return false;

        // Check if it's a span with role="button" inside a field div
        if (element.tagName === 'SPAN' && element.getAttribute('role') === 'button') {
            const fieldParent = element.closest('.field');
            return fieldParent && fieldParent.classList.contains('field');
        }

        // Check if it's a field div itself within a popover
        if (element.classList.contains('field')) {
            const popover = element.closest('.popover, .popover-body, .popover-content');
            return !!popover;
        }

        return false;
    }, []);

    // Get card buttons for expanded card navigation
    const getCardButtons = useCallback((cardElement) => {
        if (!cardElement) return [];

        const buttons = [];

        // 1. Edit button - specifically target the edit button
        const editButton = cardElement.querySelector('.edit-button');
        if (editButton && isElementVisible(editButton)) {
            buttons.push(editButton);
        }

        // 2. Launch button - specifically target the launch button
        const launchButton = cardElement.querySelector('.launch-button');
        if (launchButton && isElementVisible(launchButton)) {
            buttons.push(launchButton);
        }

        // 3. Menu button - target various possible menu selectors
        const menuSelectors = [
            '.menu-ico',
            '[data-cy="app-menu-option"]',
            '.dropdown-toggle',
            '.app-menu-trigger',
            'button[aria-label*="menu"]',
            'button[aria-label*="Menu"]'
        ];

        for (const selector of menuSelectors) {
            const menuButton = cardElement.querySelector(selector);
            if (menuButton && isElementVisible(menuButton) && !buttons.includes(menuButton)) {
                buttons.push(menuButton);
            }
        }

        // 4. Any remaining focusable elements in the card (as backup)
        const allFocusable = Array.from(cardElement.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])'))
            .filter(el =>
                isElementVisible(el) &&
                !buttons.includes(el) &&
                !el.closest('.app-card-name') && // Exclude app name link
                el !== cardElement // Exclude the card itself
            );
        buttons.push(...allFocusable);

        console.log('=== Card buttons detection ===');
        console.log('Card element:', cardElement.className);
        console.log('Edit button found:', !!editButton);
        console.log('Launch button found:', !!launchButton);
        console.log('Total buttons found:', buttons.length);
        buttons.forEach((btn, index) => {
            console.log(`${index + 1}. ${btn.tagName}.${btn.className} - "${btn.textContent?.trim().substring(0, 20)}"`);
        });
        console.log('=== End detection ===');

        return buttons;
    }, [isElementVisible]);

    // Get menu items for menu navigation
    const getMenuItems = useCallback(() => {
        // Look for the menu popover with multiple possible selectors
        const menuSelectors = [
            '#popover-app-menu',
            '.popover-app-menu',
            '.app-menu-popover',
            '.popover.bs-popover-bottom',
            '.popover',
            '[data-popper-placement]'
        ];

        let menuPopover = null;
        for (const selector of menuSelectors) {
            menuPopover = document.querySelector(selector);
            if (menuPopover && isElementVisible(menuPopover)) {
                break;
            }
        }

        if (!menuPopover) {
            console.log('Menu popover not found with any selector');
            return [];
        }

        // Get all possible menu items with expanded selectors, prioritizing specific selectors
        const prioritizedSelectors = [
            // Most specific - the actual clickable spans inside field divs
            '.field.mb-3 span[role="button"]',
            '.field span[role="button"]',
            'div.field.mb-3 span[role="button"]',
            'div.field span[role="button"]',

            // Fallback to field containers if spans not found
            '.field.mb-3',
            '.field',
            'div.field.mb-3',
            'div.field',

            // Fallback selectors
            '.popover-body > div.field',
            '.popover-body > .field',
            '.popover-content > div.field',
            '.popover-content > .field',
            '.popover-body > div',
            '.popover-content > div',

            // Even broader selectors
            'span[role="button"]',
            'div[class*="cursor-pointer"]',
            'span[class*="cursor-pointer"]',
            '[role="menuitem"]',
            '.dropdown-item',
            '.menu-item',
            '.app-menu-item',
            'div[role="button"]',

            // Last resort selectors
            'button',
            'a'
        ]; const allPossibleItems = [];
        prioritizedSelectors.forEach(selector => {
            const items = Array.from(menuPopover.querySelectorAll(selector));
            items.forEach(item => {
                if (!allPossibleItems.includes(item) && isElementVisible(item)) {
                    allPossibleItems.push(item);
                }
            });
        });

        // Filter to get actual clickable menu items
        const menuItems = allPossibleItems.filter(item => {
            const text = item.textContent?.trim();

            // Must have meaningful text content
            if (!text || text.length === 0 || text === '×') {
                return false;
            }

            // If it has .field class, it's likely a menu item - include it
            if (item.classList.contains('field')) {
                return true;
            }

            // For other elements, apply stricter filtering
            // Exclude very large containers (likely parent elements)
            const rect = item.getBoundingClientRect();
            if (rect.height > 100) { // Increased threshold
                return false;
            }

            // Must be a direct clickable element (not a container with many children)
            const clickableChildren = item.querySelectorAll('button, a, [role="button"], [role="menuitem"]');
            if (clickableChildren.length > 2) { // Relaxed threshold
                return false; // Likely a container, not the item itself
            }

            return true;
        }); console.log('=== Menu items detection ===');
        console.log('Menu popover found:', menuPopover.className);
        console.log('Menu popover dimensions:', menuPopover.getBoundingClientRect());
        console.log('All possible items found:', allPossibleItems.length);
        console.log('Filtered menu items found:', menuItems.length);

        allPossibleItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            console.log(`All ${index + 1}. ${item.tagName}.${item.className} - "${item.textContent?.trim().substring(0, 30)}" - ${rect.width}x${rect.height}`);
        });

        menuItems.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            console.log(`Final ${index + 1}. ${item.tagName}.${item.className} - "${item.textContent?.trim().substring(0, 30)}" - ${rect.width}x${rect.height}`);
        });
        console.log('=== End menu detection ===');

        return menuItems;
    }, [isElementVisible]);

    // Make card buttons keyboard focusable
    const makeCardButtonsFocusable = useCallback((cardElement) => {
        if (!cardElement) return;

        // 1. Make sure launch button is focusable even if disabled
        const launchButton = cardElement.querySelector('.launch-button');
        if (launchButton && !launchButton.hasAttribute('tabindex')) {
            launchButton.setAttribute('tabindex', '0');
            console.log('Made launch button focusable');
        }

        // 2. Make menu div focusable
        const menuIcon = cardElement.querySelector('.menu-ico, .menu-icon--trigger');
        if (menuIcon && !menuIcon.hasAttribute('tabindex')) {
            menuIcon.setAttribute('tabindex', '0');
            menuIcon.setAttribute('role', 'button');
            console.log('Made menu icon focusable');
        }

        // 3. Ensure edit button/link is focusable
        const editButton = cardElement.querySelector('.edit-button');
        if (editButton && !editButton.hasAttribute('tabindex')) {
            editButton.setAttribute('tabindex', '0');
            console.log('Made edit button focusable');
        }
    }, []);

    // Remove custom tabindex when card collapses
    const resetCardButtonsFocusability = useCallback((cardElement) => {
        if (!cardElement) return;

        // Remove our custom tabindex attributes
        const elements = cardElement.querySelectorAll('[tabindex="0"]');
        elements.forEach(el => {
            // Only remove tabindex we added (not naturally focusable elements)
            if (el.classList.contains('launch-button') || el.classList.contains('menu-ico') || el.classList.contains('menu-icon--trigger')) {
                el.removeAttribute('tabindex');
                if (el.hasAttribute('role') && el.getAttribute('role') === 'button') {
                    el.removeAttribute('role');
                }
            }
        });
        console.log('Reset card button focusability');
    }, []);

    // Make menu items keyboard focusable
    const makeMenuItemsFocusable = useCallback(() => {
        const menuItems = getMenuItems();

        menuItems.forEach((item, index) => {
            if (!item.hasAttribute('tabindex')) {
                item.setAttribute('tabindex', '0');

                // Add role if it's a div or span
                if (['DIV', 'SPAN'].includes(item.tagName) && !item.hasAttribute('role')) {
                    item.setAttribute('role', 'menuitem');
                }

                console.log(`Made menu item ${index + 1} focusable:`, item.textContent?.trim());
            }
        });

        return menuItems;
    }, [getMenuItems]);

    // Remove custom tabindex when menu closes
    const resetMenuItemsFocusability = useCallback(() => {
        // Find any elements with our custom menu attributes
        const menuItems = document.querySelectorAll('[tabindex="0"][role="menuitem"]');
        menuItems.forEach(item => {
            item.removeAttribute('tabindex');
            item.removeAttribute('role');
        });
        console.log('Reset menu items focusability');
    }, []);

    // Navigate to next focusable element
    const navigateToNext = useCallback(() => {
        if (isInputMode) return; // Don't navigate while in input mode

        const elements = getFocusableElements();
        if (elements.length === 0) {
            console.log('No focusable elements found!');
            return;
        }

        const currentIndex = elements.findIndex(el => el === document.activeElement);
        const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;

        if (elements[nextIndex]) {
            elements[nextIndex].focus();
            elements[nextIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });

            // Debug logging
            console.log(`Navigated to element ${nextIndex + 1}/${elements.length}:`, elements[nextIndex]);
            console.log('Classes:', elements[nextIndex].className);
            console.log('Tag:', elements[nextIndex].tagName);
            console.log('Navigation mode:', expandedCard ? 'LOCKED (card buttons only)' : 'NORMAL');
            console.log('Is app card:', elements[nextIndex].classList.contains('app-card') || elements[nextIndex].classList.contains('homepage-app-card'));
        }
    }, [getFocusableElements, isInputMode]);

    // Navigate to previous focusable element
    const navigateToPrevious = useCallback(() => {
        if (isInputMode) return; // Don't navigate while in input mode

        const elements = getFocusableElements();
        if (elements.length === 0) {
            console.log('No focusable elements found!');
            return;
        }

        const currentIndex = elements.findIndex(el => el === document.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;

        if (elements[prevIndex]) {
            elements[prevIndex].focus();
            elements[prevIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });

            // Debug logging
            console.log(`Navigated to element ${prevIndex + 1}/${elements.length}:`, elements[prevIndex]);
            console.log('Classes:', elements[prevIndex].className);
            console.log('Tag:', elements[prevIndex].tagName);
            console.log('Navigation mode:', expandedCard ? 'LOCKED (card buttons only)' : 'NORMAL');
            console.log('Is app card:', elements[prevIndex].classList.contains('app-card') || elements[prevIndex].classList.contains('homepage-app-card'));
        }
    }, [getFocusableElements, isInputMode]);

    // Handle Enter key - either activate element, toggle input mode, or expand cards
    const handleEnter = useCallback((e) => {
        const activeElement = document.activeElement;

        if (isInputElement(activeElement)) {
            e.preventDefault();
            if (isInputMode) {
                // Exit input mode
                setIsInputMode(false);
                setCurrentInputElement(null);
                activeElement.classList.remove('input-mode-active');
                activeElement.blur();
                activeElement.focus(); // Refocus to maintain navigation position
            } else {
                // Enter input mode
                setIsInputMode(true);
                setCurrentInputElement(activeElement);
                activeElement.classList.add('input-mode-active');
                // Don't prevent default here - let the input handle the cursor
            }
        } else if (isAppCard(activeElement)) {
            e.preventDefault();
            e.stopPropagation(); // Prevent card's own onKeyDown handler from firing

            // If card is already expanded, we don't want to click it, just collapse
            if (expandedCard === activeElement) {
                resetCardButtonsFocusability(activeElement);
                setExpandedCard(null);
                activeElement.classList.remove('keyboard-expanded');
                // Don't click the card - just keep it focused for further navigation
                console.log('Card collapsed, staying focused on card');
            } else {
                // Collapse any previously expanded card
                if (expandedCard) {
                    resetCardButtonsFocusability(expandedCard);
                    expandedCard.classList.remove('keyboard-expanded');
                }

                // Expand this card to show buttons (don't click it)
                setExpandedCard(activeElement);
                activeElement.classList.add('keyboard-expanded');

                // Make buttons focusable
                makeCardButtonsFocusable(activeElement);

                console.log('Card expanded, will focus first button');

                // Focus on the first button in the expanded card
                const cardButtons = getCardButtons(activeElement);
                if (cardButtons.length > 0) {
                    setTimeout(() => {
                        cardButtons[0].focus();
                        console.log('Focused on first button:', cardButtons[0]);
                    }, 200); // Slightly longer delay to ensure CSS transition and tabindex setup
                }
            }
        } else if (isMenuButton(activeElement)) {
            e.preventDefault();
            e.stopPropagation();

            // Click the menu button to open the menu
            activeElement.click();

            console.log('Menu button clicked, waiting for menu to open...');

            // Set menu open state and focus first menu item
            setIsMenuOpen(true);

            // Wait for menu to render, then make items focusable and focus first item
            setTimeout(() => {
                const menuItems = makeMenuItemsFocusable();
                if (menuItems.length > 0) {
                    menuItems[0].focus();
                    console.log('Focused on first menu item:', menuItems[0]);
                } else {
                    console.log('No menu items found after opening menu');
                }
            }, 300); // Longer delay to ensure menu renders
        } else if (isMenuItem(activeElement)) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Menu item activated:', activeElement);

            // For span[role="button"] elements, click them directly
            if (activeElement.tagName === 'SPAN' && activeElement.getAttribute('role') === 'button') {
                activeElement.click();
                console.log('Clicked span menu item directly');
            }
            // For field div elements, find and click the span[role="button"] child
            else if (activeElement.classList.contains('field')) {
                const clickableSpan = activeElement.querySelector('span[role="button"]');
                if (clickableSpan) {
                    clickableSpan.click();
                    console.log('Found and clicked span inside field:', clickableSpan);
                } else {
                    // Fallback - click the field itself
                    activeElement.click();
                    console.log('No span found, clicked field directly');
                }
            }
            // Fallback for other menu item types
            else {
                activeElement.click();
                console.log('Clicked menu item fallback');
            }
        } else if (activeElement) {
            e.preventDefault();
            // Activate non-input elements (including card buttons)
            activeElement.click();
        }
    }, [isInputElement, isInputMode, isAppCard, expandedCard, getCardButtons, makeCardButtonsFocusable, resetCardButtonsFocusability, isMenuButton, isMenuItem, makeMenuItemsFocusable]);

    // Global keydown handler to intercept card keyboard events before they reach the card's handler
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeElement = document.activeElement;

            // Handle Enter and Space keys on:
            // 1. App cards themselves
            // 2. Menu buttons (3-dots)
            // 3. Menu items (within popovers)
            // 4. Other card buttons when card is expanded
            if ((e.key === 'Enter' || e.key === ' ') && !isInputMode) {
                const shouldIntercept =
                    isAppCard(activeElement) ||
                    isMenuButton(activeElement) ||
                    isMenuItem(activeElement) ||
                    (expandedCard && expandedCard.contains(activeElement));

                if (shouldIntercept) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    console.log('Intercepted keydown on:', activeElement.tagName, activeElement.className);

                    // Call our handleEnter function
                    handleEnter(e);
                }
            }
        };

        // Use capture phase to intercept before card's handler
        document.addEventListener('keydown', handleGlobalKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown, true);
        };
    }, [handleEnter, isAppCard, isInputMode, isMenuButton, isMenuItem, expandedCard]);

    // Prevent input focus on hover - override default behavior
    useEffect(() => {
        const preventInputHoverFocus = (e) => {
            if (isInputElement(e.target) && !isInputMode) {
                e.target.blur();
            }
        };

        const handleMouseOver = (e) => {
            if (isInputElement(e.target) && !isInputMode) {
                // Prevent automatic focus on hover for inputs
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('focus', preventInputHoverFocus, true);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('focus', preventInputHoverFocus, true);
        };
    }, [isInputElement, isInputMode]);

    // Watch for menu visibility changes
    useEffect(() => {
        if (!isMenuOpen) return;

        const checkMenuVisibility = () => {
            const menuPopover = document.querySelector('#popover-app-menu, .popover-app-menu, .app-menu-popover');
            if (!menuPopover || !isElementVisible(menuPopover)) {
                console.log('Menu no longer visible, closing menu state');
                setIsMenuOpen(false);
            }
        };

        // Check periodically if menu is still visible
        const interval = setInterval(checkMenuVisibility, 200);

        // Also listen for clicks outside to close menu
        const handleClickOutside = (e) => {
            const menuPopover = document.querySelector('#popover-app-menu, .popover-app-menu, .app-menu-popover');
            if (menuPopover && !menuPopover.contains(e.target)) {
                console.log('Clicked outside menu, closing menu state');
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside, true);

        return () => {
            clearInterval(interval);
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [isMenuOpen, isElementVisible]);

    // Arrow key and tab navigation - only work when NOT in input mode
    useHotkeys('down', (e) => {
        if (!isInputMode) {
            e.preventDefault();
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('up', (e) => {
        if (!isInputMode) {
            e.preventDefault();
            navigateToPrevious();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('tab', (e) => {
        if (!isInputMode) {
            e.preventDefault();
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('shift+tab', (e) => {
        if (!isInputMode) {
            e.preventDefault();
            navigateToPrevious();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Enter key handling
    useHotkeys('enter', handleEnter, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Space key for buttons (only when not in input mode)
    useHotkeys('space', (e) => {
        if (!isInputMode && document.activeElement && document.activeElement.getAttribute('role') === 'button') {
            e.preventDefault();
            document.activeElement.click();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // ESC key to collapse expanded cards and close menus (hierarchical)
    useHotkeys('escape', (e) => {
        if (!isInputMode) {
            e.preventDefault();

            // Priority 1: If menu is open, close menu and return to card navigation
            if (isMenuOpen) {
                resetMenuItemsFocusability();
                setIsMenuOpen(false);
                console.log('Menu closed, returning to card button navigation');

                // Focus back on the menu button (3-dots) in the expanded card
                if (expandedCard) {
                    const menuButton = expandedCard.querySelector('.menu-ico, .menu-icon--trigger');
                    if (menuButton) {
                        setTimeout(() => {
                            menuButton.focus();
                            console.log('Focused back on menu button');
                        }, 100);
                    }
                }
            }
            // Priority 2: If card is expanded (and no menu), collapse card
            else if (expandedCard) {
                const cardToFocus = expandedCard; // Store reference before clearing
                resetCardButtonsFocusability(cardToFocus);
                cardToFocus.classList.remove('keyboard-expanded');
                setExpandedCard(null);
                // Focus back on the card
                cardToFocus.focus();
                console.log('Card collapsed, focus returned to card');
            }
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Debug hotkey to list all elements
    useHotkeys('ctrl+shift+d', (e) => {
        e.preventDefault();
        const elements = getFocusableElements();
        console.log('=== DEBUG: All focusable elements ===');
        elements.forEach((el, index) => {
            console.log(`${index + 1}. ${el.tagName} - ${el.className} - ${el.textContent?.substring(0, 50) || 'No text'}`);
        });
        console.log('=== End debug list ===');
    });

    // Clean up input mode classes when switching elements or unmounting
    useEffect(() => {
        return () => {
            // Clean up any input-mode-active classes when component unmounts
            const activeInputs = document.querySelectorAll('.input-mode-active');
            activeInputs.forEach(input => {
                input.classList.remove('input-mode-active');
            });
        };
    }, []);

    // Clean up previous input when switching to a new one
    useEffect(() => {
        if (currentInputElement && !isInputMode) {
            currentInputElement.classList.remove('input-mode-active');
        }
    }, [currentInputElement, isInputMode]);

    // Auto-focus on first sidebar element when page loads
    useEffect(() => {
        const timer = setTimeout(() => {
            const firstElement = document.querySelector('.tj-leftsidebar-icon-items[data-cy="icon-dashboard"]');
            if (firstElement && (!document.activeElement || document.activeElement === document.body)) {
                firstElement.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Show keyboard navigation hint
    return (
        <>
            <div className="keyboard-navigation-hint visible">
                {isInputMode ? (
                    '📝 Input Mode • Enter to Exit'
                ) : isMenuOpen ? (
                    '📋 Menu Open • ↑↓ Navigate Items • Enter Activate • ESC Back to Card'
                ) : expandedCard ? (
                    '🎯 Card Expanded • ↑↓ Navigate Buttons • Enter Activate/Open Menu • ESC Collapse'
                ) : (
                    '⌨️ Nav Mode • ↑↓ Navigate • Enter Expand Card'
                )}
            </div>
        </>
    );
};

export default KeyboardNavigation;