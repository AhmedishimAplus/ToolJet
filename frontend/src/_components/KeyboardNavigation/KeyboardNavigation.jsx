import React, { useEffect, useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import './KeyboardNavigation.scss';

const KeyboardNavigation = () => {
    const [isActive, setIsActive] = useState(true); // Always active now
    const [isInputMode, setIsInputMode] = useState(false); // Track if we're in input typing mode
    const [currentInputElement, setCurrentInputElement] = useState(null); // Track current input
    const [expandedCard, setExpandedCard] = useState(null); // Track which card is expanded for button navigation
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Track if 3-dots menu is open for navigation

    // Helper function for modal navigation
    const navigateInModal = useCallback((direction) => {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;

        const focusableElements = Array.from(modal.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]:not([disabled])'))
            .filter(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
            })
            .sort((a, b) => {
                const aIndex = a.tabIndex === 0 ? 999 : a.tabIndex;
                const bIndex = b.tabIndex === 0 ? 999 : b.tabIndex;
                return aIndex - bIndex;
            });

        const currentIndex = focusableElements.indexOf(document.activeElement);
        let targetIndex;

        if (direction === 'next') {
            targetIndex = (currentIndex + 1) % focusableElements.length;
        } else {
            targetIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        }

        focusableElements[targetIndex]?.focus();
    }, []);

    // Helper function to check if we're currently in a modal
    const isInModal = useCallback(() => {
        const modalSelectors = [
            '.modal.show',
            '.modal.fade.show',
            '.modal-dialog',
            '.dialog-overlay',
            '.popover.show',
            '.dropdown-menu.show',
            '[role="dialog"]',
            '[role="alertdialog"]'
        ];

        for (const selector of modalSelectors) {
            const modal = document.querySelector(selector);
            if (modal && isElementVisible(modal)) {
                return true;
            }
        }
        return false;
    }, [isElementVisible]);

    // Get all focusable elements on the page in logical order
    const getFocusableElements = useCallback(() => {
        const elements = [];

        // Check if we're in a modal/dialog context first (highest priority)
        const modalSelectors = [
            '.modal.show', // Bootstrap modals
            '.modal.fade.show',
            '.modal-dialog',
            '.dialog-overlay',
            '.popover.show',
            '.dropdown-menu.show',
            '[role="dialog"]',
            '[role="alertdialog"]'
        ];

        let activeModal = null;
        for (const selector of modalSelectors) {
            const modal = document.querySelector(selector);
            if (modal && isElementVisible(modal)) {
                activeModal = modal;
                break;
            }
        }

        // If we're in a modal, only focus elements within the modal
        if (activeModal && !isMenuOpen) { // Don't override menu navigation
            // Get all focusable elements in DOM order using TreeWalker
            const modalElements = [];
            const walker = document.createTreeWalker(
                activeModal,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: function (node) {
                        // Check if element is focusable and visible
                        const isFocusable = (
                            (node.tagName === 'BUTTON' && !node.disabled) ||
                            (node.tagName === 'INPUT' && !node.disabled) ||
                            (node.tagName === 'TEXTAREA' && !node.disabled) ||
                            (node.tagName === 'SELECT' && !node.disabled) ||
                            (node.tagName === 'A' && node.href && !node.disabled) ||
                            (node.hasAttribute('tabindex') && node.getAttribute('tabindex') !== '-1') ||
                            (node.hasAttribute('role') && node.getAttribute('role') === 'button' && !node.disabled)
                        );

                        return isFocusable && isElementVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                    }
                }
            );

            let node;
            while (node = walker.nextNode()) {
                modalElements.push(node);
            }

            return modalElements;
        }

        // If menu is open, only return menu items for navigation (second priority)
        if (isMenuOpen) {
            const menuItems = getMenuItems();
            return menuItems;
        }

        // If a card is expanded, only return its buttons for navigation
        if (expandedCard) {
            const cardButtons = getCardButtons(expandedCard);
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
        });

        return menuItems;
    }, [isElementVisible]);

    // Make card buttons keyboard focusable
    const makeCardButtonsFocusable = useCallback((cardElement) => {
        if (!cardElement) return;

        // 1. Make sure launch button is focusable even if disabled
        const launchButton = cardElement.querySelector('.launch-button');
        if (launchButton && !launchButton.hasAttribute('tabindex')) {
            launchButton.setAttribute('tabindex', '0');
        }

        // 2. Make menu div focusable
        const menuIcon = cardElement.querySelector('.menu-ico, .menu-icon--trigger');
        if (menuIcon && !menuIcon.hasAttribute('tabindex')) {
            menuIcon.setAttribute('tabindex', '0');
            menuIcon.setAttribute('role', 'button');
        }

        // 3. Ensure edit button/link is focusable
        const editButton = cardElement.querySelector('.edit-button');
        if (editButton && !editButton.hasAttribute('tabindex')) {
            editButton.setAttribute('tabindex', '0');
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
    }, []);

    // Navigate to next focusable element
    const navigateToNext = useCallback(() => {
        if (isInputMode) return; // Don't navigate while in input mode

        const elements = getFocusableElements();
        if (elements.length === 0) {
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
        }
    }, [getFocusableElements, isInputMode]);

    // Navigate to previous focusable element
    const navigateToPrevious = useCallback(() => {
        if (isInputMode) return; // Don't navigate while in input mode

        const elements = getFocusableElements();
        if (elements.length === 0) {
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

                // Focus on the first button in the expanded card
                const cardButtons = getCardButtons(activeElement);
                if (cardButtons.length > 0) {
                    setTimeout(() => {
                        cardButtons[0].focus();
                    }, 200); // Slightly longer delay to ensure CSS transition and tabindex setup
                }
            }
        } else if (isMenuButton(activeElement)) {
            e.preventDefault();
            e.stopPropagation();

            // Click the menu button to open the menu
            activeElement.click();

            // Set menu open state and focus first menu item
            setIsMenuOpen(true);

            // Wait for menu to render, then make items focusable and focus first item
            setTimeout(() => {
                const menuItems = makeMenuItemsFocusable();
                if (menuItems.length > 0) {
                    menuItems[0].focus();

                } else {

                }
            }, 300); // Longer delay to ensure menu renders
        } else if (isMenuItem(activeElement)) {
            e.preventDefault();
            e.stopPropagation();



            // For span[role="button"] elements, click them directly
            if (activeElement.tagName === 'SPAN' && activeElement.getAttribute('role') === 'button') {
                activeElement.click();

            }
            // For field div elements, find and click the span[role="button"] child
            else if (activeElement.classList.contains('field')) {
                const clickableSpan = activeElement.querySelector('span[role="button"]');
                if (clickableSpan) {
                    clickableSpan.click();

                } else {
                    // Fallback - click the field itself
                    activeElement.click();

                }
            }
            // Fallback for other menu item types
            else {
                activeElement.click();

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

                setIsMenuOpen(false);
            }
        };

        // Check periodically if menu is still visible
        const interval = setInterval(checkMenuVisibility, 200);

        // Also listen for clicks outside to close menu
        const handleClickOutside = (e) => {
            const menuPopover = document.querySelector('#popover-app-menu, .popover-app-menu, .app-menu-popover');
            if (menuPopover && !menuPopover.contains(e.target)) {

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
        // In modals, use tab-order navigation for arrow keys too
        if (isInModal()) {
            if (!isInputMode) {
                e.preventDefault();
                navigateInModal('next');
            }
            return;
        }

        if (!isInputMode) {
            e.preventDefault();
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('up', (e) => {
        // In modals, use tab-order navigation for arrow keys too
        if (isInModal()) {
            if (!isInputMode) {
                e.preventDefault();
                navigateInModal('previous');
            }
            return;
        }

        if (!isInputMode) {
            e.preventDefault();
            navigateToPrevious();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Left and Right arrow keys for modal navigation
    useHotkeys('left', (e) => {
        // In modals, left arrow works like up arrow (previous element)
        if (isInModal()) {
            if (!isInputMode) {
                e.preventDefault();
                navigateInModal('previous');
            }
            return;
        }

        if (!isInputMode) {
            e.preventDefault();
            navigateToPrevious();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('right', (e) => {
        // In modals, right arrow works like down arrow (next element)
        if (isInModal()) {
            if (!isInputMode) {
                e.preventDefault();
                navigateInModal('next');
            }
            return;
        }

        if (!isInputMode) {
            e.preventDefault();
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('tab', (e) => {
        // Allow normal tab navigation in modals
        if (isInModal()) {
            return; // Don't prevent default, let normal tab navigation work
        }

        if (!isInputMode) {
            e.preventDefault();
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('shift+tab', (e) => {
        // Allow normal tab navigation in modals
        if (isInModal()) {
            return; // Don't prevent default, let normal tab navigation work
        }

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

            // Priority 1: If there's an open modal, try to close it
            const modalCloseButtons = Array.from(document.querySelectorAll('.modal.show .btn-close, .modal.show .close, .modal.show button[data-dismiss="modal"], .modal.show [aria-label="Close"]'));
            if (modalCloseButtons.length > 0) {

                modalCloseButtons[0].click();
                return;
            }

            // Priority 2: If menu is open, close menu and return to card navigation
            if (isMenuOpen) {
                resetMenuItemsFocusability();
                setIsMenuOpen(false);


                // Focus back on the menu button (3-dots) in the expanded card
                if (expandedCard) {
                    const menuButton = expandedCard.querySelector('.menu-ico, .menu-icon--trigger');
                    if (menuButton) {
                        setTimeout(() => {
                            menuButton.focus();

                        }, 100);
                    }
                }
            }
            // Priority 3: If card is expanded (and no menu), collapse card
            else if (expandedCard) {
                const cardToFocus = expandedCard; // Store reference before clearing
                resetCardButtonsFocusability(cardToFocus);
                cardToFocus.classList.remove('keyboard-expanded');
                setExpandedCard(null);
                // Focus back on the card
                cardToFocus.focus();

            }
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Debug hotkey to list all elements

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