import React from 'react';
import { audioFeedback } from '../../services/audioFeedbackService';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (haptic) {
      audioFeedback.playClick();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(20);
        } catch {
          // Ignore
        }
      }
    }
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[38px] rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-base min-h-[46px] rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3.5 text-lg min-h-[54px] rounded-xl gap-2.5 font-semibold',
    xl: 'px-8 py-4.5 text-xl min-h-[64px] rounded-2xl gap-3 font-bold',
  };

  const variantClasses = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm hover:shadow border border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-400',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 focus-visible:ring-4 focus-visible:ring-slate-400',
    outline:
      'bg-transparent text-slate-800 dark:text-slate-100 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 focus-visible:ring-4 focus-visible:ring-brand-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-500 shadow-sm focus-visible:ring-4 focus-visible:ring-red-400',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500 shadow-sm focus-visible:ring-4 focus-visible:ring-emerald-400',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-brand-400',
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center transition-all duration-150
        touch-manipulation select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0 flex items-center">{icon}</span>}
    </button>
  );
};
