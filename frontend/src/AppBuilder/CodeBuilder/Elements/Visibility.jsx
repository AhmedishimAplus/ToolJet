import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { resolveReferences } from '@/_helpers/utils';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const Visibility = ({ onVisibilityChange, styleDefinition, paramLabel }) => {
  const iconVisibility = resolveReferences(styleDefinition?.iconVisibility?.value) || false;
  const { speak } = useScreenReader();

  const handleClick = (e) => {
    e.stopPropagation();
    const newVisibility = !iconVisibility;
    onVisibilityChange(`{{${newVisibility}}}`);
    const label = paramLabel || 'Icon visibility';
    speak(`${label} ${newVisibility ? 'shown' : 'hidden'}`);
  };

  const handleFocus = () => {
    const label = paramLabel || 'Icon visibility';
    speak(`${label} toggle, currently ${iconVisibility ? 'visible' : 'hidden'}`);
  };

  return (
    <div
      data-cy={`icon-visibility-button`}
      className="cursor-pointer visibility-eye"
      style={{ top: iconVisibility && '42%' }}
      onClick={handleClick}
      onFocus={handleFocus}
      tabIndex={0}
      role="button"
      aria-label={`Toggle icon visibility, currently ${iconVisibility ? 'visible' : 'hidden'}`}
    >
      <SolidIcon name={iconVisibility ? 'eye1' : 'eyedisable'} width="20" fill={'var(--slate8)'} />
    </div>
  );
};
