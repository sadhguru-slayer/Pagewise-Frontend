'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { BRAND_CONFIG } from './brand';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  // Modal state
  const [modalState, setModalState] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ref to hold promise resolver
  const resolverRef = useRef(null);

  const cleanup = useCallback(() => {
    setModalState(null);
    setPromptValue('');
    setPromptError('');
    setIsLoading(false);
    resolverRef.current = null;
  }, []);

  /**
   * Confirmation Dialog
   * Replaces browser `confirm()` with a beautiful, fully customizable modal
   * @param {Object} options
   * @param {string} options.title - Header title
   * @param {string|React.ReactNode} options.message - Body explanation
   * @param {string} [options.confirmText='Confirm'] - Confirmation button label
   * @param {string} [options.cancelText='Cancel'] - Cancel button label
   * @param {'danger'|'warning'|'info'|'success'|'default'} [options.variant='danger']
   * @param {React.Component} [options.icon] - Optional custom icon
   * @param {Function} [options.onConfirm] - Optional async callback to run
   * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
   */
  const confirm = useCallback(
    ({
      title = 'Are you sure?',
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'danger',
      icon,
      onConfirm,
    } = {}) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          type: 'confirm',
          title,
          message,
          confirmText,
          cancelText,
          variant,
          icon,
          onConfirm,
        });
      });
    },
    []
  );

  /**
   * Alert Dialog
   * Replaces browser `alert()`
   * @param {Object} options
   * @param {string} options.title
   * @param {string|React.ReactNode} options.message
   * @param {string} [options.buttonText='OK']
   * @param {'danger'|'warning'|'info'|'success'|'default'} [options.variant='info']
   * @returns {Promise<boolean>}
   */
  const alert = useCallback(
    ({
      title = 'Notice',
      message,
      buttonText = 'OK',
      variant = 'info',
      icon,
    } = {}) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          type: 'alert',
          title,
          message,
          buttonText,
          variant,
          icon,
        });
      });
    },
    []
  );

  /**
   * Prompt Dialog
   * Replaces browser `prompt()`
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.defaultValue='']
   * @param {string} [options.placeholder='']
   * @param {string} [options.suffix]
   * @param {Function} [options.validate]
   * @param {string} [options.confirmText='Submit']
   * @param {string} [options.cancelText='Cancel']
   * @returns {Promise<string|null>}
   */
  const prompt = useCallback(
    ({
      title = 'Input Required',
      message,
      defaultValue = '',
      placeholder = '',
      suffix = '',
      validate,
      confirmText = 'Submit',
      cancelText = 'Cancel',
      variant = 'default',
    } = {}) => {
      setPromptValue(defaultValue);
      setPromptError('');
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setModalState({
          type: 'prompt',
          title,
          message,
          placeholder,
          suffix,
          validate,
          confirmText,
          cancelText,
          variant,
        });
      });
    },
    []
  );

  /**
   * Custom Modal
   * Opens custom content inside the centralized modal container
   */
  const openModal = useCallback((config) => {
    setModalState({
      type: 'custom',
      ...config,
    });
  }, []);

  const closeModal = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(false);
    }
    cleanup();
  }, [cleanup]);

  const handleConfirmAction = async () => {
    if (modalState?.onConfirm) {
      try {
        setIsLoading(true);
        await modalState.onConfirm();
        if (resolverRef.current) resolverRef.current(true);
        cleanup();
      } catch (err) {
        console.error('Modal onConfirm error:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (resolverRef.current) resolverRef.current(true);
      cleanup();
    }
  };

  const handlePromptSubmit = (e) => {
    e?.preventDefault();
    if (modalState?.validate) {
      const errorMsg = modalState.validate(promptValue);
      if (errorMsg) {
        setPromptError(errorMsg);
        return;
      }
    }
    if (resolverRef.current) resolverRef.current(promptValue);
    cleanup();
  };

  const handleCancelAction = () => {
    if (resolverRef.current) {
      if (modalState?.type === 'prompt') {
        resolverRef.current(null);
      } else {
        resolverRef.current(false);
      }
    }
    cleanup();
  };

  // Button styles based on variant
  const getConfirmButtonClass = (variant) => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-500 text-white';
      default:
        return 'bg-amber-600 hover:bg-amber-500 text-white';
    }
  };

  return (
    <ModalContext.Provider
      value={{
        confirm,
        alert,
        prompt,
        openModal,
        closeModal,
        isOpen: Boolean(modalState),
      }}
    >
      {children}

      {/* Centralized Modal Renderer */}
      {modalState && (
        <Modal
          isOpen={true}
          onClose={isLoading ? undefined : handleCancelAction}
          title={modalState.title}
          description={modalState.description}
          icon={modalState.icon}
          variant={modalState.variant || 'default'}
          size={modalState.size || 'sm'}
          hideCloseButton={isLoading || modalState.hideCloseButton}
          closeOnBackdrop={!isLoading && modalState.closeOnBackdrop !== false}
          closeOnEscape={!isLoading && modalState.closeOnEscape !== false}
          footer={
            modalState.type === 'confirm' ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelAction}
                  disabled={isLoading}
                  className="px-3.5 py-2 text-xs text-[#7E869B] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {modalState.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${getConfirmButtonClass(
                    modalState.variant
                  )}`}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalState.confirmText || 'Confirm'}</span>
                </button>
              </>
            ) : modalState.type === 'alert' ? (
              <button
                type="button"
                onClick={() => {
                  if (resolverRef.current) resolverRef.current(true);
                  cleanup();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${getConfirmButtonClass(
                  modalState.variant
                )}`}
              >
                {modalState.buttonText || 'OK'}
              </button>
            ) : modalState.type === 'prompt' ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelAction}
                  className="px-3.5 py-2 text-xs text-[#7E869B] hover:text-white transition-colors cursor-pointer"
                >
                  {modalState.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handlePromptSubmit}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${getConfirmButtonClass(
                    modalState.variant
                  )}`}
                >
                  {modalState.confirmText || 'Submit'}
                </button>
              </>
            ) : (
              modalState.footer
            )
          }
        >
          {/* Confirm & Alert Body */}
          {(modalState.type === 'confirm' || modalState.type === 'alert') && (
            <div className="text-xs text-[#9DA4B7] leading-relaxed">
              {modalState.message}
            </div>
          )}

          {/* Prompt Body */}
          {modalState.type === 'prompt' && (
            <form onSubmit={handlePromptSubmit} className="space-y-3">
              {modalState.message && (
                <p className="text-xs text-[#9DA4B7] leading-relaxed">{modalState.message}</p>
              )}
              <div className="flex items-center">
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => {
                    setPromptValue(e.target.value);
                    if (promptError) setPromptError('');
                  }}
                  placeholder={modalState.placeholder}
                  autoFocus
                  className={`flex-1 px-3 py-2 text-xs text-white bg-black/40 border rounded-xl focus:border-amber-500 focus:outline-none transition-colors ${
                    modalState.suffix ? 'rounded-r-none' : ''
                  } ${promptError ? 'border-rose-500' : 'border-white/[0.08]'}`}
                />
                {modalState.suffix && (
                  <span className="px-3 py-2 rounded-r-xl text-xs font-mono bg-white/[0.05] border border-l-0 border-white/[0.08] text-[#7E869B]">
                    {modalState.suffix}
                  </span>
                )}
              </div>
              {promptError && (
                <p className="text-[11px] text-rose-400 font-medium">{promptError}</p>
              )}
            </form>
          )}

          {/* Custom Content */}
          {modalState.type === 'custom' && modalState.content}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
