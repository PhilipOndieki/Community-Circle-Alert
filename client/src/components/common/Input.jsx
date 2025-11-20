// src/components/common/Input.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-semibold text-neutral-700 mb-2"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3.5 rounded-xl border-2 text-base
            transition-all duration-300
            ${icon ? 'pl-12' : ''}
            ${error 
              ? 'border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-4 focus:ring-danger-100' 
              : isFocused
                ? 'border-primary-400 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
                : 'border-neutral-200 bg-neutral-50 focus:border-primary-400 focus:bg-white'
            }
            ${disabled ? 'bg-neutral-100 cursor-not-allowed opacity-60' : ''}
            placeholder:text-neutral-400
            focus:outline-none
          `}
          {...props}
        />
        
        {/* Animated border glow */}
        {isFocused && !error && (
          <motion.div
            layoutId="input-glow"
            className="absolute inset-0 rounded-xl ring-4 ring-primary-200 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="block mt-2 text-sm text-danger-600 font-medium"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Input;