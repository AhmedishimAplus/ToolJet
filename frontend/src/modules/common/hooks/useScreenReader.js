import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for Web Speech API screen reader functionality
 * Provides text-to-speech announcements for accessibility
 */
const useScreenReader = (options = {}) => {
  const {
    rate = 1.0,        // Speech rate (0.1 to 10)
    pitch = 1.0,       // Speech pitch (0 to 2)
    volume = 1.0,      // Speech volume (0 to 1)
    lang = 'en-US',    // Speech language
    enabled = true,    // Enable/disable speech
  } = options;

  const synth = useRef(null);
  const currentUtterance = useRef(null);
  const queue = useRef([]);
  const isSpeaking = useRef(false);

  useEffect(() => {
    // Check if Web Speech API is available
    if ('speechSynthesis' in window) {
      synth.current = window.speechSynthesis;
    } else {
      console.warn('Web Speech API is not supported in this browser');
    }

    return () => {
      // Cleanup: cancel any ongoing speech
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  /**
   * Speak text using Web Speech API
   */
  const speak = useCallback((text, options = {}) => {
    if (!enabled || !synth.current || !text) {
      return;
    }

    // Cancel current speech if any
    if (synth.current.speaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply configuration
    utterance.rate = options.rate || rate;
    utterance.pitch = options.pitch || pitch;
    utterance.volume = options.volume || volume;
    utterance.lang = options.lang || lang;

    // Optional callbacks
    if (options.onStart) {
      utterance.onstart = options.onStart;
    }
    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }
    if (options.onError) {
      utterance.onerror = options.onError;
    }

    currentUtterance.current = utterance;
    synth.current.speak(utterance);
  }, [enabled, rate, pitch, volume, lang]);

  /**
   * Stop current speech
   */
  const stop = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
    }
  }, []);

  /**
   * Pause current speech
   */
  const pause = useCallback(() => {
    if (synth.current && synth.current.speaking) {
      synth.current.pause();
    }
  }, []);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (synth.current && synth.current.paused) {
      synth.current.resume();
    }
  }, []);

  /**
   * Check if speech is currently active
   */
  const isSpeechActive = useCallback(() => {
    return synth.current ? synth.current.speaking : false;
  }, []);

  /**
   * Announce focus change on an element
   */
  const announceFocus = useCallback((elementName, elementType) => {
    const message = `Focused on ${elementName} ${elementType}`;
    speak(message);
  }, [speak]);

  /**
   * Announce activation of an element
   */
  const announceActivation = useCallback((elementName, action = 'activated') => {
    const message = `${elementName} ${action}`;
    speak(message);
  }, [speak]);

  /**
   * Announce error message
   */
  const announceError = useCallback((errorMessage) => {
    const message = `Error: ${errorMessage}`;
    speak(message, { rate: 0.9 }); // Slightly slower for errors
  }, [speak]);

  /**
   * Announce success message
   */
  const announceSuccess = useCallback((successMessage) => {
    const message = `Success: ${successMessage}`;
    speak(message);
  }, [speak]);

  /**
   * Announce navigation mode
   */
  const announceNavigationMode = useCallback((isActive) => {
    const message = isActive
      ? 'Navigation mode activated. Use arrow keys to move between elements, Enter to activate.'
      : 'Navigation mode deactivated.';
    speak(message);
  }, [speak]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeechActive,
    announceFocus,
    announceActivation,
    announceError,
    announceSuccess,
    announceNavigationMode,
    isSupported: !!synth.current,
  };
};

export default useScreenReader;
