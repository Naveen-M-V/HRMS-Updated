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
  orientation = 'portrait', // 'portrait' or 'landscape'
  ...props 
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          if (onChange) {
            onChange(newValue ? newValue.toDate() : null);
          }
        }}
        disabled={disabled}
        orientation={orientation}
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
