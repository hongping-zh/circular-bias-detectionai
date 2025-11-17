
import React from 'react';

interface TextAreaInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ id, label, value, onChange, placeholder }) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-lg font-semibold text-slate-300">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-80 w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-y"
      />
    </div>
  );
};

export default TextAreaInput;
