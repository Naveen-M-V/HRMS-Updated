import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const MUITimePicker = ({ 
  label, 
  value, 
  onChange, 
  error, 
  helperText,
  disabled = false,
  required = false,
  ...props 
}) => {
  // Convert value to dayjs object
  const getDayjsValue = () => {
    if (!value) return null;
    
    // If value is already a dayjs object
    if (dayjs.isDayjs(value)) return value;
    
    // If value is a Date object
    if (value instanceof Date) {
      return dayjs(value);
    }
    
    // If value is a time string like "09:00"
    if (typeof value === 'string' && value.includes(':')) {
      const [hours, minutes] = value.split(':');
      return dayjs().hour(parseInt(hours)).minute(parseInt(minutes)).second(0);
    }
    
    // Try to parse as dayjs
    return dayjs(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label={label}
        value={getDayjsValue()}
        onChange={(newValue) => {
          if (onChange) {
            onChange(newValue);
          }
        }}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            error: error,
            helperText: helperText,
            required: required,
            variant: 'outlined',
            size: 'medium'
          }
        }}
        {...props}
      />
    </LocalizationProvider>
  );
};

export default MUITimePicker;
