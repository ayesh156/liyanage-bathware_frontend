import { useState, useEffect, useCallback, useRef } from 'react';

export type InvoiceStep = 'customer' | 'products' | 'review';
export type CheckoutMode = 'search' | 'quantity' | 'cart' | 'payment' | 'discount' | 'priceMode' | 'itemDiscount';

interface SteppedNavigationOptions {
  totalSteps: number;
  initialStep?: number;
  canProceed?: (step: number) => boolean;
  onStepChange?: (step: number, direction: 'forward' | 'backward') => void;
  enableArrowNavigation?: boolean;
}

interface SteppedNavigationReturn {
  currentStep: number;
  setStep: (step: number) => void;
  goNext: () => boolean;
  goPrevious: () => boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentMode: CheckoutMode;
  setCurrentMode: (mode: CheckoutMode) => void;
  showShortcutMap: boolean;
  setShowShortcutMap: (show: boolean) => void;
  toggleShortcutMap: () => void;
}

export const useSteppedNavigation = ({
  totalSteps,
  initialStep = 1,
  canProceed = () => true,
  onStepChange,
  enableArrowNavigation = true,
}: SteppedNavigationOptions): SteppedNavigationReturn => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [currentMode, setCurrentMode] = useState<CheckoutMode>('search');
  const [showShortcutMap, setShowShortcutMap] = useState(false);
  
  // Track if any input is focused to avoid navigation conflicts
  const isInputFocused = useRef(false);

  const canGoNext = currentStep < totalSteps && canProceed(currentStep);
  const canGoPrevious = currentStep > 1;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const setStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      const direction = step > currentStep ? 'forward' : 'backward';
      setCurrentStep(step);
      onStepChange?.(step, direction);
    }
  }, [currentStep, totalSteps, onStepChange]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setStep(currentStep + 1);
      return true;
    }
    return false;
  }, [canGoNext, currentStep, setStep]);

  const goPrevious = useCallback(() => {
    if (canGoPrevious) {
      setStep(currentStep - 1);
      return true;
    }
    return false;
  }, [canGoPrevious, currentStep, setStep]);

  const toggleShortcutMap = useCallback(() => {
    setShowShortcutMap(prev => !prev);
  }, []);

  // Keyboard navigation for steps (Left/Right arrow keys)
  useEffect(() => {
    if (!enableArrowNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT' ||
                       target.isContentEditable;
      
      // Show shortcut map with ? key
      if (e.key === '?' && !isInInput) {
        e.preventDefault();
        toggleShortcutMap();
        return;
      }

      // Step navigation with Ctrl+Arrow keys (to avoid conflicts with mode-specific navigation)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft' && !isInInput) {
          e.preventDefault();
          goPrevious();
          return;
        }
        if (e.key === 'ArrowRight' && !isInInput) {
          e.preventDefault();
          goNext();
          return;
        }
      }

      // Alternative: PageUp/PageDown for step navigation (never interferes)
      if (e.key === 'PageUp' && !isInInput) {
        e.preventDefault();
        goPrevious();
        return;
      }
      if (e.key === 'PageDown' && !isInInput) {
        e.preventDefault();
        goNext();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableArrowNavigation, goNext, goPrevious, toggleShortcutMap]);

  return {
    currentStep,
    setStep,
    goNext,
    goPrevious,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    currentMode,
    setCurrentMode,
    showShortcutMap,
    setShowShortcutMap,
    toggleShortcutMap,
  };
};

// Hook for managing focus mode (barcode vs name search)
interface FocusModeOptions {
  defaultMode?: 'barcode' | 'name';
  barcodeRef?: React.RefObject<HTMLInputElement>;
  nameRef?: React.RefObject<HTMLInputElement>;
}

interface FocusModeReturn {
  focusMode: 'barcode' | 'name';
  setFocusMode: (mode: 'barcode' | 'name') => void;
  toggleFocusMode: () => void;
  focusCurrentInput: () => void;
}

export const useFocusMode = ({
  defaultMode = 'barcode',
  barcodeRef,
  nameRef,
}: FocusModeOptions): FocusModeReturn => {
  const [focusMode, setFocusMode] = useState<'barcode' | 'name'>(defaultMode);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => prev === 'barcode' ? 'name' : 'barcode');
  }, []);

  const focusCurrentInput = useCallback(() => {
    setTimeout(() => {
      if (focusMode === 'barcode' && barcodeRef?.current) {
        barcodeRef.current.focus();
        barcodeRef.current.select();
      } else if (focusMode === 'name' && nameRef?.current) {
        nameRef.current.focus();
        nameRef.current.select();
      }
    }, 50);
  }, [focusMode, barcodeRef, nameRef]);

  // Focus when mode changes
  useEffect(() => {
    focusCurrentInput();
  }, [focusMode]);

  return {
    focusMode,
    setFocusMode,
    toggleFocusMode,
    focusCurrentInput,
  };
};

// Hook for price mode / item discount toggle with arrow keys
interface ToggleModeOptions<T> {
  options: T[];
  defaultValue?: T;
  onChange?: (value: T) => void;
  enableArrowKeys?: boolean;
  isFocused?: boolean;
}

interface ToggleModeReturn<T> {
  currentValue: T;
  setCurrentValue: (value: T) => void;
  goNext: () => void;
  goPrevious: () => void;
  currentIndex: number;
}

export const useToggleMode = <T>({
  options,
  defaultValue,
  onChange,
  enableArrowKeys = true,
  isFocused = false,
}: ToggleModeOptions<T>): ToggleModeReturn<T> => {
  const [currentValue, setCurrentValueState] = useState<T>(defaultValue ?? options[0]);
  const currentIndex = options.indexOf(currentValue);

  const setCurrentValue = useCallback((value: T) => {
    setCurrentValueState(value);
    onChange?.(value);
  }, [onChange]);

  const goNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % options.length;
    setCurrentValue(options[nextIndex]);
  }, [currentIndex, options, setCurrentValue]);

  const goPrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
    setCurrentValue(options[prevIndex]);
  }, [currentIndex, options, setCurrentValue]);

  // Arrow key navigation when focused
  useEffect(() => {
    if (!enableArrowKeys || !isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableArrowKeys, isFocused, goNext, goPrevious]);

  return {
    currentValue,
    setCurrentValue,
    goNext,
    goPrevious,
    currentIndex,
  };
};

// Step progress indicator component data generator
export interface StepInfo {
  number: number;
  key: string;
  labelKey: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}

export const generateStepInfo = (
  currentStep: number,
  canProceed: (step: number) => boolean,
  stepConfig: { key: string; labelKey: string; icon: string }[]
): StepInfo[] => {
  return stepConfig.map((config, index) => {
    const stepNumber = index + 1;
    return {
      number: stepNumber,
      key: config.key,
      labelKey: config.labelKey,
      icon: config.icon,
      isCompleted: stepNumber < currentStep,
      isCurrent: stepNumber === currentStep,
      isAccessible: stepNumber <= currentStep || (stepNumber === currentStep + 1 && canProceed(currentStep)),
    };
  });
};
