# Testing Guide for Web Speech API Screen Reader

## Quick Test Guide

### Prerequisites
- Modern browser (Chrome, Firefox, Safari, or Edge)
- Speakers or headphones connected
- Volume turned up

### Testing Steps

#### 1. Sign In Page Test

1. **Navigate to Sign In page**
   ```
   http://localhost:8082/login
   ```

2. **Test Auto-Activation**
   - Page loads → Listen for: "Arrow key navigation active. Use arrow keys to navigate, Enter to activate."
   - Email field should be auto-focused

3. **Test Arrow Key Navigation**
   - Press `↓` (Down Arrow) → Listen for: "Focused on forgot password link"
   - Press `↓` again → Listen for: "Focused on password input"
   - Press `↓` again → Listen for: "Focused on toggle password visibility button"
   - Press `↓` again → Listen for: "Focused on sign in button"
   - Press `↓` again → Listen for: "Focused on sign up link" (if enabled)
   - Press `↓` again → Cycles back to first element

4. **Test Reverse Navigation**
   - Press `↑` (Up Arrow) → Navigates backward through elements
   - Press `←` (Left Arrow) → Same as Up Arrow
   - Press `→` (Right Arrow) → Same as Down Arrow

5. **Test Edit Mode**
   - Navigate to email field
   - Press `Enter` → Listen for: "Editing email field. Press Escape to return to navigation mode."
   - Type some text
   - Press `Escape` → Listen for: "Navigation mode activated. Use arrow keys to move between elements, Enter to activate."

6. **Test Button Activation**
   - Navigate to "Sign in" button
   - Press `Enter` → Listen for: "sign in button activated" followed by "Signing in, please wait..."

7. **Test Validation Errors**
   - Leave email empty or enter invalid email
   - Try to sign in → Listen for: "Error: Invalid email address"
   - Leave password empty → Listen for: "Error: Password is required"

8. **Test Link Navigation**
   - Navigate to "Sign up" link
   - Press `Enter` → Listen for: "Navigating to sign up"

9. **Test F1 Shortcut**
   - Press `F1` from anywhere → Listen for: "Arrow key navigation activated. Use arrow keys to navigate, Enter to activate."

#### 2. Forgot Password Page Test

1. **Navigate to Forgot Password page**
   ```
   http://localhost:8082/forgot-password
   ```

2. **Test Navigation**
   - Page loads → Listen for: "Arrow key navigation active..."
   - Press `↓` → Navigate through: sign up link → email field → send reset link button

3. **Test Disabled Button**
   - Navigate to "Send reset link" button while email is empty
   - Press `Enter` → Listen for: "Button is disabled and cannot be activated"

4. **Test Form Submission**
   - Enter valid email
   - Navigate to button
   - Press `Enter` → Listen for: "send reset link button activated" followed by "Sending reset link, please wait..."

5. **Test Error**
   - Enter invalid email
   - Try to submit → Listen for: "Error: Invalid Email"

#### 3. Signup Page Test

1. **Navigate to Signup page**
   ```
   http://localhost:8082/signup
   ```

2. **Test F1 Activation**
   - Press `F1` → Listen for: "Arrow key navigation activated..."

3. **Test Multi-Field Navigation**
   - Press `↓` to navigate through:
     - Name field → "Focused on name input"
     - Email field → "Focused on email input"
     - Password field → "Focused on password input"
     - Toggle password → "Focused on toggle password visibility button"
     - Sign up button → "Focused on sign up button"
     - Sign in link → "Focused on sign in link"

4. **Test Edit Mode on Each Field**
   - Navigate to name field
   - Press `Enter` → Listen for: "Editing name field. Press Escape to return to navigation mode."
   - Type text
   - Press `Escape` → Returns to navigation mode

5. **Test Form Submission**
   - Fill all fields
   - Navigate to Sign up button
   - Press `Enter` → Listen for: "sign up button activated" followed by "Signing up, please wait..."

6. **Test Multiple Validation Errors**
   - Leave multiple fields empty or invalid
   - Try to submit → Listen for: "Error: Name is required, Invalid email" (all errors announced together)

## Browser-Specific Testing

### Chrome/Edge
- ✅ Should work perfectly
- Default voice: Usually Google US English

### Firefox
- ✅ Should work well
- May have different voice
- Check `about:config` → `media.webspeech.synth.enabled` is true

### Safari
- ✅ Should work excellently
- Uses Apple's high-quality voices
- Best quality on macOS

### Mobile Testing

#### iOS Safari
1. Open in Safari (not Chrome)
2. Ensure "Speak Screen" is enabled in Settings → Accessibility
3. Test keyboard navigation with external keyboard or on-screen keyboard

#### Android Chrome
1. Ensure TalkBack is not interfering
2. Test with external keyboard if available

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `↑` or `←` | Navigate to previous element |
| `↓` or `→` | Navigate to next element |
| `Enter` | Activate current element or enter edit mode |
| `Escape` | Exit edit mode, return to navigation |
| `F1` | Activate navigation mode from anywhere |
| `Tab` | Standard tab navigation (also triggers announcements) |

