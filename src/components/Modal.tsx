import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  const maxW = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black-950/85 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxW} animate-fade-up rounded-t-xl sm:rounded-xl border border-black-600 bg-black-900 shadow-card`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black-700 px-5 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-600/30 bg-red-600/10 text-red-500">
                {icon}
              </div>
            )}
            <div>
              <h2 className="heading text-lg text-white">{title}</h2>
              {subtitle && <p className="text-sm text-black-300">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-black-300 transition hover:bg-black-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-black-700 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
