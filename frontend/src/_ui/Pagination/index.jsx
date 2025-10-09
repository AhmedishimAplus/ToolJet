import React, { useEffect } from 'react';
import { Button } from '@/_ui/LeftSidebar';

const Pagination = ({
  darkMode,
  gotoNextPage,
  gotoPreviousPage,
  currentPage,
  totalPage,
  isDisabled,
  disableInput = false,
}) => {
  const [currentPageNumber, setCurrentPageNumber] = React.useState(currentPage);

  const handleOnChange = (value) => {
    const parsedValue = parseInt(value, 10);
    if (parsedValue > 0 && parsedValue <= totalPage && parsedValue !== currentPage) {
      gotoNextPage(true, parsedValue);
    } else if (parsedValue > totalPage) {
      setCurrentPageNumber(totalPage);
      gotoNextPage(true, totalPage);
    } else if (isNaN(parsedValue) || parsedValue === 0) {
      setCurrentPageNumber(1);
      gotoNextPage(true, 1);
    }
  };

  useEffect(() => {
    setCurrentPageNumber(currentPage);
  }, [currentPage]);

  return (
    <div className="pagination-container d-flex" data-cy="pagination-section">
      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoPreviousPage();
        }}
        classNames={darkMode ? 'dark' : 'nothing'}
        styles={{ height: '44px', width: '44px', minHeight: '44px', minWidth: '44px' }}
        disabled={isDisabled || currentPage === 1}
        aria-label="Go to previous page"
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-left.svg'} />
      </Button.UnstyledButton>

      <div className="d-flex align-items-center mx-1">
        <input
          disabled={isDisabled || disableInput}
          type="text"
          className="form-control-pagination"
          data-cy={`current-page-number-${currentPageNumber}`}
          value={currentPageNumber}
          aria-label="Current page number"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleOnChange(event.target.value);
            }
          }}
          onBlur={(event) => {
            handleOnChange(event.target.value);
          }}
          onChange={(event) => {
            setCurrentPageNumber(event.target.value);
          }}
        />
        <span className="mx-1" data-cy={`total-page-number-${totalPage}`}>
          / {totalPage}
        </span>
      </div>

      <Button.UnstyledButton
        onClick={(event) => {
          event.stopPropagation();
          gotoNextPage();
        }}
        classNames={darkMode && 'dark'}
        styles={{ height: '44px', width: '44px', minHeight: '44px', minWidth: '44px' }}
        disabled={isDisabled || currentPage === totalPage}
        aria-label="Go to next page"
      >
        <Button.Content iconSrc={'assets/images/icons/chevron-right.svg'} />
      </Button.UnstyledButton>
    </div>
  );
};

export default Pagination;
