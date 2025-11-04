import React from 'react';
import { Button } from '@/components/ui/Button/Button';

const PageOptions = React.forwardRef(({ type, text, icon, onClick, darkMode, disabled, onKeyDown }, ref) => {
  return (
    <div className="field">
      <Button
        ref={ref}
        disabled={disabled}
        onClick={onClick}
        onKeyDown={onKeyDown}
        style={{ height: '30px', fontWeight: '400' }}
        className={`${darkMode ? 'page-options-dark' : ''}`}
        leadingIcon={icon}
        variant="secondary"
        tabIndex={-1}
      >
        {text}
      </Button>
    </div>
  );
});

PageOptions.displayName = 'PageOptions';

export default PageOptions;
