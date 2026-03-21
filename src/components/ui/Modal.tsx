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
  const isDark = document.documentElement.classList.contains('dark');

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
      <div className={`relative w-full ${sizeClasses[size]} sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col ${
        isDark ? 'bg-[#1E1E1E]' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${
          isDark ? 'border-gray-700' : 'border-brand-silver/30'
        }`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-brand-black'}`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200' : 'hover:bg-brand-pearl text-brand-silver hover:text-brand-smoke'
            }`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className={`flex-shrink-0 border-t p-4 sm:p-6 sm:rounded-b-2xl ${
            isDark ? 'border-gray-700 bg-[#1E1E1E]' : 'border-brand-silver/30 bg-white'
          }`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
