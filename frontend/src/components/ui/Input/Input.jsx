import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputVariants } from './InputUtils/Variants';
import SolidIcon from '../../../_ui/Icon/SolidIcons';
import { useEffect } from 'react';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const Input = React.forwardRef(
  ({ className, size, type, multiline, response, isWorkspaceConstant, rows = 3, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const { speak } = useScreenReader();
    const isPasswordField = type === 'password';

    const handleInputFocus = (e) => {
      const label = props['aria-label'] || props.label || props.placeholder || 'input field';
      const value = props.value || '';
      const announcement = value ? `${label}, current value: ${value}` : label;
      speak(announcement);
      if (props.onFocus) props.onFocus(e);
    };

    const togglePasswordVisibility = () => {
      if (!props.disabled) {
        setIsPasswordVisible((prev) => !prev);
      }
    };

    useEffect(() => {
      if (isWorkspaceConstant) {
        setIsPasswordVisible(true);
      }
    }, [isWorkspaceConstant]);

    const validationClass = response === true ? 'valid-textarea' : response === false ? 'invalid-textarea' : '';

    return (
      <div className="design-component-inputs">
        {multiline ? (
          <textarea
            className={cn(
              `tw-relative tw-peer tw-flex tw-text-[12px]/[18px] tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${props.styles}`,
              className,
              validationClass
            )}
            rows={rows}
            ref={ref}
            {...props}
            onFocus={handleInputFocus}
          />
        ) : (
          <input
            type={isPasswordField && isPasswordVisible ? 'text' : type}
            className={cn(
              inputVariants({ size }),
              `tw-peer tw-flex tw-text-[12px]/[18px] tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed ${props.styles}`,
              className
            )}
            ref={ref}
            {...props}
            onFocus={handleInputFocus}
          />
        )}
        {isPasswordField && !multiline && (
          <div onClick={togglePasswordVisibility}>
            {isPasswordVisible ? (
              <SolidIcon className="eye-icon" name="eye" />
            ) : (
              <SolidIcon className="eye-icon" name="eyedisable" />
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
