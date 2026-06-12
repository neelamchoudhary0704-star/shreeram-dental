import React from 'react';

type Option = { value: string; label: string };
type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
};

export default function Select({ label, id, options, className = '', ...props }: Props) {
  const selectId = id || label.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="w-full">
      <label htmlFor={selectId} className="block text-xs font-medium text-gray-500 mb-2">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-xl px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 text-sm focus:ring-2 focus:ring-amber-200 ${className}`}
        {...props}
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
