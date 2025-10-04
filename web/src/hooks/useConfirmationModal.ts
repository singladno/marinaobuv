'use client';

import * as React from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmationModalState {
  isOpen: boolean;
  options: ConfirmationOptions;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  isLoading: boolean;
}

export function useConfirmationModal() {
  const [state, setState] = React.useState<ConfirmationModalState>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
    onConfirm: null,
    onCancel: null,
    isLoading: false,
  });

  const showConfirmation = React.useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise(resolve => {
        setState({
          isOpen: true,
          options,
          onConfirm: () => {
            setState(prev => ({ ...prev, isLoading: true }));
            resolve(true);
          },
          onCancel: () => {
            setState(prev => ({ ...prev, isOpen: false }));
            resolve(false);
          },
          isLoading: false,
        });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(async () => {
    if (state.onConfirm) {
      state.onConfirm();
      // Keep modal open with loading state, let the caller close it
    }
  }, [state.onConfirm]);

  const handleCancel = React.useCallback(() => {
    if (state.onCancel) {
      state.onCancel();
    }
  }, [state.onCancel]);

  const closeModal = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
    }));
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    isOpen: state.isOpen,
    options: state.options,
    isLoading: state.isLoading,
    showConfirmation,
    handleConfirm,
    handleCancel,
    closeModal,
    setLoading,
  };
}
