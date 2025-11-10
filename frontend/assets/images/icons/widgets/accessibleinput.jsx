import React from 'react';

const AccessibleInput = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
    <svg
        width={width}
        height={width}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="4" y="14" width="42" height="20" rx="4" fill={fill} />
        <line x1="9" y1="24" x2="25" y2="24" stroke="#3E63DD" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="10" r="5" fill="#10B981" />
    </svg>
);

export default AccessibleInput;
