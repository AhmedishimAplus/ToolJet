# Web Speech API Screen Reader Hook

## Overview

The `useScreenReader` hook provides text-to-speech functionality for accessibility using the Web Speech API. It announces UI elements, actions, and states to users navigating with keyboard controls.

## Features

- ✨ **Text-to-Speech**: Converts text to spoken audio using browser's built-in speech synthesis
- 🎯 **Focus Announcements**: Announces when elements receive focus during keyboard navigation
- ⚠️ **Error Notifications**: Audibly notifies users of validation errors
- ✅ **Success Messages**: Announces successful operations
- 🎮 **Navigation Mode**: Announces when navigation mode is activated/deactivated
- ⚙️ **Customizable**: Configure speech rate, pitch, volume, and language

## Browser Support

The Web Speech API is supported in:
- ✅ Chrome/Edge (Chromium-based)
- ✅ Safari
- ✅ Firefox
- ⚠️ Limited support in some mobile browsers

## Usage

### Basic Import

```javascript
import useScreenReader from '@/modules/common/hooks/useScreenReader';
```

### In a Component

```javascript
const MyComponent = () => {
  // Initialize the hook
  const { speak, announceFocus, announceError, announceNavigationMode } = useScreenReader();

  // Use in your navigation logic
  const handleFocus = (elementName, elementType) => {
    announceFocus(elementName, elementType);
    // Announces: "Focused on email input"
  };

  const handleError = (errorMessage) => {
    announceError(errorMessage);
    // Announces: "Error: Invalid email address"
  };

  return (
    // Your JSX
  );
};
```

### With Custom Configuration

```javascript
const { speak } = useScreenReader({
  rate: 1.2,      // Faster speech
  pitch: 1.1,     // Slightly higher pitch
  volume: 0.9,    // Slightly quieter
  lang: 'en-US',  // English (US)
  enabled: true   // Enable/disable
});
```

## API Reference

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rate` | number | 1.0 | Speech rate (0.1 to 10) |
| `pitch` | number | 1.0 | Speech pitch (0 to 2) |
| `volume` | number | 1.0 | Speech volume (0 to 1) |
| `lang` | string | 'en-US' | Speech language |
| `enabled` | boolean | true | Enable/disable speech |

### Returned Functions

#### `speak(text, options)`
Speaks the provided text with optional configuration override.

```javascript
speak('Hello, welcome to ToolJet', { rate: 0.9 });
```

#### `announceFocus(elementName, elementType)`
Announces when an element receives focus.

```javascript
announceFocus('email', 'input');
// Speaks: "Focused on email input"
```

#### `announceActivation(elementName, action)`
Announces when an element is activated.

```javascript
announceActivation('submit button', 'activated');
// Speaks: "submit button activated"
```

#### `announceError(errorMessage)`
Announces error messages with emphasis.

```javascript
announceError('Invalid email address');
// Speaks: "Error: Invalid email address"
```

#### `announceSuccess(successMessage)`
Announces success messages.

```javascript
announceSuccess('Form submitted successfully');
// Speaks: "Success: Form submitted successfully"
```

#### `announceNavigationMode(isActive)`
Announces navigation mode state.

```javascript
announceNavigationMode(true);
// Speaks: "Navigation mode activated. Use arrow keys to move between elements, Enter to activate."
```

#### `stop()`
Stops current speech immediately.

```javascript
stop();
```

#### `pause()`
Pauses current speech.

```javascript
pause();
```

#### `resume()`
Resumes paused speech.

```javascript
resume();
```

#### `isSpeechActive()`
Returns whether speech is currently active.

```javascript
if (isSpeechActive()) {
  console.log('Speech is playing');
}
```

### Returned Properties

| Property | Type | Description |
|----------|------|-------------|
| `isSupported` | boolean | Whether Web Speech API is supported |

## Implementation Examples

### Login Form Example

```javascript
import useScreenReader from '@/modules/common/hooks/useScreenReader';

const LoginForm = () => {
  const { speak, announceFocus, announceError } = useScreenReader();

  const handleKeyboardNavigation = (elementName, elementType) => {
    announceFocus(elementName, elementType);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    speak('Signing in, please wait...');
    
    // Validation
    if (!validateEmail(email)) {
      announceError('Invalid email address');
      return;
    }
    
    // Submit logic...
  };

  return (
    // JSX with keyboard navigation
  );
};
```

### Signup Form Example

```javascript
const SignupForm = () => {
  const { speak, announceError } = useScreenReader();

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email';
    }
    
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join(', ');
      announceError(errorMessages);
    }
    
    return Object.keys(errors).length === 0;
  };

  return (
    // JSX
  );
};
```

## Integration with Keyboard Navigation

The screen reader hook works seamlessly with keyboard navigation:

```javascript
const handleArrowKeyNavigation = (e) => {
  // ... navigation logic
  
  const targetElement = getFocusableElements()[newIndex];
  if (targetElement?.ref?.current) {
    targetElement.ref.current.focus();
    announceFocus(targetElement.name, targetElement.type);
  }
};
```

## Current Implementation

The Web Speech API screen reader is currently implemented in:

1. **Login Page** (`LoginForm.jsx`)
   - Announces email and password fields
   - Announces sign in button
   - Announces forgot password link
   - Announces sign up link
   - Announces validation errors

2. **Forgot Password Page** (`ForgotPasswordForm.jsx`)
   - Announces email field
   - Announces send reset link button
   - Announces sign up link
   - Announces validation errors

3. **Signup Page** (`SignupForm.jsx`)
   - Announces name, email, and password fields
   - Announces sign up button
   - Announces sign in link
   - Announces validation errors

## Keyboard Navigation Flow

1. **Tab/Arrow Keys**: Navigate between elements → Announces focused element
2. **Enter**: Activate element → Announces activation
3. **Escape**: Exit edit mode → Announces navigation mode
4. **F1**: Activate navigation → Announces navigation instructions

## Best Practices

1. **Keep Messages Concise**: Short, clear announcements work best
2. **Avoid Repetition**: Don't over-announce the same information
3. **Cancel Previous Speech**: The hook automatically cancels ongoing speech when new speech starts
4. **Error Emphasis**: Use `announceError()` for important notifications (speaks slightly slower)
5. **Test with Real Users**: Test with actual screen reader users when possible

## Accessibility Compliance

This implementation helps meet:
- **WCAG 2.1 Level AA** - Guideline 2.4.3 (Focus Order)
- **WCAG 2.1 Level AA** - Guideline 3.3.1 (Error Identification)
- **WCAG 2.1 Level AA** - Guideline 4.1.3 (Status Messages)

## Troubleshooting

### Speech Not Working

1. Check browser support: `console.log('speechSynthesis' in window)`
2. Ensure user has interacted with page (browsers require user gesture)
3. Check browser permissions/settings
4. Try a different browser

### Speech Too Fast/Slow

Adjust the `rate` option:
```javascript
const { speak } = useScreenReader({ rate: 0.8 }); // Slower
```

### Wrong Language

Set the `lang` option:
```javascript
const { speak } = useScreenReader({ lang: 'es-ES' }); // Spanish
```

## Future Enhancements

Potential improvements:
- [ ] Queue management for multiple announcements
- [ ] Voice selection (male/female voices)
- [ ] Pronunciation dictionary for technical terms
- [ ] User preference persistence
- [ ] SSML support for advanced speech markup

## Contributing

When adding screen reader support to new components:

1. Import the hook
2. Call appropriate announce functions on user interactions
3. Test with keyboard navigation
4. Ensure messages are clear and helpful
5. Update this documentation

## License

This hook is part of the ToolJet project and follows the same license.
