import React, { useEffect, useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import './KeyboardNavigation.scss';

const KeyboardNavigation = () => {
    const [isActive, setIsActive] = useState(true); // Always active now
    const [isInputMode, setIsInputMode] = useState(false); // Track if we're in input typing mode
    const [currentInputElement, setCurrentInputElement] = useState(null); // Track current input
    const [expandedCard, setExpandedCard] = useState(null); // Track which card is expanded for button navigation
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Track if 3-dots menu is open for navigation
    const [lastModalState, setLastModalState] = useState(false); // Track modal open/close state

    // Helper function to check if we're in a problematic modal that blocks navigation
    const isInBlockingModal = useCallback(() => {
        const blockingModals = document.querySelectorAll('.modal.show, .select-datasource-list-modal, .datasource-edit-modal, .modal-backdrop');
        // Don't forcefully remove backdrops - let React manage them
        // Removing backdrops while modals are closing causes "removeChild" errors
        return blockingModals.length > 0;
    }, []);

    // Helper function for modal navigation
    const navigateInModal = useCallback((direction) => {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;

        const focusableElements = Array.from(modal.querySelectorAll(`
            [tabindex]:not([tabindex="-1"]), 
            button:not([disabled]), 
            input:not([disabled]), 
            textarea:not([disabled]), 
            select:not([disabled]), 
            a[href]:not([disabled]),
            li[role="button"],
            li[onclick],
            li.cursor-pointer,
            div[role="button"],
            div[onclick],
            div.cursor-pointer,
            span[role="button"],
            span[onclick],
            span.cursor-pointer,
            [data-testid],
            [data-cy*="icon"],
            .icon-item,
            .grid-item,
            ul li,
            .icon-grid li,
            .icon-picker li,
            .keyboard-navigable,
            .folder-list-group-item,
            .list-group-item,
            .all-apps-link,
            [data-cy*="list-card"],
            [data-cy*="folder"],
            [data-cy*="app"],
            [data-testid*="folder"],
            [data-testid*="application"],
            .application-card,
            .folder-card,
            .app-list-item
        `))
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

        if (focusableElements.length === 0) return;

        // Check if we're in an icon grid for special grid navigation
        const iconGrid = modal.querySelector('ul, .icon-grid, .grid, [class*="grid"]');
        const isIconGrid = iconGrid && focusableElements.some(el => iconGrid.contains(el));

        if (isIconGrid && (direction === 'next' || direction === 'previous')) {
            // For icon grids, try to maintain grid-like navigation
            const currentIndex = focusableElements.indexOf(document.activeElement);

            // Estimate grid columns by checking element positions
            const gridItems = focusableElements.filter(el => iconGrid.contains(el));
            if (gridItems.length > 0) {
                // If no current focus in grid, focus first grid item
                if (currentIndex === -1 || !iconGrid.contains(document.activeElement)) {
                    gridItems[0]?.focus();
                    return;
                }

                const firstItemRect = gridItems[0].getBoundingClientRect();
                const columnsCount = gridItems.filter(item => {
                    const rect = item.getBoundingClientRect();
                    return Math.abs(rect.top - firstItemRect.top) < 10; // Same row
                }).length;

                const currentGridIndex = gridItems.indexOf(document.activeElement);
                if (currentGridIndex !== -1) {
                    let targetGridIndex;

                    if (direction === 'next') {
                        targetGridIndex = (currentGridIndex + 1) % gridItems.length;
                    } else {
                        targetGridIndex = currentGridIndex === 0 ? gridItems.length - 1 : currentGridIndex - 1;
                    }

                    gridItems[targetGridIndex]?.focus();
                    return;
                }
            }
        }

        // Fallback to linear navigation
        const currentIndex = focusableElements.indexOf(document.activeElement);
        let targetIndex;

        if (direction === 'next') {
            // Focus trapping: if we're at the last element, go to first element  
            targetIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
        } else {
            // Focus trapping: if we're at the first element, go to last element
            targetIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        }

        const targetElement = focusableElements[targetIndex];
        targetElement?.focus();
    }, [isInputElement]);

    // Helper function for grid navigation (for icon grids, etc.)
    const navigateInGrid = useCallback((direction) => {
        const modal = document.querySelector('.modal.show');
        if (!modal) return false;

        // Look for grid containers (including file/folder lists)
        const gridContainer = modal.querySelector(`
            ul, .icon-grid, .grid, [class*="grid"],
            .folder-list, .app-list, .list-group,
            [data-testid*="applicationfoldersList"],
            [data-testid*="applicationsList"]
        `);
        if (!gridContainer) return false;

        // Get all grid items (including file/folder list items)
        const gridItems = Array.from(gridContainer.querySelectorAll(`
            li, .icon-item, .grid-item, 
            div[role="button"], span[role="button"],
            [data-testid], [data-cy*="icon"],
            div[onclick], span[onclick], li[onclick],
            .keyboard-navigable, [tabindex="0"],
            .folder-list-group-item,
            .list-group-item,
            .all-apps-link,
            [data-cy*="list-card"],
            [data-cy*="folder"],
            [data-cy*="app"],
            .application-card,
            .folder-card,
            .app-list-item
        `)).filter(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' &&
                style.opacity !== '0' && rect.width > 0 && rect.height > 0;
        });

        if (gridItems.length === 0) return false;

        const currentIndex = gridItems.indexOf(document.activeElement);
        if (currentIndex === -1) {
            // If no current focus in grid, focus first item
            gridItems[0]?.focus();
            // Make sure it's focusable
            if (!gridItems[0].hasAttribute('tabindex')) {
                gridItems[0].setAttribute('tabindex', '0');
            }
            gridItems[0].classList.add('keyboard-focused');
            return true;
        }

        // For file/folder lists, treat as vertical list (1 column)
        const isFileList = gridContainer.querySelector('.folder-list-group-item, .list-group-item, .all-apps-link');
        let columnsCount = 1; // Default for vertical lists

        if (!isFileList) {
            // Calculate grid dimensions for actual grids (like icon grids)
            const firstItemRect = gridItems[0].getBoundingClientRect();
            columnsCount = gridItems.filter(item => {
                const rect = item.getBoundingClientRect();
                return Math.abs(rect.top - firstItemRect.top) < 10; // Same row
            }).length;
        }

        let targetIndex = currentIndex;

        switch (direction) {
            case 'right':
                if (isFileList) {
                    // For file lists, right arrow doesn't navigate
                    return false;
                }
                targetIndex = currentIndex + 1;
                if (targetIndex >= gridItems.length) targetIndex = 0; // Wrap to start
                break;
            case 'left':
                if (isFileList) {
                    // For file lists, left arrow doesn't navigate
                    return false;
                }
                targetIndex = currentIndex - 1;
                if (targetIndex < 0) targetIndex = gridItems.length - 1; // Wrap to end
                break;
            case 'down':
                targetIndex = currentIndex + columnsCount;
                if (targetIndex >= gridItems.length) {
                    if (isFileList) {
                        // For file lists, wrap to first item
                        targetIndex = 0;
                    } else {
                        // For grids, go to first item in same column
                        targetIndex = currentIndex % columnsCount;
                    }
                }
                break;
            case 'up':
                targetIndex = currentIndex - columnsCount;
                if (targetIndex < 0) {
                    if (isFileList) {
                        // For file lists, wrap to last item
                        targetIndex = gridItems.length - 1;
                    } else {
                        // For grids, go to last row, same column
                        const column = currentIndex % columnsCount;
                        const rows = Math.ceil(gridItems.length / columnsCount);
                        targetIndex = ((rows - 1) * columnsCount) + column;
                        if (targetIndex >= gridItems.length) {
                            targetIndex = ((rows - 2) * columnsCount) + column;
                        }
                    }
                }
                break;
        }

        if (gridItems[targetIndex]) {
            gridItems[targetIndex].focus();

            // Make grid items focusable if they don't have tabindex
            if (!gridItems[targetIndex].hasAttribute('tabindex')) {
                gridItems[targetIndex].setAttribute('tabindex', '0');
            }

            // Add visual focus styling for grid items
            gridItems.forEach(item => item.classList.remove('keyboard-focused'));
            gridItems[targetIndex].classList.add('keyboard-focused');

            return true;
        }

        return false;
    }, []);

    // Helper function for main page grid/list navigation
    const navigateInMainPage = useCallback((direction) => {
        // Don't interfere if we're in a modal
        if (isInModal()) return false;

        // Check if we're currently focused on a file/folder list item
        const activeElement = document.activeElement;
        const isInFileList = activeElement && (
            activeElement.classList.contains('folder-list-group-item') ||
            activeElement.classList.contains('list-group-item') ||
            activeElement.classList.contains('all-apps-link') ||
            activeElement.closest('.tj-folders, .folders-sidebar')
        );

        if (isInFileList) {
            // Find the file list container
            const listContainer = activeElement.closest('.tj-folders, .folders-sidebar') ||
                document.querySelector('.tj-folders, .folders-sidebar, .folder-list');

            if (listContainer) {
                const listItems = Array.from(listContainer.querySelectorAll(`
                    .folder-list-group-item,
                    .list-group-item,
                    .all-apps-link,
                    [data-cy*="folder"],
                    [data-cy*="app"],
                    .keyboard-navigable
                `)).filter(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' &&
                        style.opacity !== '0' && rect.width > 0 && rect.height > 0;
                });

                if (listItems.length === 0) return false;

                const currentIndex = listItems.indexOf(activeElement);
                if (currentIndex === -1) return false;

                let targetIndex = currentIndex;

                switch (direction) {
                    case 'down':
                        targetIndex = currentIndex + 1;
                        if (targetIndex >= listItems.length) targetIndex = 0; // Wrap to start
                        break;
                    case 'up':
                        targetIndex = currentIndex - 1;
                        if (targetIndex < 0) targetIndex = listItems.length - 1; // Wrap to end
                        break;
                    case 'left':
                    case 'right':
                        // Don't handle left/right in file lists
                        return false;
                }

                if (listItems[targetIndex]) {
                    listItems[targetIndex].focus();

                    // Make sure it's focusable
                    if (!listItems[targetIndex].hasAttribute('tabindex')) {
                        listItems[targetIndex].setAttribute('tabindex', '0');
                    }

                    // Add visual focus styling
                    listItems.forEach(item => item.classList.remove('keyboard-focused'));
                    listItems[targetIndex].classList.add('keyboard-focused');

                    return true;
                }
            }
        }

        // Check if we're in the app cards grid
        const isInAppGrid = activeElement && activeElement.classList.contains('homepage-app-card');

        if (isInAppGrid) {
            const appCards = Array.from(document.querySelectorAll('.homepage-app-card')).filter(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' &&
                    style.opacity !== '0' && rect.width > 0 && rect.height > 0;
            });

            if (appCards.length === 0) return false;

            const currentIndex = appCards.indexOf(activeElement);
            if (currentIndex === -1) return false;

            // Calculate grid columns for app cards
            const firstCardRect = appCards[0].getBoundingClientRect();
            const columnsCount = appCards.filter(card => {
                const rect = card.getBoundingClientRect();
                return Math.abs(rect.top - firstCardRect.top) < 10; // Same row
            }).length;

            let targetIndex = currentIndex;

            switch (direction) {
                case 'right':
                    targetIndex = currentIndex + 1;
                    if (targetIndex >= appCards.length) targetIndex = 0; // Wrap to start
                    break;
                case 'left':
                    targetIndex = currentIndex - 1;
                    if (targetIndex < 0) targetIndex = appCards.length - 1; // Wrap to end
                    break;
                case 'down':
                    targetIndex = currentIndex + columnsCount;
                    if (targetIndex >= appCards.length) {
                        // Go to first item in same column
                        targetIndex = currentIndex % columnsCount;
                    }
                    break;
                case 'up':
                    targetIndex = currentIndex - columnsCount;
                    if (targetIndex < 0) {
                        // Go to last row, same column
                        const column = currentIndex % columnsCount;
                        const rows = Math.ceil(appCards.length / columnsCount);
                        targetIndex = ((rows - 1) * columnsCount) + column;
                        if (targetIndex >= appCards.length) {
                            targetIndex = ((rows - 2) * columnsCount) + column;
                        }
                    }
                    break;
            }

            if (appCards[targetIndex]) {
                appCards[targetIndex].focus();

                // Add visual focus styling
                appCards.forEach(card => card.classList.remove('keyboard-focused'));
                appCards[targetIndex].classList.add('keyboard-focused');

                return true;
            }
        }

        return false;
    }, [isInModal]);

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

        // 2. File/Folder list items in sidebar (All applications, adsa, etc.)
        const fileListItems = Array.from(document.querySelectorAll(`
            .all-apps-link,
            .folder-list-group-item,
            .list-group-item,
            [data-cy*="list-card"],
            [data-cy*="folder"],
            [data-cy*="app"],
            .application-card,
            .folder-card,
            .app-list-item
        `)).filter(el => isElementVisible(el) && el.hasAttribute('tabindex'));
        elements.push(...fileListItems);

        // 3. All search inputs (main area and sidebar)
        const mainSearchInputs = Array.from(document.querySelectorAll(`
            input[data-cy="home-page-search-bar"],
            input[placeholder*="Search apps"],
            .homepage-search input,
            .home-search-holder input,
            input.homepage-search,
            input.ghost-search
        `)).filter(input => {
            // Only include main area search inputs (not in sidebar)
            const sidebarElement = document.querySelector('.tj-leftsidebar, .folder-list');
            return isElementVisible(input) &&
                !(sidebarElement && sidebarElement.contains(input));
        });        // 4. Sidebar search inputs (folder search)
        const sidebarSearchInputs = Array.from(document.querySelectorAll(`
            input[data-cy="query-manager-search-bar"],
            input[placeholder*="Search for folders"],
            .tj-leftsidebar input[type="text"],
            .folder-list input[type="text"],
            .tj-common-search-input input
        `)).filter(input => {
            // Only include sidebar search inputs that are visible
            const sidebarElement = document.querySelector('.tj-leftsidebar, .folder-list');
            return isElementVisible(input) &&
                (sidebarElement && sidebarElement.contains(input));
        });

        elements.push(...mainSearchInputs, ...sidebarSearchInputs);

        // 5. App cards in main area - only the cards themselves (not their buttons)
        const appCards = Array.from(document.querySelectorAll('.homepage-app-card, .app-card'))
            .filter(el => isElementVisible(el) && !elements.includes(el));
        elements.push(...appCards);

        // 5. Other buttons and interactive elements (excluding already added ones and card-specific elements)
        const otherElements = Array.from(document.querySelectorAll('button:not([disabled]), a[href]:not([disabled])'))
            .filter(el => {
                // Exclude if already added
                if (elements.includes(el)) return false;

                // Exclude if part of card button system (these are handled by card expansion logic)
                if (el.closest('.homepage-app-card, .app-card')) return false;

                // Exclude if part of menu system (these are handled by menu logic)
                if (el.closest('.popover, .dropdown-menu')) return false;

                // Only include if visible
                return isElementVisible(el);
            });
        elements.push(...otherElements);

        return elements;
    }, [isElementVisible, expandedCard, getCardButtons, isMenuOpen, getMenuItems, isOnDataSourcesPage, getDataSourcesPageElements]);

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
        if (!element) return false;

        // Check the element itself and its parent
        const checkElement = (el) => {
            return el && (
                el.classList.contains('menu-ico') ||
                el.classList.contains('menu-icon--trigger') ||
                el.getAttribute('data-cy') === 'app-card-menu-icon' ||
                el.classList.contains('settings-nav-item') || // Settings menu button
                el.getAttribute('data-cy') === 'settings-icon' ||
                el.getAttribute('data-cy') === 'import-dropdown-menu' || // Create app dropdown menu button
                el.getAttribute('data-cy') === 'add-new-data-button' // Database add new data button
            );
        };

        return checkElement(element) || checkElement(element.parentElement) || checkElement(element.closest('button'));
    }, []);

    // Check if element is a menu item (within a popover menu)
    const isMenuItem = useCallback((element) => {
        if (!element) return false;

        // Check if it's a dropdown-item (settings menu or create app menu)
        if (element.classList.contains('dropdown-item')) {
            const settingsCard = element.closest('.settings-card');
            const newAppDropdown = element.closest('.new-app-dropdown');
            return !!(settingsCard || newAppDropdown);
        }

        // Check if it's a div with role="menuitem" (add new data popover items)
        if (element.getAttribute('role') === 'menuitem') {
            const addNewDataPopover = element.closest('.add-new-data-popover');
            return !!addNewDataPopover;
        }

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

    // Check if we're on the data sources page
    const isOnDataSourcesPage = useCallback(() => {
        return window.location.pathname.includes('/data-sources') ||
            window.location.pathname.includes('/global-datasources') ||
            document.querySelector('.datasource-list-container, .datasource-modal-container') !== null;
    }, []);

    // Check if element is a data source card
    const isDataSourceCard = useCallback((element) => {
        return element && (
            element.classList.contains('datasource-card') ||
            element.classList.contains('card--clickable') ||
            (element.classList.contains('card') && element.closest('.datasource-card')) ||
            (element.classList.contains('card') && element.getAttribute('role') === 'button') ||
            (element.getAttribute('data-cy') && element.getAttribute('data-cy').includes('data-source-'))
        );
    }, []);

    // Check if element is a data source section button in sidebar
    const isDataSourceSectionButton = useCallback((element) => {
        if (!element) return false;

        // Check if it's a data source section button
        return (
            element.getAttribute('role') === 'button' && element.closest('.datasources-list')
        ) || (
                element.classList.contains('col') &&
                element.classList.contains('d-flex') &&
                element.classList.contains('align-items-center') &&
                element.closest('.datasources-list')
            ) || (
                element.getAttribute('data-cy') &&
                (element.getAttribute('data-cy').includes('-datasource-button') ||
                    element.getAttribute('data-cy').includes('-button'))
            ) || (
                // Check if it's inside a datasources-list container
                element.closest('.datasources-list') &&
                (element.getAttribute('onClick') || element.getAttribute('role') === 'button')
            );
    }, []);

    // Make data source elements focusable
    const makeDataSourceElementsFocusable = useCallback(() => {
        if (!isOnDataSourcesPage()) return;

        // First, make the search input focusable
        const searchInput = document.querySelector('input[placeholder*="Search data sources"], .search-box input, input[type="text"]');
        if (searchInput && !searchInput.hasAttribute('tabindex')) {
            searchInput.setAttribute('tabindex', '0');
            searchInput.classList.add('keyboard-navigable');
        }

        // Make "ALL DATA SOURCES" section header and category buttons focusable
        const sectionHeaders = document.querySelectorAll('.datasources-info, .datasource-list-header, [data-cy="datasource-list-header"]');
        sectionHeaders.forEach(header => {
            if (!header.hasAttribute('tabindex')) {
                header.setAttribute('tabindex', '0');
                header.classList.add('keyboard-navigable');
            }
        });

        // Make all sidebar category buttons focusable (Commonly used, Databases, APIs, etc.)
        const categoryButtons = document.querySelectorAll(`
            .datasources-list [role="button"], 
            .datasources-list div[onclick],
            .datasources-list .col.d-flex.align-items-center,
            div[data-cy*="-datasource-button"],
            div[data-cy*="-button"],
            .sidebar .list-group-item,
            .datasources-sidebar button,
            .datasources-sidebar .nav-link,
            div[data-cy$="-datasource-button"]
        `);
        categoryButtons.forEach(button => {
            if (!button.hasAttribute('tabindex')) {
                button.setAttribute('tabindex', '0');
                button.classList.add('keyboard-navigable');
            }
        });

        // Make ALL data source cards focusable - main cards area
        const dataSourceCards = document.querySelectorAll(`
            .row.row-deck .card,
            .card--clickable, 
            .datasource-card .card,
            div[data-cy*="data-source-"],
            .card[role="button"],
            .card[onclick],
            [data-cy$="-card"]
        `);
        dataSourceCards.forEach((card, index) => {
            card.setAttribute('tabindex', '0');
            card.classList.add('keyboard-navigable');
            card.setAttribute('data-kb-index', index);
        });

        // Make data sources added section items focusable (the left sidebar list)
        const addedDataSources = document.querySelectorAll(`
            .datasource-added-item,
            .data-sources-sidebar .list-item,
            .datasource-list-item,
            div[data-cy*="datasource-item"],
            .sidebar-item,
            .datasource-sidebar-item,
            .global-datasources-sidebar .list-group-item,
            .global-datasources-sidebar li,
            .datasources-sidebar-item,
            .datasource-item,
            .appwrite,
            .postgresql,
            .restapi,
            div[data-cy*="-item"]
        `);
        addedDataSources.forEach(item => {
            if (!item.hasAttribute('tabindex')) {
                item.setAttribute('tabindex', '0');
                item.classList.add('keyboard-navigable');
            }
        });

        // Make any delete buttons or action buttons focusable
        const actionButtons = document.querySelectorAll(`
            button[data-cy*="delete"],
            .delete-btn,
            .action-btn,
            button[onclick],
            .btn[onclick],
            .close-btn,
            button.tj-primary-btn,
            button.tj-secondary-btn,
            button.tj-tertiary-btn,
            .ButtonSolid,
            [role="button"]:not(.card)
        `);
        actionButtons.forEach(button => {
            if (!button.hasAttribute('tabindex')) {
                button.setAttribute('tabindex', '0');
                button.classList.add('keyboard-navigable');
            }
        });

        console.log('KeyboardNavigation: Made', dataSourceCards.length, 'cards,', actionButtons.length, 'action buttons, and', addedDataSources.length, 'sidebar items focusable');

        // Continue with existing category button logic
        categoryButtons.forEach(button => {
            if (!button.hasAttribute('tabindex')) {
                button.setAttribute('tabindex', '0');
                button.classList.add('keyboard-navigable');
            }
        });

        // Make search input focusable
        const searchInputElement = document.querySelector('.datasource-search-holder input, input[placeholder*="Search data sources"]');
        if (searchInputElement && !searchInputElement.hasAttribute('tabindex')) {
            searchInputElement.setAttribute('tabindex', '0');
        }
    }, [isOnDataSourcesPage]);

    // Get data sources page navigation elements in order
    const getDataSourcesPageElements = useCallback(() => {
        if (!isOnDataSourcesPage()) return [];

        const elements = [];

        // 1. Sidebar navigation (same as other pages)
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

        // 2. Data source category/section buttons in sidebar
        const categoryButtons = Array.from(document.querySelectorAll(`
            .datasources-list [role="button"], 
            .datasources-list div[onclick],
            .datasources-list .col.d-flex.align-items-center,
            div[data-cy*="-datasource-button"],
            div[data-cy*="-button"]
        `)).filter(el => isElementVisible(el));
        elements.push(...categoryButtons);

        // 3. "ALL DATA SOURCES" section header
        const sectionHeaders = Array.from(document.querySelectorAll('.datasources-info, .datasource-list-header, [data-cy="datasource-list-header"]'))
            .filter(el => isElementVisible(el));
        elements.push(...sectionHeaders);

        // 4. Search input
        const searchInputInOrder = document.querySelector('.datasource-search-holder input, input[placeholder*="Search data sources"]');
        if (searchInputInOrder && isElementVisible(searchInputInOrder)) {
            elements.push(searchInputInOrder);
        }

        // 5. Data source cards - use the same selector as above
        const dataSourceCards = Array.from(document.querySelectorAll(`
            .row.row-deck .card,
            .card--clickable, 
            .datasource-card .card,
            div[data-cy*="data-source-"],
            .card[role="button"]
        `)).filter(el => isElementVisible(el));
        elements.push(...dataSourceCards);

        return elements;
    }, [isOnDataSourcesPage, isElementVisible]);

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
            '.add-new-data-popover', // Database add new data menu (try this first)
            '.settings-card', // Add settings menu
            '.new-app-dropdown', // Add create app dropdown menu
            '#popover-app-menu',
            '.popover-app-menu',
            '.app-menu-popover',
            '.popover.bs-popover-bottom',
            '.popover.show', // Bootstrap popover when shown
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
            // Add new data menu items (highest priority for this menu)
            '[data-cy="add-new-row-option"]',
            '[data-cy="bulk-upload-data-option"]',
            '.add-new-data-menu-item',

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
            '.dropdown-item', // Settings menu items and create app menu items
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
            // Set tabindex to 0 (or update from -1 to 0)
            item.setAttribute('tabindex', '0');

            // Add role if it's a div or span and doesn't have one
            if (['DIV', 'SPAN'].includes(item.tagName) && !item.hasAttribute('role')) {
                item.setAttribute('role', 'menuitem');
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
    }, [getFocusableElements]);

    // Navigate to previous focusable element
    const navigateToPrevious = useCallback(() => {
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
    }, [getFocusableElements]);

    // Handle Enter key - either activate element or expand cards
    const handleEnter = useCallback((e) => {
        const activeElement = document.activeElement;

        if (isInputElement(activeElement)) {
            // Let inputs handle Enter naturally - no special input mode
            return;
        } else if (activeElement.tagName === 'SELECT' ||
            activeElement.classList.contains('dropdown') ||
            activeElement.classList.contains('form-select') ||
            activeElement.getAttribute('role') === 'combobox' ||
            activeElement.getAttribute('role') === 'listbox') {
            // Handle dropdowns and select elements
            if (isInModal()) {
                // In modals, let the dropdown handle Enter naturally to open
                return;
            } else {
                e.preventDefault();
                activeElement.click();
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
        } else if (isDataSourceCard(activeElement)) {
            e.preventDefault();
            e.stopPropagation();

            // For data source cards, just click them to select/open
            activeElement.click();
        } else if (isDataSourceSectionButton(activeElement)) {
            e.preventDefault();
            e.stopPropagation();

            // For data source section buttons, click them to select the section
            activeElement.click();
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
                }
            }, 350); // Increased delay to ensure Bootstrap popover renders
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
            // In modals, allow natural behavior for most elements, but still support clicking
            if (isInModal()) {
                // For buttons, dropdowns, and other interactive elements in modals
                if (activeElement.tagName === 'BUTTON' ||
                    activeElement.getAttribute('role') === 'button' ||
                    activeElement.classList.contains('dropdown-toggle') ||
                    activeElement.classList.contains('btn') ||
                    activeElement.hasAttribute('data-bs-toggle')) {
                    // Don't prevent default - let the element handle Enter naturally
                    activeElement.click();
                } else {
                    // For other elements, click them
                    e.preventDefault();
                    activeElement.click();
                }
            } else {
                e.preventDefault();
                // Activate non-input elements (including card buttons)
                activeElement.click();
            }
        }
    }, [isInputElement, isInputMode, isAppCard, isDataSourceCard, isDataSourceSectionButton, expandedCard, getCardButtons, makeCardButtonsFocusable, resetCardButtonsFocusability, isMenuButton, isMenuItem, makeMenuItemsFocusable]);

    // Global keydown handler to intercept card keyboard events before they reach the card's handler
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            const activeElement = document.activeElement;

            // Don't intercept if inside a popover or modal dialog
            if (activeElement && activeElement.closest('.popover, .modal, .filter-popup, [role="dialog"], [id*="popover"]')) {
                return; // Let the modal/popover handle its own keyboard navigation
            }

            // Don't intercept if user is typing in an input field
            if (activeElement &&
                (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT') &&
                activeElement.type !== 'button' &&
                activeElement.type !== 'submit' &&
                activeElement.type !== 'checkbox' &&
                activeElement.type !== 'radio') {
                return; // Let the input handle the event normally
            }

            // Handle Tab/Shift+Tab when menu is open
            if (e.key === 'Tab' && isMenuOpen) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                const menuItems = getMenuItems();
                if (menuItems.length === 0) return;

                const currentIndex = menuItems.indexOf(activeElement);
                let nextIndex;

                if (e.shiftKey) {
                    // Shift+Tab: go to previous item
                    nextIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
                } else {
                    // Tab: go to next item
                    nextIndex = currentIndex >= menuItems.length - 1 ? 0 : currentIndex + 1;
                }

                menuItems[nextIndex]?.focus();
                return;
            }

            // Handle Enter and Space keys on:
            // 1. App cards themselves
            // 2. Menu buttons (3-dots)
            // 3. Menu items (within popovers)
            // 4. Other card buttons when card is expanded
            if ((e.key === 'Enter' || e.key === ' ')) {
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
    }, [handleEnter, isAppCard, isMenuButton, isMenuItem, expandedCard, isMenuOpen, getMenuItems]);

    // Allow normal input behavior - no hover prevention
    useEffect(() => {
        // No special input handling needed - inputs work normally
        return () => { };
    }, [isInputElement]);

    // Watch for menu visibility changes
    useEffect(() => {
        if (!isMenuOpen) return;

        const checkMenuVisibility = () => {
            const menuPopover = document.querySelector('#popover-app-menu, .popover-app-menu, .app-menu-popover, .settings-card, .new-app-dropdown, .add-new-data-popover');
            if (!menuPopover || !isElementVisible(menuPopover)) {

                setIsMenuOpen(false);
            }
        };

        // Check periodically if menu is still visible
        const interval = setInterval(checkMenuVisibility, 200);

        // Also listen for clicks outside to close menu
        const handleClickOutside = (e) => {
            const menuPopover = document.querySelector('#popover-app-menu, .popover-app-menu, .app-menu-popover, .settings-card, .new-app-dropdown, .add-new-data-popover');
            if (menuPopover && e.target && !menuPopover.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside, true);

        return () => {
            clearInterval(interval);
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [isMenuOpen, isElementVisible]);

    // Force clear any blocking modal elements that interfere with navigation
    useEffect(() => {
        const forceUnblockNavigation = () => {
            // Only remove orphaned modal backdrops (backdrops without corresponding modals)
            const activeModals = document.querySelectorAll('.modal.show');
            const backdrops = document.querySelectorAll('.modal-backdrop');

            // If there are backdrops but no active modals, they're orphaned and safe to remove
            if (backdrops.length > 0 && activeModals.length === 0) {
                backdrops.forEach(backdrop => backdrop.remove());
            }

            // Force enable body scrolling if disabled by modal (only if no active modals)
            if (activeModals.length === 0) {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');

                // Clear any modal-open classes from html
                document.documentElement.classList.remove('modal-open');
            }
        };

        // Run immediately and on path changes
        forceUnblockNavigation();

        // Force enable sidebar interaction
        const enableSidebarInteraction = () => {
            const sidebar = document.querySelector('.left-sidebar, .tj-leftsidebar, aside');
            if (sidebar) {
                sidebar.style.pointerEvents = 'auto';
                sidebar.style.zIndex = '9999';

                // Ensure all sidebar buttons are clickable
                const sidebarButtons = sidebar.querySelectorAll('button, a, [role="button"]');
                sidebarButtons.forEach(btn => {
                    btn.style.pointerEvents = 'auto';
                    btn.style.zIndex = '10000';
                });
            }
        };

        enableSidebarInteraction();

        const interval = setInterval(() => {
            forceUnblockNavigation();
            enableSidebarInteraction();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Helper function to ensure sidebar search inputs work properly when dynamically shown
    const ensureSidebarSearchWorks = useCallback(() => {
        const sidebarSearchInputs = document.querySelectorAll(`
            .tj-leftsidebar input[type="text"],
            .folder-list input[type="text"],
            .tj-common-search-input input,
            input[data-cy*="query-manager"]
        `);

        sidebarSearchInputs.forEach(input => {
            if (input && isElementVisible(input)) {
                // Ensure the input is focusable
                if (!input.hasAttribute('tabindex')) {
                    input.setAttribute('tabindex', '0');
                }

                // Remove any disabled state that might block typing
                input.removeAttribute('disabled');
                input.removeAttribute('readonly');

                // Ensure it can receive focus and typing
                input.style.pointerEvents = 'auto';
                input.style.userSelect = 'auto';
            }
        });
    }, [isElementVisible]);

    // Helper function to check if user is actually typing in an input
    const isTypingInInput = () => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;

        // Check if it's a text-based input that allows typing
        const isTextInput = (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
            activeElement.type !== 'button' &&
            activeElement.type !== 'submit' &&
            activeElement.type !== 'checkbox' &&
            activeElement.type !== 'radio' &&
            activeElement.type !== 'file' &&
            activeElement.type !== 'range';

        // Additional check: ensure the input is not disabled or readonly
        const isInteractive = !activeElement.disabled && !activeElement.readOnly;

        return isTextInput && isInteractive;
    };

    // Arrow key and tab navigation - only work when NOT actively typing
    useHotkeys('down', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            // Try main page navigation first
            if (!navigateInMainPage('down')) {
                navigateToNext();
            }
            return;
        }

        // In modals, try grid navigation first, then fall back to linear
        if (isInModal()) {
            e.preventDefault();
            // Try grid navigation first
            if (!navigateInGrid('down')) {
                navigateInModal('next');
            }
            return;
        }

        e.preventDefault();
        // Try main page grid/list navigation first, then fall back to normal navigation
        if (!navigateInMainPage('down')) {
            navigateToNext();
        }
    }, {
        enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enableOnContentEditable: true,
        enableOnFormTags: true,
        preventDefault: false
    });

    useHotkeys('up', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            // Try main page navigation first
            if (!navigateInMainPage('up')) {
                navigateToPrevious();
            }
            return;
        }

        // In modals, try grid navigation first, then fall back to linear
        if (isInModal()) {
            e.preventDefault();
            // Try grid navigation first
            if (!navigateInGrid('up')) {
                navigateInModal('previous');
            }
            return;
        }

        e.preventDefault();
        // Try main page grid/list navigation first, then fall back to normal navigation
        if (!navigateInMainPage('up')) {
            navigateToPrevious();
        }
    }, {
        enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enableOnContentEditable: true,
        enableOnFormTags: true,
        preventDefault: false
    });

    // Left and Right arrow keys for navigation
    useHotkeys('left', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            // Try main page navigation first
            if (!navigateInMainPage('left')) {
                navigateToPrevious();
            }
            return;
        }

        // In modals, try grid navigation first, then fall back to linear
        if (isInModal()) {
            e.preventDefault();
            // Try grid navigation first
            if (!navigateInGrid('left')) {
                navigateInModal('previous');
            }
            return;
        }

        e.preventDefault();
        // Try main page grid navigation first, then fall back to normal navigation
        if (!navigateInMainPage('left')) {
            navigateToPrevious();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('right', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            // Try main page navigation first
            if (!navigateInMainPage('right')) {
                navigateToNext();
            }
            return;
        }

        // In modals, try grid navigation first, then fall back to linear
        if (isInModal()) {
            e.preventDefault();
            // Try grid navigation first
            if (!navigateInGrid('right')) {
                navigateInModal('next');
            }
            return;
        }

        e.preventDefault();
        // Try main page grid navigation first, then fall back to normal navigation
        if (!navigateInMainPage('right')) {
            navigateToNext();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('tab', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // On data sources page, use native browser tab navigation
        if (isOnDataSourcesPage()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            navigateToNext();
            return;
        }

        // Focus trapping in modals - Tab stays within modal
        if (isInModal()) {
            e.preventDefault();
            navigateInModal('next');
            return;
        }

        e.preventDefault();
        navigateToNext();
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    useHotkeys('shift+tab', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        // On data sources page, use native browser tab navigation
        if (isOnDataSourcesPage()) {
            return;
        }

        // Force navigation to work even if blocking modals are present
        if (isInBlockingModal()) {
            e.preventDefault();
            e.stopPropagation();
            navigateToPrevious();
            return;
        }

        // Focus trapping in modals - Shift+Tab stays within modal
        if (isInModal()) {
            e.preventDefault();
            navigateInModal('previous');
            return;
        }

        e.preventDefault();
        navigateToPrevious();
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Enter key handling
    useHotkeys('enter', handleEnter, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // Space key for buttons - but not when typing in inputs
    useHotkeys('space', (e) => {
        // Don't prevent default if user is typing in an input field
        if (isTypingInInput()) {
            return;
        }

        if (document.activeElement && document.activeElement.getAttribute('role') === 'button') {
            e.preventDefault();
            document.activeElement.click();
        }
    }, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] });

    // ESC key to collapse expanded cards and close menus (hierarchical) - but not when typing
    useHotkeys('escape', (e) => {
        // Don't prevent default if user is typing in an input field (let them clear the input naturally)
        if (isTypingInInput()) {
            return;
        }

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

    // Reset input mode when modal state changes
    useEffect(() => {
        const currentModalState = isInModal();

        // If modal state changed (opened or closed), reset input mode
        if (currentModalState !== lastModalState) {
            if (!currentModalState) {
                // Modal closed - reset input mode state
                setIsInputMode(false);
                setCurrentInputElement(null);
                document.querySelectorAll('.input-mode-active').forEach(el => {
                    el.classList.remove('input-mode-active');
                });
            }
            setLastModalState(currentModalState);
        }
    }, [isInModal, lastModalState]);

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

    // Make modal grid elements focusable when modals open
    useEffect(() => {
        const makeGridElementsFocusable = () => {
            const modal = document.querySelector('.modal.show');
            if (!modal) return;

            // Find all grid containers in the modal
            const gridContainers = modal.querySelectorAll('ul, .icon-grid, .grid, [class*="grid"]');

            gridContainers.forEach(container => {
                // Get all potential grid items
                const gridItems = container.querySelectorAll(`
                    li, .icon-item, .grid-item,
                    div[role="button"], span[role="button"],
                    [data-testid], [data-cy*="icon"],
                    div[onclick], span[onclick], li[onclick],
                    .cursor-pointer li, li.cursor-pointer
                `);

                gridItems.forEach(item => {
                    // Make sure each grid item is focusable
                    if (!item.hasAttribute('tabindex')) {
                        item.setAttribute('tabindex', '0');
                    }

                    // Add keyboard-navigable class for styling
                    item.classList.add('keyboard-navigable');
                });
            });

            // Make file/folder list items focusable (for dynamic lists)
            const fileListItems = modal.querySelectorAll(`
                .folder-list-group-item,
                .list-group-item,
                .all-apps-link,
                [data-cy*="list-card"],
                [data-cy*="folder"],
                [data-cy*="app"],
                [data-testid*="folder"],
                [data-testid*="application"],
                .application-card,
                .folder-card,
                .app-list-item
            `);

            fileListItems.forEach(item => {
                // Skip items that are already focusable or disabled
                if (item.hasAttribute('tabindex') || item.hasAttribute('disabled')) return;

                // Make sure the item is visible and interactive
                const style = window.getComputedStyle(item);
                const rect = item.getBoundingClientRect();

                if (style.display !== 'none' && style.visibility !== 'hidden' &&
                    style.opacity !== '0' && rect.width > 0 && rect.height > 0) {

                    item.setAttribute('tabindex', '0');
                    item.classList.add('keyboard-navigable');
                }
            });
        };

        // Set up MutationObserver to watch for modal changes
        const observer = new MutationObserver((mutations) => {
            let modalChanged = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    if (mutation.attributeName === 'class' &&
                        (mutation.target.classList.contains('modal') ||
                            mutation.target.closest('.modal'))) {
                        modalChanged = true;
                    }
                } else if (mutation.type === 'childList') {
                    // Check if modal content was added/removed
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList?.contains('modal') ||
                                node.querySelector?.('.modal') ||
                                node.closest?.('.modal') ||
                                // Check for dynamic list items being added
                                node.classList?.contains('folder-list-group-item') ||
                                node.classList?.contains('list-group-item') ||
                                node.querySelector?.('.folder-list-group-item, .list-group-item')) {
                                modalChanged = true;
                            }
                        }
                    });
                }
            });

            if (modalChanged) {
                // Delay to ensure modal content is fully rendered
                setTimeout(makeGridElementsFocusable, 100);
            }
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        // Initial check for existing modals
        makeGridElementsFocusable();

        return () => {
            observer.disconnect();
        };
    }, []);

    // Make main page file/folder list items focusable
    useEffect(() => {
        const makeMainPageElementsFocusable = () => {
            // Don't interfere if we're in a modal
            if (isInModal()) return;

            // Make file/folder list items focusable in sidebar
            const fileListItems = document.querySelectorAll(`
                .folder-list-group-item,
                .list-group-item,
                .all-apps-link,
                [data-cy*="list-card"],
                [data-cy*="folder"],
                [data-cy*="app"],
                [data-testid*="folder"],
                [data-testid*="application"],
                .application-card,
                .folder-card,
                .app-list-item,
                .tj-folders li,
                .folders-sidebar li
            `);

            fileListItems.forEach(item => {
                // Skip items that are already focusable or disabled
                if (item.hasAttribute('tabindex') || item.hasAttribute('disabled')) return;

                // Make sure the item is visible and interactive
                const style = window.getComputedStyle(item);
                const rect = item.getBoundingClientRect();

                if (style.display !== 'none' && style.visibility !== 'hidden' &&
                    style.opacity !== '0' && rect.width > 0 && rect.height > 0) {

                    item.setAttribute('tabindex', '0');
                    item.classList.add('keyboard-navigable');
                }
            });

            // Make app cards focusable if they aren't already
            const appCards = document.querySelectorAll('.homepage-app-card, .app-card');
            appCards.forEach(card => {
                if (!card.hasAttribute('tabindex')) {
                    card.setAttribute('tabindex', '0');
                    card.classList.add('keyboard-navigable');
                }
            });
        };

        // Set up MutationObserver to watch for dynamic content changes on main page
        const mainPageObserver = new MutationObserver((mutations) => {
            let contentChanged = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Check for dynamic list items, app cards, or search inputs being added
                            if (node.classList?.contains('folder-list-group-item') ||
                                node.classList?.contains('list-group-item') ||
                                node.classList?.contains('homepage-app-card') ||
                                node.classList?.contains('app-card') ||
                                node.classList?.contains('tj-common-search-input') ||
                                node.tagName === 'INPUT' ||
                                node.querySelector?.('.folder-list-group-item, .list-group-item, .homepage-app-card, .app-card, input, .tj-common-search-input')) {
                                contentChanged = true;
                            }
                        }
                    });
                }
            });

            if (contentChanged) {
                // Delay to ensure content is fully rendered
                setTimeout(() => {
                    makeMainPageElementsFocusable();
                    ensureSidebarSearchWorks();
                }, 100);
            }
        });

        // Start observing the main content areas
        const sidebarContainer = document.querySelector('.tj-leftsidebar, .sidebar, .folders-sidebar');
        const mainContainer = document.querySelector('.main-content, .homepage-content, .applications-container');

        if (sidebarContainer) {
            mainPageObserver.observe(sidebarContainer, {
                childList: true,
                subtree: true
            });
        }

        if (mainContainer) {
            mainPageObserver.observe(mainContainer, {
                childList: true,
                subtree: true
            });
        }

        // Initial check for existing elements
        makeMainPageElementsFocusable();

        return () => {
            mainPageObserver.disconnect();
        };
    }, [isInModal]);

    // Make data sources page elements focusable when on data sources page
    useEffect(() => {
        if (!isOnDataSourcesPage()) return;

        const makeDataSourcesPageElementsFocusable = () => {
            makeDataSourceElementsFocusable();
        };

        // Set up MutationObserver to watch for data sources page content changes
        const dataSourcesObserver = new MutationObserver((mutations) => {
            let contentChanged = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Check for data sources related content being added
                            if (node.classList?.contains('datasource-card') ||
                                node.classList?.contains('card--clickable') ||
                                node.classList?.contains('datasources-list') ||
                                node.classList?.contains('datasource-search-holder') ||
                                node.querySelector?.('.datasource-card, .card--clickable, .datasources-list, .datasource-search-holder')) {
                                contentChanged = true;
                            }
                        }
                    });
                }
            });

            if (contentChanged) {
                // Delay to ensure content is fully rendered
                setTimeout(makeDataSourcesPageElementsFocusable, 100);
            }
        });

        // Start observing the data sources content areas
        const dataSourcesContainer = document.querySelector('.datasource-list-container, .datasource-modal-container');
        const sidebarContainer = document.querySelector('.tj-leftsidebar');

        if (dataSourcesContainer) {
            dataSourcesObserver.observe(dataSourcesContainer, {
                childList: true,
                subtree: true
            });
        }

        if (sidebarContainer) {
            dataSourcesObserver.observe(sidebarContainer, {
                childList: true,
                subtree: true
            });
        }

        // Initial check for existing data sources elements
        makeDataSourcesPageElementsFocusable();

        return () => {
            dataSourcesObserver.disconnect();
        };
    }, [isOnDataSourcesPage, makeDataSourceElementsFocusable]);

    // Add focus listener to ensure sidebar search inputs work when focused
    useEffect(() => {
        const handleFocus = (e) => {
            const target = e.target;
            if (target && target.tagName === 'INPUT' &&
                (target.closest('.tj-leftsidebar') || target.closest('.folder-list') ||
                    target.classList.contains('tj-common-search-input') ||
                    target.getAttribute('data-cy')?.includes('query-manager'))) {
                // This is a sidebar search input - ensure it works properly
                ensureSidebarSearchWorks();
            }
        };

        document.addEventListener('focusin', handleFocus);

        return () => {
            document.removeEventListener('focusin', handleFocus);
        };
    }, [ensureSidebarSearchWorks]);    // Show keyboard navigation hint
    return (
        <>
            <div className="keyboard-navigation-hint" style={{ display: 'none' }}>
                {isMenuOpen ? (
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