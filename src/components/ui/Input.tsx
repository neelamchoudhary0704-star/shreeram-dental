import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function Input({ label, id, className = '', ...props }: Props) {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-xs font-medium text-gray-500 mb-2">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 placeholder-gray-400 focus:ring-2 focus:ring-amber-200 transition ${className}`}
        {...props}
      />
    </div>
  );
}
