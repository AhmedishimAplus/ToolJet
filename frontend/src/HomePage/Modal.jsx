import React, { useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';

export default function Modal({
  title,
  titleAdornment,
  show,
  closeModal,
  customClassName,
  children,
  footerContent = null,
  headerContent = null,
  size = 'sm',
  closeButton = true,
  speak,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  // Handle Escape key announcement
  useEffect(() => {
    if (!show || !speak) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const modalTitle = typeof title === 'string' ? title : 'modal';
        speak(`Exiting ${modalTitle} menu`);
        setTimeout(() => closeModal(), 1500);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, title, speak, closeModal]);

  const modalFooter = footerContent ? (
    <BootstrapModal.Footer className={`modal-divider ${darkMode ? 'dark-theme-modal-divider' : ''}`}>
      {footerContent}
    </BootstrapModal.Footer>
  ) : null;
  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component animation-fade${customClassName ? ` ${customClassName}` : ''} ${darkMode && 'dark-theme'
        }`}
      dialogClassName="custom-modal-width"
      show={show}
      size={size}
      backdrop={true}
      keyboard={speak ? false : true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={speak ? undefined : () => closeModal()}
      centered
      data-cy={'modal-component'}
    >
      <BootstrapModal.Header>
        {typeof title === 'string' ? (
          <BootstrapModal.Title data-cy={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
            {title}
            {titleAdornment}
          </BootstrapModal.Title>
        ) : (
          title
        )}
        {headerContent && <div>{headerContent}</div>}
        {closeButton && (
          <button
            className="btn-close"
            aria-label="Close"
            onClick={() => {
              if (speak) {
                const modalTitle = typeof title === 'string' ? title : 'modal';
                speak(`Exiting ${modalTitle} menu`);
                setTimeout(() => closeModal(), 1500);
              } else {
                closeModal();
              }
            }}
            onFocus={() => speak && speak('Close button')}
            data-cy="modal-close-button"
          ></button>
        )}
      </BootstrapModal.Header>
      <BootstrapModal.Body className="modal-body-scrollable">{children}</BootstrapModal.Body>
      {modalFooter ? modalFooter : <></>}
    </BootstrapModal>
  );
}
