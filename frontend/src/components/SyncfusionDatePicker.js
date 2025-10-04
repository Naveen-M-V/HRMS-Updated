import React from 'react';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';

/**
 * Syncfusion DatePicker Component for HRMS
 * 
 * Features:
 * - DD/MM/YYYY format
 * - Tailwind styling
 * - Keyboard navigation
 * - Responsive design
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
  
  // Convert YYYY-MM-DD to Date object
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

  // Handle date change - convert back to YYYY-MM-DD
  const handleChange = (args) => {
    if (args.value) {
      const date = new Date(args.value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Create synthetic event
      const syntheticEvent = {
        target: {
          name: name,
          value: `${year}-${month}-${day}`
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
      aria-label={placeholder}
      aria-required={required}
    />
  );
};

export default SyncfusionDatePicker;