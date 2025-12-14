import React, { useState } from 'react';
import StringNode from './StringNode';
import FunctionNode from './FunctionNode';
import NumberNode from './NumberNode';
import BooleanNode from './BooleanNode';
import NullNode from './NullNode';
import ArrayNode from './ArrayNode';
import ObjectNode from './ObjectNode';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { ToolTip } from '@/_components/ToolTip';
import { DefaultCopyIcon } from '../../DefaultCopyIcon';
import { copyToClipboard, extractComponentName, formatPathForCopy } from '../../utils';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { useScreenReader } from '@/modules/common/hooks';

const renderNodeIcons = (node, iconsList, darkMode) => {
  const icon = iconsList.filter((icon) => icon?.iconName === node)[0];

  if (icon && icon.jsx) {
    if (icon?.tooltipMessage) {
      return (
        <ToolTip message={icon?.tooltipMessage}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{icon.jsx({ height: 14, width: 14 })}</div>
        </ToolTip>
      );
    }
    return icon.jsx({ height: 14, width: 14 });
  }
  return null;
};

const Row = ({ label, value, level = 1, absolutePath, iconsList, darkMode }) => {
  const { speak } = useScreenReader();
  const [isExpanded, setIsExpanded] = useState(false);

  const getValueAsText = () => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (value === null) return 'null';
    if (typeof value === 'undefined') return 'undefined';
    if (Array.isArray(value)) return `Array with ${value.length} items`;
    if (typeof value === 'object') return `Object with ${Object.keys(value).length} properties`;
    if (typeof value === 'function') return 'function';
    return '';
  };

  const Node = () => {
    if (typeof value === 'string') {
      return <StringNode value={value} />;
    } else if (typeof value === 'undefined' || value === null) {
      return <NullNode value={value} />;
    } else if (typeof value === 'number') {
      return <NumberNode value={value} />;
    } else if (typeof value === 'boolean') {
      return <BooleanNode value={value} />;
    } else if (Array.isArray(value)) {
      return <ArrayNode value={value} />;
    } else if (typeof value === 'object') {
      return <ObjectNode value={value} />;
    } else if (typeof value === 'function') {
      return <FunctionNode />;
    }
  };

  const isObject = typeof value === 'object' && !Array.isArray(value) && value !== null;
  const isArray = Array.isArray(value);

  return (
    <div style={{ marginLeft: `${level === 1 ? '0px' : '22px'}` }}>
      <div className="json-viewer-row-container">
        <div
          className="json-viewer-row"
          onClick={() => setIsExpanded((prev) => !prev)}
          tabIndex={0}
          role="button"
          aria-expanded={isArray || isObject ? isExpanded : undefined}
          aria-label={`${label}: ${getValueAsText()}`}
          onFocus={() => speak(`${label}: ${getValueAsText()}`)}
          onMouseEnter={() => speak(`${label}: ${getValueAsText()}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
        >
          <div className="json-viewer-expand-icon">
            {(isArray || isObject) &&
              (isExpanded ? (
                <SolidIcon
                  name="TriangleUpCenter"
                  size={14}
                  color="#1F99ED"
                  style={{ marginRight: '4px' }}
                  className="json-viewer-expand-icon"
                />
              ) : (
                <SolidIcon
                  name="rightarrrow"
                  size={12}
                  color="#1F99ED"
                  style={{ marginRight: '4px' }}
                  className="json-viewer-expand-icon"
                />
              ))}
          </div>
          <div
            className="json-viewer-label-container"
            data-cy={`inspector-${generateCypressDataCy(label || '')}-label`}
          >
            <OverflowTooltip style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              {renderNodeIcons(label, iconsList, darkMode)}
              {label}
            </OverflowTooltip>
          </div>
          <div
            className="json-viewer-value-container"
            data-cy={`inspector-${generateCypressDataCy(label || '')}-value`}
          >
            <Node />
          </div>
          <div className="json-viewer-actions-container">
            <ToolTip message={'Copy path'}>
              <span
                onClick={() => {
                  const formattedPath = formatPathForCopy(absolutePath);
                  copyToClipboard(formattedPath, false);
                  speak('Path copied');
                }}
                onFocus={() => speak('Copy path')}
                onMouseEnter={() => speak('Copy path')}
                tabIndex={0}
                role="button"
                aria-label="Copy path"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const formattedPath = formatPathForCopy(absolutePath);
                    copyToClipboard(formattedPath, false);
                    speak('Path copied');
                  }
                }}
                className="copy-to-clipboard json-viewer-action-icon"
              >
                <DefaultCopyIcon height={12} width={12} />
              </span>
            </ToolTip>
            <ToolTip message={'Copy value'}>
              <span
                onClick={() => {
                  copyToClipboard(value);
                  speak('Value copied');
                }}
                onFocus={() => speak('Copy value')}
                onMouseEnter={() => speak('Copy value')}
                tabIndex={0}
                role="button"
                aria-label="Copy value"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copyToClipboard(value);
                    speak('Value copied');
                  }
                }}
                className="json-viewer-action-icon"
              >
                <SolidIcon width="12" height="12" name="copy" fill="#6A727C" />
              </span>
            </ToolTip>
          </div>
        </div>
      </div>
      {isExpanded && isObject && (
        <div className="json-viewer-children" style={{ marginLeft: '5px', borderLeft: '1px solid var(--border-weak)' }}>
          {Object.entries(value).map(([key, val]) => (
            <Row
              key={key}
              label={key}
              value={val}
              level={level + 1}
              absolutePath={`${absolutePath}.${key}`}
              iconsList={iconsList}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
      {isExpanded && isArray && (
        <div className="json-viewer-children" style={{ marginLeft: '5px', borderLeft: '1px solid var(--border-weak)' }}>
          {value.map((item, index) => {
            return (
              <Row
                key={index}
                label={`${index}`}
                value={item}
                level={level + 1}
                absolutePath={`${absolutePath}.${index}`}
                iconsList={iconsList}
                darkMode={darkMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Row;
