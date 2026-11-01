'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { BRAND_CONFIG } from '@/lib/brand';

const VARIANT_ICONS = {
  danger: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle2,
  default: null,
};

const VARIANT_ICON_STYLES = {
  danger: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  default: 'bg-white/[0.05] border-white/[0.1] text-amber-400',
};

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Universal Modal Component with React Portal
 * Mounts directly into document.body to prevent parent CSS containing-block traps
 * (e.g. parent backdrop-filter or transform constraining fixed positioning)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon: CustomIcon,
  variant = 'default',
  size = 'md',
  hideCloseButton = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  children,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscape && onClose) {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!mounted || !isOpen) return null;

  const IconComponent = CustomIcon || VARIANT_ICONS[variant];
  const iconStyle = VARIANT_ICON_STYLES[variant] || VARIANT_ICON_STYLES.default;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      style={{ isolation: 'isolate' }}
    >
      <div
        className={`w-full ${sizeClass} rounded-2xl p-6 shadow-2xl space-y-4 border transition-all transform animate-in fade-in zoom-in-95 duration-150`}
        style={{
          background: '#0F121A',
          borderColor: BRAND_CONFIG.colors.borderSubtle,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (if title or icon present) */}
        {(title || IconComponent) && (
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3 min-w-0">
              {IconComponent && (
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconStyle}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 id="modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[#7E869B] mt-0.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {!hideCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#7E869B] hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        {children && <div className="text-xs text-[#7E869B] leading-relaxed">{children}</div>}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
