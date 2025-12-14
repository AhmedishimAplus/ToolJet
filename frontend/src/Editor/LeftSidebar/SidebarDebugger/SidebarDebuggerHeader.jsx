import React from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useScreenReader } from '@/modules/common/hooks';

export const SidebarDebuggerHeader = ({ darkMode, clearErrorLogs, setPinned, pinned }) => {
  const { speak } = useScreenReader();

  return (
    <HeaderSection darkMode={darkMode}>
      <HeaderSection.PanelHeader title="Debugger">
        <div className="d-flex justify-content-end" style={{ gap: '2px' }}>
          <ButtonSolid
            onClick={() => {
              speak('Logs cleared');
              clearErrorLogs();
            }}
            leftIcon="trash"
            variant="tertiary"
            className="tj-text-xsm left-sidebar-header-btn"
            style={{ width: '76px', height: '28px' }}
            iconWidth="14"
            title={'Clear'}
            fill={`var(--icons-strong)`}
          >
            Clear
          </ButtonSolid>
          <ButtonSolid
            title={`${pinned ? 'Unpin' : 'Pin'}`}
            onClick={() => {
              speak(pinned ? 'Debugger unpinned' : 'Debugger pinned');
              setPinned(!pinned);
            }}
            variant="tertiary"
            leftIcon={pinned ? 'unpin' : 'pin'}
            iconWidth="14"
            className="left-sidebar-header-btn"
            fill={`var(--slate12)`}
          ></ButtonSolid>
        </div>
      </HeaderSection.PanelHeader>
    </HeaderSection>
  );
};

export default SidebarDebuggerHeader;
