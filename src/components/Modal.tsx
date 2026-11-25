import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  alignBottomOnMobile?: boolean;
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  labelledBy,
  children,
  maxWidthClass = 'max-w-md',
  alignBottomOnMobile = false,
  closeOnBackdrop = true,
}) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-50 flex justify-center bg-zinc-950/65 animate-fade-in ${
        alignBottomOnMobile
          ? 'items-end sm:items-center p-0 sm:p-4'
          : 'items-center p-3 sm:p-4'
      }`}
    >
      <div
        className={`bg-white w-full ${maxWidthClass} border-2 border-zinc-900 shadow-ledger overflow-hidden flex flex-col animate-slide-up relative ${
          alignBottomOnMobile
            ? 'rounded-t-2xl sm:rounded-2xl max-h-[92vh]'
            : 'rounded-2xl max-h-[92vh]'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
