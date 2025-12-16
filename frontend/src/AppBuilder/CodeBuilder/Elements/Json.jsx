import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import useScreenReader from '@/modules/common/hooks/useScreenReader';
// import 'codemirror/theme/duotone-light.css';

export const Json = ({ value, onChange, paramLabel }) => {
  const { speak } = useScreenReader();
  const jsonValue = value
    ? value
    : `[{
        "id": 1,
        "name": "Sam",
        "email": "hanson@example.com"
      }]`;

  const handleFocus = () => {
    const label = paramLabel || 'JSON';
    speak(`${label} editor`);
  };

  return (
    <div className="field mb-2" onFocus={handleFocus}>
      <CodeMirror
        height="300px"
        fontSize="2"
        onChange={(instance) => onChange(instance.getValue())}
        value={jsonValue}
        options={{
          theme: 'duotone-light',
          mode: 'json',
          lineWrapping: true,
          scrollbarStyle: null,
        }}
      />
    </div>
  );
};
