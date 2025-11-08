import * as React from "react"
import { Datepicker } from "flowbite-react"
import dayjs from "dayjs"

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  disabled = false,
  className,
  label,
  required = false,
  minDate,
  maxDate,
  name,
  min,
  max,
  ...props 
}) {
  // Support both minDate/min and maxDate/max for compatibility
  const effectiveMinDate = minDate || min
  const effectiveMaxDate = maxDate || max

  // Convert value to Date object
  const getDateValue = () => {
    if (!value) return null
    if (value instanceof Date) return value
    if (dayjs.isDayjs(value)) return value.toDate()
    
    // Handle DD/MM/YYYY format
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/')
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    }
    
    // Handle YYYY-MM-DD format
    if (typeof value === 'string') {
      return new Date(value)
    }
    
    return null
  }

  const handleDateChange = (selectedDate) => {
    if (onChange) {
      // Check if onChange expects a synthetic event (for ModernDatePicker compatibility)
      if (name) {
        const syntheticEvent = {
          target: {
            name: name,
            value: selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : ''
          }
        }
        onChange(syntheticEvent)
      } else {
        // Convert to dayjs for compatibility with existing code
        onChange(selectedDate ? dayjs(selectedDate) : null)
      }
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Datepicker
        value={getDateValue()}
        onSelectedDateChanged={handleDateChange}
        minDate={effectiveMinDate ? new Date(effectiveMinDate) : undefined}
        maxDate={effectiveMaxDate ? new Date(effectiveMaxDate) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}
