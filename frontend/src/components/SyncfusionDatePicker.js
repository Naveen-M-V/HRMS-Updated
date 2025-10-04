import React from 'react';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';

/**
 * Reusable Syncfusion DatePicker Component for HRMS
 * 
 * Features:
 * - DD/MM/YYYY format (matches app standard)
 * - Tailwind styling
 * - Full keyboard navigation
 * - Responsive design
 * - Form validation support
 * 
 * @param {Object} props
 * @param {string} props.name - Input name
 * @param {string} props.value - Date value (YYYY-MM-DD format)
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Required field
 * @param {string} props.className - Additional CSS classes
 * @param {Date} props.min - Minimum selectable date
 * @param {Date} props.max - Maximum selectable date
 * @param {boolean} props.disabled - Disabled state
 */
const SyncfusionDatePicker = ({
  name,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  className = '',
  min = null,
  max = null,
  disabled = false
}) => {
  
  // Convert YYYY-MM-DD to Date object for Syncfusion
  const getDateValue = () => {
    if (!value) return null;
    
    // Handle DD/MM/YYYY format
    if (value.includes('/')) {
      const [day, month, year] = value.split('/');
      return new Date(year, month - 1, day);
    }
    
    // Handle YYYY-MM-DD format
    if (value.includes('-')) {
      return new Date(value);
    }
    
    return null;
  };

  // Handle date change and convert back to YYYY-MM-DD for form state
  const handleChange = (args) => {
    if (args.value) {
      const date = new Date(args.value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Create synthetic event to match existing onChange handlers
      const syntheticEvent = {
        target: {
          name: name,
          value: `${year}-${month}-${day}` // YYYY-MM-DD format for backend
        }
      };
      
      onChange(syntheticEvent);
    } else {
      // Handle clear/empty
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
    <DatePickerComponent
      id={name}
      name={name}
      value={getDateValue()}
      change={handleChange}
      placeholder={placeholder}
      format="dd/MM/yyyy"
      floatLabelType="Never"
      showClearButton={true}
      strictMode={false}
      min={min}
      max={max}
      enabled={!disabled}
      cssClass={`e-custom-datepicker ${className}`}
      // Accessibility
      aria-label={placeholder}
      aria-required={required}
    />
  );
};

export default SyncfusionDatePicker;