## Expected Announcements Checklist

### Sign In Page
- ✅ "Arrow key navigation active"
- ✅ "Focused on email input"
- ✅ "Focused on password input"
- ✅ "Focused on sign in button"
- ✅ "Focused on forgot password link"
- ✅ "Focused on sign up link"
- ✅ "Editing {field} field"
- ✅ "Navigation mode activated"
- ✅ "Signing in, please wait"
- ✅ "Error: Invalid email address"
- ✅ "Error: Password is required"
- ✅ "sign in button activated"
- ✅ "Navigating to sign up"

### Forgot Password Page
- ✅ "Arrow key navigation active"
- ✅ "Focused on sign up link"
- ✅ "Focused on email input"
- ✅ "Focused on send reset link button"
- ✅ "Editing email field"
- ✅ "Button is disabled and cannot be activated"
- ✅ "send reset link button activated"
- ✅ "Sending reset link, please wait"
- ✅ "Error: Invalid Email"

### Signup Page
- ✅ "Arrow key navigation activated"
- ✅ "Focused on name input"
- ✅ "Focused on email input"
- ✅ "Focused on password input"
- ✅ "Focused on toggle password visibility button"
- ✅ "Focused on sign up button"
- ✅ "Focused on sign in link"
- ✅ "Editing {field} field"
- ✅ "sign up button activated"
- ✅ "Signing up, please wait"
- ✅ "Error: {validation errors}"

## Troubleshooting

### No Sound
1. Check browser console for errors
2. Verify volume is up
3. Check browser supports Web Speech API:
   ```javascript
   console.log('speechSynthesis' in window); // Should be true
   ```
4. Try different browser
5. Check system audio output settings

### Speech Too Fast/Slow
- This is controlled in the code via the `rate` parameter
- Default is 1.0 (normal speed)
- Can be adjusted in `useScreenReader.js`

### Wrong Voice/Language
- Browser automatically selects voice based on system settings
- Can be customized via `lang` parameter in hook
- Check available voices:
  ```javascript
  speechSynthesis.getVoices().forEach(voice => console.log(voice.name));
  ```

### Speech Cuts Off
- This is normal behavior - new announcements cancel previous ones
- Prevents announcement spam
- By design for better UX

### Not Working in Firefox
1. Open `about:config`
2. Search for `media.webspeech.synth.enabled`
3. Ensure it's set to `true`
4. Restart browser

### Not Working on Mobile
- Requires user interaction first
- Try tapping screen before using keyboard
- External keyboard recommended for testing
- Some mobile browsers have limited support

## Manual Testing Checklist

- [ ] Sign In page loads with announcement
- [ ] Arrow keys navigate between all elements
- [ ] Each element announces correctly
- [ ] Enter key activates elements with announcement
- [ ] Edit mode announces when entering/exiting
- [ ] Validation errors are announced
- [ ] Form submission is announced
- [ ] F1 key reactivates navigation
- [ ] Escape key exits edit mode with announcement
- [ ] All three pages work consistently
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] No console errors
- [ ] Speech quality is acceptable
- [ ] Speech speed is appropriate
- [ ] Announcements are clear and helpful

## Advanced Testing

### Test with Screen Reader Software
1. **NVDA (Windows - Free)**
   - Download from https://www.nvaccess.org/
   - Turn on NVDA
   - Navigate pages
   - Should hear both NVDA and Web Speech API

2. **JAWS (Windows - Commercial)**
   - Similar to NVDA
   - Professional-grade testing

3. **VoiceOver (macOS - Built-in)**
   - Press `Cmd + F5` to activate
   - Test alongside Web Speech API

### Performance Testing
1. Navigate rapidly between elements
2. Verify announcements don't queue up excessively
3. Check CPU usage stays reasonable
4. Ensure no memory leaks on long sessions

### Stress Testing
1. Rapidly press arrow keys
2. Quickly switch between pages
3. Submit forms multiple times
4. Trigger multiple errors simultaneously

## Success Criteria

✅ All announcements are clear and understandable  
✅ Speech timing is appropriate (not too fast/slow)  
✅ Navigation works smoothly with audio feedback  
✅ Errors are announced immediately  
✅ No conflicts with native screen readers  
✅ Works across all major browsers  
✅ No performance issues  
✅ Graceful degradation if API unavailable  

## Reporting Issues

If you find issues:
1. Note the browser and version
2. Note the specific page and element
3. Describe the expected vs actual announcement
4. Check browser console for errors
5. Test in different browser to isolate issue

---

**Happy Testing!** 🎉

For questions or issues, refer to:
- `README_SCREEN_READER.md` - Full documentation
- `SCREEN_READER_IMPLEMENTATION.md` - Implementation details
