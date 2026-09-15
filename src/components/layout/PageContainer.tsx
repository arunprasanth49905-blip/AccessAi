import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'xl',
  className = '',
}) => {
  const maxClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 outline-none ${maxClasses[maxWidth]} ${className}`}
    >
      {children}
    </main>
  );
};
