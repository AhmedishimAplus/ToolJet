import React from 'react';

const AccessibleSwitch = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
    <svg
        width={width}
        height={width}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="10" y="18" width="30" height="12" rx="6" fill={fill} />
        <circle cx="34" cy="24" r="5" fill="#3E63DD" />
        <circle cx="40" cy="10" r="5" fill="#10B981" />
    </svg>
);

export default AccessibleSwitch;
