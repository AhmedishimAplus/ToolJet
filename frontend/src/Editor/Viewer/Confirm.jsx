import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useScreenReader } from '@/modules/common/hooks';

export function Confirm({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  queryConfirmationData,
  darkMode,
  confirmButtonText = '',
  cancelButtonText = '',
  callCancelFnOnConfirm = true,
  headerStyle = {},
}) {
  const [showModal, setShow] = useState(show);
  const { t } = useTranslation();
  const { speak } = useScreenReader();

  useEffect(() => {
    setShow(show);
  }, [show]);

  const handleClose = () => {
    onCancel && onCancel();
    setShow(false);
  };

  const handleConfirm = () => {
    if (callCancelFnOnConfirm) {
      onConfirm(queryConfirmationData);
      handleClose();
    } else {
      onConfirm(queryConfirmationData);
      setShow(false);
    }
  };

  return (
    <Modal
      show={showModal}
      animation={false}
      onHide={handleClose}
      size="sm"
      centered={true}
      contentClassName={darkMode ? 'dark-theme' : ''}
    >
      {title && (
        <Modal.Header style={headerStyle}>
          <Modal.Title>{title}</Modal.Title>
          <span onClick={handleClose}>
            <SolidIcon
              data-tooltip-id="tooltip-for-copy-invitation-link"
              data-tooltip-content="Copy invitation link"
              width="16"
              fill={'var(--slate12)'}
              name="remove"
              className="cursor-pointer"
            />
          </span>
        </Modal.Header>
      )}
      <Modal.Body data-cy={'modal-message'}>{message}</Modal.Body>
      <Modal.Footer className="mt-3">
        <button
          className="btn"
          onClick={handleClose}
          onFocus={() => speak('Cancel button')}
          onMouseEnter={() => speak('Cancel button')}
          data-cy={'modal-cancel-button'}
        >
          {cancelButtonText === '' ? t('globals.cancel', 'Cancel') : cancelButtonText}
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            speak('Confirmed');
            handleConfirm();
          }}
          onFocus={() => speak('Yes button')}
          onMouseEnter={() => speak('Yes button')}
          data-cy={'modal-confirm-button'}
        >
          {confirmButtonText === '' ? t('globals.yes', 'Yes') : confirmButtonText}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
