import React, { Suspense } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useAppData from '@/AppBuilder/_hooks/useAppData';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import cx from 'classnames';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AppCanvas from '@/AppBuilder/AppCanvas';
import RightSideBar from '@/AppBuilder/RightSideBar';
import QueryPanel from '@/AppBuilder/QueryPanel';
import RealtimeCursors from '@/AppBuilder/RealtimeCursors';
import EditorHeader from '@/AppBuilder/Header';
import LeftSidebar from '@/AppBuilder/LeftSidebar';
import Popups from './Popups';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import RightSidebarToggle from '@/AppBuilder/RightSideBar/RightSidebarToggle';
import { shallow } from 'zustand/shallow';

import ArtifactPreview from './ArtifactPreview';

// Keyboard Navigation imports
import KeyboardNavigationManager from '@/_components/KeyboardNavigationManager';
import KeyboardNavigatedTopBar from '@/_components/KeyboardNavigatedTopBar';
import KeyboardNavigatedLeftSidebar from '@/_components/KeyboardNavigatedLeftSidebar';
import KeyboardNavigatedCanvas from '@/_components/KeyboardNavigatedCanvas';
import KeyboardNavigatedWidgetManager from '@/_components/KeyboardNavigatedWidgetManager';
import KeyboardNavigatedQueryPanel from '@/_components/KeyboardNavigatedQueryPanel';

// const EditorHeader = lazy(() => import('@/AppBuilder/Header'));
// const LeftSidebar = lazy(() => import('@/AppBuilder/LeftSidebar'));
// const AppCanvas = lazy(() => import('@/AppBuilder/AppCanvas'));
// const RightSideBar = lazy(() => import('@/AppBuilder/RightSideBar'));
// const QueryPanel = lazy(() => import('@/AppBuilder/QueryPanel'));

// TODO: split Loader into separate component and remove editor loading state from Editor
export const Editor = ({ id: appId, darkMode, moduleId = 'canvas', switchDarkMode, appType = 'front-end' }) => {
  useAppData(appId, moduleId, darkMode);
  const isEditorLoading = useStore((state) => state.loaderStore.modules[moduleId].isEditorLoading, shallow);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
  const isModuleEditor = appType === 'module';

  const updateIsTJDarkMode = useStore((state) => state.updateIsTJDarkMode, shallow);
  const appBuilderMode = useStore((state) => state.appStore.modules[moduleId]?.app?.appBuilderMode ?? 'visual');

  const isUserInZeroToOneFlow = appBuilderMode === 'ai';

  const changeToDarkMode = (newMode) => {
    updateIsTJDarkMode(newMode);
    switchDarkMode(newMode);
  };

  //TODO: This can be added to the mode slice and set based on the mode
  if (isEditorLoading) {
    return (
      <div className={cx('apploader', { 'dark-theme theme-dark': darkMode })}>
        <TJLoader />
      </div>
    );
  }
  return (
    <KeyboardNavigationManager>
      <div className={cx('wrapper', { editor: currentMode === 'edit' })}>
        <ErrorBoundary>
          <ModuleProvider moduleId={moduleId} appType={appType} isModuleMode={false} isModuleEditor={isModuleEditor}>
            <Suspense fallback={<div>Loading...</div>}>
              <KeyboardNavigatedTopBar>
                <EditorHeader darkMode={darkMode} isUserInZeroToOneFlow={isUserInZeroToOneFlow} />
              </KeyboardNavigatedTopBar>

              <KeyboardNavigatedLeftSidebar>
                <LeftSidebar
                  switchDarkMode={changeToDarkMode}
                  darkMode={darkMode}
                  isUserInZeroToOneFlow={isUserInZeroToOneFlow}
                />
              </KeyboardNavigatedLeftSidebar>
            </Suspense>
            {isUserInZeroToOneFlow ? (
              <ArtifactPreview darkMode={darkMode} isUserInZeroToOneFlow={isUserInZeroToOneFlow} />
            ) : (
              <>
                {window?.public_config?.ENABLE_MULTIPLAYER_EDITING === 'true' && <RealtimeCursors />}
                <DndProvider backend={HTML5Backend}>
                  <KeyboardNavigatedCanvas>
                    <AppCanvas moduleId={moduleId} appId={appId} switchDarkMode={switchDarkMode} darkMode={darkMode} />
                  </KeyboardNavigatedCanvas>
                  <KeyboardNavigatedQueryPanel>
                    <QueryPanel darkMode={darkMode} />
                  </KeyboardNavigatedQueryPanel>
                  <RightSidebarToggle darkMode={darkMode} />
                  <KeyboardNavigatedWidgetManager>
                    <RightSideBar darkMode={darkMode} />
                  </KeyboardNavigatedWidgetManager>
                </DndProvider>
                <Popups darkMode={darkMode} />
              </>
            )}
          </ModuleProvider>
        </ErrorBoundary>
      </div>
    </KeyboardNavigationManager>
  );
};
