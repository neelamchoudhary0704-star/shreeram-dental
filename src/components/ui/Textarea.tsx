import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export default function Textarea({ label, id, className = '', ...props }: Props) {
  const textareaId = id || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      <label htmlFor={textareaId} className="block text-xs font-medium text-gray-500 mb-2">
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`w-full rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 placeholder-gray-400 focus:ring-2 focus:ring-amber-200 ${className}`}
        {...props}
      />
    </div>
  );
}
