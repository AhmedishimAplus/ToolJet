import React from 'react';
import { ConfirmDialog } from '@/_components';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useScreenReader } from '@/modules/common/hooks';

export const DeleteWidgetConfirmation = ({ darkMode }) => {
  const showWidgetDeleteConfirmation = useStore((state) => state.showWidgetDeleteConfirmation, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const { speak } = useScreenReader();

  const handleConfirmDelete = () => {
    speak('Deleting component');
    deleteComponents();
  };

  return (
    <ConfirmDialog
      show={showWidgetDeleteConfirmation}
      message={'Are you sure you want to delete this component?'}
      onConfirm={handleConfirmDelete}
      onCancel={() => setWidgetDeleteConfirmation(false)}
      darkMode={darkMode}
    />
  );
};
