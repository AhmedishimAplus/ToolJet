import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { Tooltip } from 'react-tooltip';
import { QueryDataPane } from './QueryDataPane';
import QueryManager from '../QueryManager/QueryManager';
import useWindowResize from '@/_hooks/useWindowResize';
import { isEmpty, isEqual } from 'lodash';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import SectionCollapse from '@/_ui/Icon/solidIcons/SectionCollapse';
import SectionExpand from '@/_ui/Icon/solidIcons/SectionExpand';
import { shallow } from 'zustand/shallow';
import QueryKeyHooks from './QueryKeyHooks';

const MemoizedQueryDataPane = memo(QueryDataPane);
const MemoizedQueryManager = memo(QueryManager);

export const QueryPanel = ({ darkMode }) => {
  const setQueryPanelHeight = useStore((state) => state.queryPanel.setQueryPanelHeight);
  const isDraggingQueryPane = useStore((state) => state.queryPanel.isDraggingQueryPane, shallow);
  const setIsDraggingQueryPane = useStore((state) => state.queryPanel.setIsDraggingQueryPane, shallow);
  const isQueryPaneExpanded = useStore((state) => state.queryPanel.isQueryPaneExpanded, shallow);
  const setIsQueryPaneExpanded = useStore((state) => state.queryPanel.setIsQueryPaneExpanded, shallow);

  const queryManagerPreferences = useRef(
    JSON.parse(localStorage.getItem('queryManagerPreferences')) ?? {
      isExpanded: true,
      queryPanelHeight: 100,
    }
  );
  const queryPaneRef = useRef(null);
  const dragHandleRef = useRef(null);
  const [height, setHeight] = useState(
    queryManagerPreferences.current?.queryPanelHeight >= 95
      ? 50
      : queryManagerPreferences.current?.queryPanelHeight ?? 70
  );
  const [windowSize, isWindowResizing] = useWindowResize();
  const rafIdRef = useRef(null);
  const isNearDragArea = useRef(false);

  useEffect(() => {
    const queryPanelStoreListner = useStore.subscribe(({ queryPanel: { selectedQuery } }, prevState) => {
      if (isEmpty(prevState?.queryPanel?.selectedQuery) || isEmpty(selectedQuery)) {
        return;
      }

      if (prevState?.queryPanel?.selectedQuery?.id !== selectedQuery.id) {
        return;
      }

      //removing updated_at since this value changes whenever the data is updated in the BE
      const formattedQuery = deepClone(selectedQuery);
      delete formattedQuery.updated_at;

      const formattedPrevQuery = deepClone(prevState?.queryPanel?.selectedQuery || {});
      delete formattedPrevQuery.updated_at;

      if (!isEqual(formattedQuery, formattedPrevQuery)) {
        useStore.getState().dataQuery.saveData(selectedQuery);
      }
    });

    return queryPanelStoreListner;
  }, []);

  // useEffect(() => {
  //   onQueryPaneDragging(isDragging);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isDragging]);

  useEffect(() => {
    setQueryPanelHeight(queryPaneRef?.current?.offsetHeight);
    // if (isWindowResizing) {
    //   onQueryPaneDragging(true);
    // } else {
    //   onQueryPaneDragging(false);
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize.height, isQueryPaneExpanded, isWindowResizing]);

  const onMouseDown = useCallback(
    (e) => {
      if (isNearDragArea.current) {
        e.preventDefault();
        setIsDraggingQueryPane(true);
      }
    },
    []
  );

  const onMouseUp = useCallback((e) => {
    setIsDraggingQueryPane(false);
    setQueryPanelHeight(queryPaneRef?.current?.offsetHeight);

    const clientY = e.clientY;
    const newHeight = Math.min(Math.max((clientY / window.innerHeight) * 100, 4.5), 94);
    queryManagerPreferences.current = {
      ...queryManagerPreferences.current,
      queryPanelHeight: newHeight,
      isExpanded: newHeight <= 94,
    };

    localStorage.setItem('queryManagerPreferences', JSON.stringify(queryManagerPreferences.current));
  }, []);

  const onMouseMove = useCallback(
    (e) => {
      if (!queryPaneRef.current || !dragHandleRef.current) return;

      // Only process if dragging or if we're near the query panel
      if (!isDraggingQueryPane) {
        const componentTop = Math.round(queryPaneRef.current.getBoundingClientRect().top);
        const clientY = e.clientY;

        // Only check if we're within reasonable distance (50px) of the panel top
        if (Math.abs(clientY - componentTop) > 50) {
          if (isNearDragArea.current) {
            isNearDragArea.current = false;
            dragHandleRef.current.style.cursor = 'default';
          }
          return;
        }

        const withinDraggableArea = clientY >= componentTop && clientY <= componentTop + 10;
        if (withinDraggableArea !== isNearDragArea.current) {
          isNearDragArea.current = withinDraggableArea;
          dragHandleRef.current.style.cursor = withinDraggableArea ? 'row-resize' : 'default';
        }
        return;
      }

      // Handle dragging
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const clientY = e.clientY;
        const newHeight = Math.min(Math.max((clientY / window.innerHeight) * 100, 4.5), 94);
        setIsQueryPaneExpanded(newHeight <= 94);
        setHeight(newHeight);
      });
    },
    [isDraggingQueryPane, setIsQueryPaneExpanded]
  );

  useEventListener('mousemove', onMouseMove);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEventListener(
    'mouseup',
    (event) => {
      if (isDraggingQueryPane) {
        onMouseUp(event);
      }
    },
    document
  );

  const toggleQueryEditor = useCallback(() => {
    const newIsExpanded = !isQueryPaneExpanded;
    setIsQueryPaneExpanded(newIsExpanded);
    localStorage.setItem(
      'queryManagerPreferences',
      JSON.stringify({ isExpanded: newIsExpanded, queryPanelHeight: newIsExpanded ? height : 95 })
    );
    setQueryPanelHeight(newIsExpanded ? height : 95);
  }, [height, isQueryPaneExpanded, setQueryPanelHeight, setIsQueryPaneExpanded]);

  return (
    <div className={cx({ 'dark-theme theme-dark': darkMode })}>
      <div
        className={`query-pane query-pane-header ${isQueryPaneExpanded ? 'expanded' : 'collapsed'}`}
        style={{
          height: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 12,
          cursor: 'default',
        }}
      >
        <div
          style={{ width: '288px', paddingLeft: '12px', height: '100%' }}
          className="d-flex justify-content align-items-center"
        >
          <div
            style={{
              height: '100%',
              paddingTop: isQueryPaneExpanded ? '2px' : '4px',
              borderTop: isQueryPaneExpanded && '2px solid #4368E3',
              width: '77px',
            }}
          >
            <button
              data-cy="query-manager-toggle-button"
              className="d-flex items-center justify-start mb-0 font-weight-500 text-dark select-none query-manager-toggle-button gap-1"
              onClick={toggleQueryEditor}
            >
              <span>{isQueryPaneExpanded ? <SectionCollapse width="13.33" /> : <SectionExpand width="13.33" />}</span>
              <span>Queries</span>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={queryPaneRef}
        onMouseDown={onMouseDown}
        className="query-pane query-pane-content"
        id="query-manager"
        style={{
          height: `calc(100% - ${isQueryPaneExpanded ? height : 100}%)`,
          maxHeight: '93.5%',
          willChange: isDraggingQueryPane ? 'transform' : 'auto',
          ...(!isQueryPaneExpanded && {
            border: 'none',
          }),
          ...(isDraggingQueryPane && {
            zIndex: 11,
          }),
        }}
      >
        <div
          ref={dragHandleRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '10px',
            cursor: isDraggingQueryPane ? 'row-resize' : 'default',
            zIndex: 13,
          }}
        />
        {isQueryPaneExpanded && (
          <QueryKeyHooks isExpanded={isQueryPaneExpanded}>
            <MemoizedQueryDataPane darkMode={darkMode} />
            <div className="query-definition-pane-wrapper">
              <div className="query-definition-pane">
                <MemoizedQueryManager darkMode={darkMode} />
              </div>
            </div>
          </QueryKeyHooks>
        )}
      </div>
      <Tooltip id="tooltip-for-query-panel-footer-btn" className="tooltip" />
    </div>
  );
};