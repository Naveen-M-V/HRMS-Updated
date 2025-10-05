import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

/**
 * Modern Date Picker Component for HRMS
 * 
 * Features:
 * - Native HTML5 date input with custom styling
 * - DD/MM/YYYY display format
 * - Responsive design
 * - No external dependencies
 * - Accessible
 */
const ModernDatePicker = ({
  name,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  className = '',
  min = null,
  max = null,
  disabled = false,
  label = null
}) => {
  
  // Convert DD/MM/YYYY to YYYY-MM-DD for input
  const getInputValue = () => {
    if (!value) return '';
    
    // Handle DD/MM/YYYY format
    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Already in YYYY-MM-DD format
    if (value.includes('-')) {
      return value;
    }
    
    return '';
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const getDisplayValue = () => {
    if (!value) return '';
    
    // Handle YYYY-MM-DD format
    if (value.includes('-')) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Already in DD/MM/YYYY format
    if (value.includes('/')) {
      return value;
    }
    
    return '';
  };

  // Handle date change
  const handleChange = (e) => {
    const inputValue = e.target.value; // YYYY-MM-DD format
    
    if (inputValue) {
      // Keep in YYYY-MM-DD format for consistency
      const syntheticEvent = {
        target: {
          name: name,
          value: inputValue
        }
      };
      onChange(syntheticEvent);
    } else {
      // Handle clear
      const syntheticEvent = {
        target: {
          name: name,
          value: ''
        }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="date"
          id={name}
          name={name}
          value={getInputValue()}
          onChange={handleChange}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-gray-900 placeholder-gray-500
            transition-colors duration-200
            ${disabled ? 'bg-gray-50' : 'bg-white'}
            ${className}
          `}
          placeholder={placeholder}
          aria-label={label || placeholder}
          aria-required={required}
        />
        
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      
      {/* Display formatted date below input for clarity */}
      {value && (
        <div className="text-xs text-gray-500 mt-1">
          Selected: {getDisplayValue()}
        </div>
      )}
    </div>
  );
};

export default ModernDatePicker;
