import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';

const MUIDatePicker = ({ 
  label, 
  value, 
  onChange, 
  error, 
  helperText,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  ...props 
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          if (onChange) {
            onChange(newValue ? newValue.toDate() : null);
          }
        }}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
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

export default MUIDatePicker;
