import React from 'react';
import ReactDatePicker from 'react-datepicker';
import CustomDatePickerHeader from './CustomDatePickerHeader';
import cx from 'classnames';
import moment from 'moment';
import { getDate } from './utils';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const Datepicker = ({ value, onChange, meta, paramLabel }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const label = paramLabel || meta?.label || 'Date';
    speak(`${label} date picker, current value: ${value || 'not set'}`);
  };

  return (
    <div
      data-cy={meta.dataCy}
      className={cx('field flex-fill custom-inspector-validation-date-picker')}
      key={meta.property}
    >
      <label className="form-label">{meta.label}</label>
      <ReactDatePicker
        selected={getDate(value, 'DD/MM/YYYY')}
        onChange={(date) => {
          const val = moment(date).format('DD/MM/YYYY');
          onChange(val === 'Invalid date' ? '' : val);
          speak(`Date set to ${val === 'Invalid date' ? 'empty' : val}`);
        }}
        dateFormat="dd/MM/yyyy"
        showTimeSelectOnly={meta.showOnlyTime}
        className={cx({ 'theme-dark dark-theme': darkMode })}
        placeholderText={meta?.placeholder ?? ''}
        renderCustomHeader={(headerProps) => <CustomDatePickerHeader {...headerProps} />}
        popperClassName={cx('tj-table-datepicker', {
          'theme-dark dark-theme': darkMode,
        })}
        popperModifiers={[
          {
            name: 'flip',
            enabled: false,
          },
        ]}
        popperPlacement="bottom-start"
        onFocus={handleFocus}
      />
    </div>
  );
};
