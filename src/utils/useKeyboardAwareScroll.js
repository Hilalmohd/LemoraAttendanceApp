import { useCallback, useEffect, useRef } from 'react';
import { findNodeHandle, Keyboard } from 'react-native';

export default function useKeyboardAwareScroll(extraOffset = 24) {
  const scrollRef = useRef(null);
  const focusedInput = useRef(null);
  const keyboardVisible = useRef(false);
  const scrollTimer = useRef(null);

  const scrollToFocusedInput = useCallback(() => {
    const responder = scrollRef.current?.getScrollResponder?.() || scrollRef.current;
    if (focusedInput.current) {
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(
        focusedInput.current,
        extraOffset,
        true,
      );
    }
  }, [extraOffset]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.current = true;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(scrollToFocusedInput, 60);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.current = false;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearTimeout(scrollTimer.current);
    };
  }, [scrollToFocusedInput]);

  const onInputFocus = useCallback((event) => {
    focusedInput.current = findNodeHandle(event.target);
    if (keyboardVisible.current) {
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(scrollToFocusedInput, 30);
    }
  }, [scrollToFocusedInput]);

  return { scrollRef, onInputFocus };
}