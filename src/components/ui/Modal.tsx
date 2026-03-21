import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-rose-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-rose-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 border-t border-rose-100 p-4 sm:p-6 bg-white sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
