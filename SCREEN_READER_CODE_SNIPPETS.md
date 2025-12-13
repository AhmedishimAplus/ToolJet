# Screen Reader Implementation - Code Examples

> **Purpose**: This document provides simplified code examples demonstrating how screen reader accessibility was implemented in the ToolJet application. These examples are designed for academic and non-technical audiences to understand the practical implementation of web accessibility features.

---

## 1. Button Components

**What it does**: Buttons are interactive elements that users click to perform actions. For screen reader users, buttons need descriptive labels that announce their purpose when focused.

**Implementation Location**: `frontend/src/HomePage/HomePage.jsx`

**Implementation Example**:
```jsx
<button
  onClick={handleCreateApp}
  onFocus={() => speak('Create new app button')}
  aria-label="Create new application"
>
  Create App
</button>
```

**Explanation**: The `aria-label` provides a text description that screen readers announce. The `onFocus` function speaks the button's purpose when a user navigates to it using keyboard controls.

---

## 2. Navigation Links

**What it does**: Links navigate users to different pages. Screen readers announce link destinations and purposes to help users understand where they will go.

**Implementation Location**: `frontend/src/modules/auth/pages/LoginPage/components/LoginForm/LoginForm.jsx`

**Implementation Example**:
```jsx
<Link
  to="/signup"
  onFocus={() => speak('Sign up link')}
  aria-label="Create a new account"
>
  Sign up
</Link>
```

**Explanation**: When a screen reader user focuses on this link, they hear "Sign up link" announced, informing them of the link's destination and purpose.

---

## 3. Toggle Switches

**What it does**: Toggle switches let users turn features on or off. Screen readers need to announce both the toggle's label and its current state (enabled/disabled).

**Implementation Location**: `frontend/src/_ui/Toggle/index.js`

**Implementation Example**:
```jsx
function Toggle({ checked, label, onChange }) {
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const state = checked ? 'enabled' : 'disabled';
    speak(`${label}, ${state}`);
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onFocus={handleFocus}
      aria-label={label}
    />
  );
}
```

**Explanation**: When focused, the toggle announces its label and current state (e.g., "Dark mode, enabled"), helping users understand the current setting before changing it.

---

## 4. Text Input Forms

**What it does**: Input fields collect information from users. Screen readers announce the field's purpose and any existing values to help users understand what information to enter.

**Implementation Location**: `frontend/src/_ui/Input/index.js`

**Implementation Example**:
```jsx
function TextInput({ label, value, onChange }) {
  const { speak } = useScreenReader();

  const handleFocus = () => {
    const announcement = value 
      ? `${label}, current value: ${value}` 
      : label;
    speak(announcement);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onFocus={handleFocus}
      aria-label={label}
    />
  );
}
```

**Explanation**: When a user focuses on an input field, the screen reader announces the field name and any existing value (e.g., "Email address, current value: user@example.com"), providing context before editing.

---

## 5. Radio Button Groups

**What it does**: Radio buttons let users select one option from multiple choices. Screen readers need to announce the group purpose and each option's label.

**Implementation Location**: `frontend/src/AppBuilder/Widgets/NewTable/_components/DataTypes/Radio.jsx`

**Implementation Example**:
```jsx
<div role="radiogroup" aria-label="Select account type">
  {options.map(option => (
    <label key={option.value}>
      <input
        type="radio"
        value={option.value}
        checked={selected === option.value}
        aria-label={option.name}
      />
      {option.name}
    </label>
  ))}
</div>
```

**Explanation**: The `role="radiogroup"` tells screen readers this is a group of related options. Each radio button's `aria-label` provides its individual label, allowing users to understand and select options.

---

## 6. Keyboard Navigation Shortcuts

**What it does**: Keyboard shortcuts allow users to navigate and interact with the application without a mouse. Screen readers announce available shortcuts and navigation instructions.

**Implementation Locations**: 
- Workspace Constants: `frontend/src/modules/common/components/BaseManageOrgConstants/BaseManageOrgConstants.jsx`
- Global Navigation: `frontend/src/_components/KeyboardNavigation/KeyboardNavigation.jsx`

**Implementation Example**:
```jsx
// Announce shortcuts on page load
useEffect(() => {
  speak('Use Ctrl + arrow keys to switch between pages');
}, []);

// Page switching with Ctrl + arrows
const handlePageSwitch = (event) => {
  if (event.ctrlKey && event.key === 'ArrowRight') {
    switchToNextPage();
    speak('Switched to next page');
  }
  // ... general logic for other directions
};

// Element navigation with arrow keys
const handleNavigation = (event) => {
  if (event.key === 'ArrowDown') {
    moveToNextElement();
    speak('Next element');
  }
  // ... general logic for other keys
};
```

**Explanation**: When the page loads, users hear available keyboard shortcuts. As they navigate using arrow keys, the screen reader announces each newly focused element, providing continuous feedback about their location in the interface.

---

## 7. Form Validation and Error Messages

**What it does**: When users make mistakes in forms, screen readers need to announce errors clearly so users can correct them.

**Implementation Locations**:
- Login Form: `frontend/src/modules/auth/pages/LoginPage/components/LoginForm/LoginForm.jsx`
- Signup Form: `frontend/src/modules/onboarding/pages/SignupPage/components/SignupForm/SignupForm.jsx`

**Implementation Example**:
```jsx
const handleSubmit = (formData) => {
  if (!validateEmail(formData.email)) {
    announceError('Invalid email address. Please enter a valid email.');
    return;
  }
  
  speak('Submitting form, please wait...');
  // Submit form
};
```

**Explanation**: Validation errors are announced using `announceError()`, which uses high-priority speech to immediately inform users of problems. Success messages use `speak()` to provide feedback during form submission.

---

## Core Accessibility Hook

**What it does**: The `useScreenReader` hook is a reusable function that provides text-to-speech capabilities throughout the application. It ensures consistent screen reader announcements across all components.

**Implementation Location**: `frontend/src/modules/common/hooks/useScreenReader.js`

**Implementation**:
```jsx
const useScreenReader = () => {
  const speak = (text, priority = 'polite') => {
    // Use browser's speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    
    // Create hidden element for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.textContent = text;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  };

  return { speak };
};
```

**Explanation**: This hook combines two accessibility approaches:
1. **Browser Speech Synthesis**: Converts text to audible speech
2. **ARIA Live Regions**: Creates hidden elements that screen readers detect and announce automatically

The `priority` parameter controls urgency: `'polite'` waits for current announcements to finish, while `'assertive'` interrupts immediately (used for errors).

---

## Key Accessibility Principles Applied

1. **Semantic Labels**: Every interactive element has a descriptive label (`aria-label`)
2. **Focus Management**: Visual focus indicators and audio announcements when elements receive focus
3. **State Communication**: Current states (enabled/disabled, checked/unchecked) are announced
4. **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, and Escape
5. **Error Handling**: Clear, immediate error announcements with actionable guidance
6. **Context Provision**: Users receive information about current values and options before making changes

---

## Implementation Impact

These accessibility features enable blind and visually impaired users to:
- Navigate the entire application using only a keyboard
- Understand the purpose and state of all interactive elements
- Receive immediate feedback on their actions
- Complete all tasks independently without visual cues

**Pages Implementing These Features**:
- Login page (authentication)
- Sign-up page (account creation)
- Homepage (application dashboard)
- Datasource management (database connections)
- Workspace settings (configuration)

---

*For complete technical documentation, see [SCREEN_READER_IMPLEMENTATION.md](SCREEN_READER_IMPLEMENTATION.md)*
