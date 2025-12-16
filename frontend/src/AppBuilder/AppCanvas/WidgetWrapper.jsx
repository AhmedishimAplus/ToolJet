import React, { memo, useEffect, useState, useCallback } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { ConfigHandle } from './ConfigHandle/ConfigHandle';
import cx from 'classnames';
import RenderWidget from './RenderWidget';
import { NO_OF_GRIDS } from './appCanvasConstants';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const WidgetWrapper = memo(
  ({
    id,
    currentLayout = 'desktop',
    gridWidth,
    subContainerIndex,
    onOptionChange,
    onOptionsChange,
    inCanvas = false,
    readOnly,
    mode,
    darkMode,
    moduleId,
    parentId,
  }) => {
    const calculateMoveableBoxHeightWithId = useStore((state) => state.calculateMoveableBoxHeightWithId, shallow);
    const stylesDefinition = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles,
      shallow
    );
    const layoutData = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout],
      shallow
    );
    const temporaryLayouts = useStore((state) => state.temporaryLayouts?.[id], shallow);
    const isWidgetActive = useStore((state) => state.selectedComponents.find((sc) => sc === id) && !readOnly, shallow);
    const isDragging = useStore((state) => state.draggingComponentId === id);
    const isResizing = useStore((state) => state.resizingComponentId === id);
    const componentType = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.component,
      shallow
    );
    const setHoveredComponentForGrid = useStore((state) => state.setHoveredComponentForGrid, shallow);
    const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);
    const setSelectedNodePath = useStore((state) => state.setSelectedNodePath, shallow);
    const selectedSidebarItem = useStore((state) => state.selectedSidebarItem, shallow);
    const componentName = useStore((state) => state.getComponentDefinition(id, moduleId)?.component?.name || '', shallow);
    const canShowInCurrentLayout = useStore((state) => {
      const others = state.getResolvedComponent(id, subContainerIndex, moduleId)?.others;
      return others?.[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'];
    });

    // Track if = or - key is being held down for resizing
    const [resizeModifier, setResizeModifier] = useState(null); // 'expand' or 'shrink'

    // Listen for = or - key being held down
    useEffect(() => {
      if (!isWidgetActive || readOnly) return;

      const handleKeyDown = (e) => {
        const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);

        // Check for = (equal/plus) or - (minus) key
        if (e.key === '=' || e.code === 'Equal') {
          e.preventDefault();
          setResizeModifier('expand');
          // Set global state to prevent movement
          const { setIsKeyboardResizing } = useStore.getState();
          setIsKeyboardResizing(true);
          return;
        } else if (e.key === '-' || e.code === 'Minus') {
          e.preventDefault();
          setResizeModifier('shrink');
          // Set global state to prevent movement
          const { setIsKeyboardResizing } = useStore.getState();
          setIsKeyboardResizing(true);
          return;
        }

        // If arrow key is pressed while resize modifier is active
        if (isArrowKey && resizeModifier) {
          e.preventDefault();
          e.stopPropagation();

          const { resizeComponentWithKeyboard } = useStore.getState();
          resizeComponentWithKeyboard(e.key, resizeModifier === 'expand');

          // Announce resize action
          const action = resizeModifier === 'expand' ? 'Expanding' : 'Shrinking';
          const direction = e.key.replace('Arrow', '').toLowerCase();
          speak(`${action} ${componentName || 'component'} ${direction}`);
        }
      };

      const handleKeyUp = (e) => {
        // Clear resize modifier when = or - is released
        if (e.key === '=' || e.code === 'Equal' || e.key === '-' || e.code === 'Minus') {
          setResizeModifier(null);
          // Clear global state to allow movement again
          const { setIsKeyboardResizing } = useStore.getState();
          setIsKeyboardResizing(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [isWidgetActive, readOnly, resizeModifier, componentName, speak]);

    const visibility = useStore((state) => {
      const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
      const componentExposedVisibility = state.getExposedValueOfComponent(id, moduleId)?.isVisible;
      if (componentExposedVisibility === false) return false;
      if (component?.properties?.visibility === false || component?.styles?.visibility === false) return false;
      return true;
    });

    if (!canShowInCurrentLayout || !layoutData) {
      return null;
    }

    let newLayoutData = layoutData;

    if (componentType === 'ModuleContainer' && mode === 'view') {
      newLayoutData = { ...layoutData, top: 0, left: 0, width: NO_OF_GRIDS };
    }

    const width = gridWidth * newLayoutData?.width;
    const height = calculateMoveableBoxHeightWithId(id, currentLayout, stylesDefinition);
    const styles = {
      width: width + 'px',
      height: visibility === false ? '10px' : `${height}px`,
      transform: `translate(${newLayoutData.left * gridWidth}px, ${temporaryLayouts?.top ?? newLayoutData.top}px)`,
      WebkitFontSmoothing: 'antialiased',
      border: visibility === false && mode === 'edit' ? `1px solid var(--border-default)` : 'none',
    };

    const isModuleContainer = componentType === 'ModuleContainer';
    const { speak } = useScreenReader();

    const handleKeyDown = (e) => {
      // Handle Enter key for selection
      if (e.key === 'Enter' && !readOnly && !isModuleContainer) {
        e.preventDefault();
        e.stopPropagation();
        // Select the component when Enter is pressed
        setSelectedComponents([id]);
        speak(`${componentName || 'Component'} ${componentType} selected`);
      }
      // Handle Escape to deselect
      if (e.key === 'Escape' && !readOnly && !isModuleContainer && isWidgetActive) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedComponents([]);
        speak('Component deselected');
      }
    };

    const handleFocusAnnouncement = () => {
      if (!readOnly && !isModuleContainer) {
        speak(`${componentName || 'Component'} ${componentType}`);
      }
    };

    if (!componentType) return null;
    return (
      <>
        <div
          className={cx(`ele-${id}`, {
            [`target widget-target target1  moveable-box widget-${id}`]: !readOnly,
            [`widget-${id} nested-target`]: id !== 'canvas' && !readOnly,
            'position-absolute': readOnly,
            'active-target': isWidgetActive,
            'opacity-0': isDragging || isResizing,
            'module-container': isModuleContainer,
          })}
          data-id={`${id}`}
          id={id}
          widgetid={id}
          component-type={componentType}
          parent-id={parentId}
          tabIndex={!readOnly && !isModuleContainer ? 0 : undefined}
          onKeyDown={handleKeyDown}
          style={{
            // zIndex: mode === 'view' && widget.component.component == 'Datepicker' ? 2 : null,
            ...styles,
          }}
          onMouseEnter={() => {
            if (isDragging || isModuleContainer) return;
            setHoveredComponentForGrid(id);
            // Update State Inspector to show this component when inspect tab is active
            if (selectedSidebarItem === 'inspect' && componentName) {
              setSelectedNodePath(`components.${componentName}`);
            }
          }}
          onMouseLeave={() => {
            if (isDragging || isModuleContainer) return;
            setHoveredComponentForGrid('');
          }}
          onFocus={() => {
            if (isDragging || isModuleContainer || readOnly) return;
            setHoveredComponentForGrid(id);
            handleFocusAnnouncement();
            // Update State Inspector to show this component when inspect tab is active
            if (selectedSidebarItem === 'inspect' && componentName) {
              setSelectedNodePath(`components.${componentName}`);
            }
          }}
          onBlur={() => {
            if (isDragging || isModuleContainer || readOnly) return;
            setHoveredComponentForGrid('');
          }}
        >
          {mode == 'edit' && (
            <ConfigHandle
              id={id}
              widgetTop={temporaryLayouts?.top ?? layoutData.top}
              widgetHeight={temporaryLayouts?.height ?? layoutData.height}
              showHandle={isWidgetActive}
              componentType={componentType}
              visibility={visibility}
              customClassName={isModuleContainer ? 'module-container' : ''}
              isModuleContainer={isModuleContainer}
              subContainerIndex={subContainerIndex}
            />
          )}
          <RenderWidget
            id={id}
            componentType={componentType}
            widgetHeight={newLayoutData.height}
            widgetWidth={width}
            inCanvas={inCanvas}
            subContainerIndex={subContainerIndex}
            onOptionChange={onOptionChange}
            darkMode={darkMode}
            onOptionsChange={onOptionsChange}
            moduleId={moduleId}
          />
        </div>
      </>
    );
  }
);

WidgetWrapper.displayName = 'WidgetWrapper';

export default WidgetWrapper;
