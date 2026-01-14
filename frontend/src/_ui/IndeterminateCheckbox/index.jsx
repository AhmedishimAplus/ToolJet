import React from 'react';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, className = '', ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      resolvedRef.current.indeterminate = !rest.checked && indeterminate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRef, indeterminate]);

  return (
    <>
      <div class="form-check mb-0">
        <input
          type="checkbox"
          data-cy="checkbox-input"
          ref={resolvedRef}
          className={className + ' cursor-pointer form-check-input'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.click();
            }
            // Call the custom onKeyDown handler if provided
            if (rest.onKeyDown) {
              rest.onKeyDown(e);
            }
          }}
          {...rest}
        />
      </div>
    </>
  );
});

export default IndeterminateCheckbox;
