
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
          {icon}
        </span>
      )}
      <input
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 bg-white dark:bg-slate-900 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-slate-900 dark:text-white ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-[10px] font-bold text-rose-500 uppercase">{error}</p>}
  </div>
);
