import React, { useEffect, useRef } from 'react';
import { WidgetBox } from '../WidgetBox';
import { ModuleWidgetBox } from '@/modules/Modules/components';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { noop } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { useCanvasDropHandler } from '@/AppBuilder/AppCanvas/useCanvasDropHandler';

export const DragLayer = ({ index, component, isModuleTab = false, disabled = false }) => {
  const [isRightSidebarOpen, toggleRightSidebar] = useStore(
    (state) => [state.isRightSidebarOpen, state.toggleRightSidebar],
    shallow
  );
  const isRightSidebarPinned = useStore((state) => state.isRightSidebarPinned);
  const { isModuleEditor } = useModuleContext();
  const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;
  const { handleDrop } = useCanvasDropHandler() || noop;
  const dragRef = useRef(null);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'box',
      item: { componentType: component.component, component },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: (item, monitor) => {
        const currentDragCanvasId = useGridStore.getState().currentDragCanvasId;
        handleDrop(item, currentDragCanvasId);
      },
    }),
    [component.component]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  useEffect(() => {
    if (isDragging && !isModuleEditor) {
      if (!isRightSidebarPinned) {
        toggleRightSidebar(!isRightSidebarOpen);
      }
      setShowModuleBorder(true);
    }
  }, [isDragging, setShowModuleBorder, isModuleEditor, toggleRightSidebar]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger the drop action when Enter or Space is pressed
      const item = { componentType: component.component, component };
      const currentDragCanvasId = useGridStore.getState().currentDragCanvasId;
      handleDrop(item, currentDragCanvasId);

      // Close sidebar if not pinned
      if (!isModuleEditor && !isRightSidebarPinned) {
        toggleRightSidebar(false);
      }
    }
  };

  // const size = isModuleTab
  //   ? component.module_container.layouts[currentLayout]
  //   : component.defaultSize || { width: 30, height: 40 };

  return (
    <>
      <div
        ref={(node) => {
          dragRef.current = node;
          if (!disabled) {
            drag(node);
          }
        }}
        className={`draggable-box${disabled ? ' disabled' : ''}`}
        style={{ height: '100%', width: isModuleTab && '100%' }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`Add ${component.displayName} component to canvas`}
        onKeyDown={handleKeyDown}
      >
        {isModuleTab ? <ModuleWidgetBox module={component} /> : <WidgetBox index={index} component={component} />}
      </div>
    </>
  );
};
