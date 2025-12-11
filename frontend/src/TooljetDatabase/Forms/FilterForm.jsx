import './styles.scss';
import React, { useContext, useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import { TooljetDatabaseContext } from '../index';
import { operators } from '../constants';
import { debounce } from 'lodash';
import { ToolTip } from '@/_components';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const FilterForm = ({ filters, setFilters, index, column = '', operator = '', value = '', generateMessage }) => {
  const { speak } = useScreenReader();
  const { columns, setPageCount } = useContext(TooljetDatabaseContext);

  const [filterInputValue, setFilterInputValue] = useState(value);

  useEffect(() => {
    const debouncedFilter = debounce(() => {
      const prevFilters = { ...filters };
      prevFilters[index].value = filterInputValue;

      setFilters(prevFilters);
    }, 500);

    debouncedFilter();

    return debouncedFilter.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInputValue]);

  useEffect(() => {
    setFilterInputValue(value);
  }, [value]);

  const handleColumnChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].column = value;

    setFilters(prevFilters);
  };

  const handleOperatorChange = (value) => {
    const prevFilters = { ...filters };
    prevFilters[index].operator = value;

    setFilters(prevFilters);
  };

  const handleDelete = () => {
    const prevFilters = { ...filters };
    delete prevFilters[index];
    setFilters(prevFilters);
    setPageCount(1);
  };

  const handleSelectOpen = () => {
    document.body.classList.add('react-select-open');
    const selectControl = document.querySelector('.select-operation-field .react-select__control');
    if (selectControl) {
      const rect = selectControl.getBoundingClientRect();
      document.documentElement.style.setProperty('--select-width', `${rect.width}px`);
      document.documentElement.style.setProperty('0', `${rect.left}px`);
      document.documentElement.style.setProperty('100%', `${rect.bottom + window.scrollY}px`);
    }
  };

  const handleSelectClose = () => {
    document.body.classList.remove('react-select-open');
  };

  const displayColumns = columns.map(({ accessor }) => ({ value: accessor, label: accessor }));

  return (
    <div className="d-flex align-items-center">
      <div className="select-column-field width-lg" data-cy="select-column-field">
        <Select
          useMenuPortal={false}
          placeholder="Select.."
          value={column}
          options={displayColumns}
          onChange={handleColumnChange}
          width="100%"
          borderRadius="8px 0px 0px 8px"
          onMenuOpen={handleSelectOpen}
          onMenuClose={handleSelectClose}
          onFocus={() => speak(`Column dropdown, ${column || 'Select..'} selected`)}
        />
      </div>
      <ToolTip
        message={generateMessage(operator)}
        trigger={['hover']}
        delay={{ show: '0', hide: '0' }}
        show={['gt', 'lte', 'gte'].includes(operator)}
      >
        <div className="select-operation-field width-sm" data-cy="select-operation-field">
          <Select
            placeholder="Select.."
            useMenuPortal={false}
            value={operator}
            options={operators}
            onChange={handleOperatorChange}
            width="100%"
            borderRadius="0px"
            onMenuOpen={handleSelectOpen}
            onMenuClose={handleSelectClose}
            onFocus={() => speak(`Operation dropdown, ${operator || 'Select..'} selected`)}
          />
        </div>
      </ToolTip>
      <div>
        <input
          value={filterInputValue}
          className="form-control css-zz6spl-container input-element"
          data-cy="value-input-field"
          placeholder="Enter value"
          onChange={(event) => {
            setFilterInputValue(event.target.value);
          }}
          onFocus={() => speak(filterInputValue ? `Value input field, current value: ${filterInputValue}` : 'Value input field')}
        />
      </div>
      <div
        className="delete-icon-wrapper"
        data-cy="delete-icon"
        onClick={() => {
          speak('Deleting filter');
          setTimeout(() => {
            handleDelete();
          }, 800);
        }}
        tabIndex="0"
        role="button"
        onFocus={() => speak('Delete filter button')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            speak('Deleting filter');
            setTimeout(() => {
              handleDelete();
            }, 800);
          }
        }}
      >
        <SolidIcon name="trash" fill="#E54D2E" width="14" />
      </div>
    </div>
  );
};
