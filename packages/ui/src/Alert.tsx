import React from 'react';
import { cn } from './utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200',
    success: 'bg-green-50/70 border-green-200 text-green-900 dark:bg-green-950/30 dark:border-green-900 dark:text-green-200',
    warning: 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200',
    danger: 'bg-red-50/70 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
