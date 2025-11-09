import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import dayjs from "dayjs"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

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

  // Convert value to Date object for react-day-picker
  const getDateValue = () => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (dayjs.isDayjs(value)) return value.toDate()
    
    // Handle DD/MM/YYYY format
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/')
      return new Date(year, parseInt(month) - 1, parseInt(day))
    }
    
    // Handle YYYY-MM-DD format
    if (typeof value === 'string') {
      return new Date(value)
    }
    
    return undefined
  }

  // Convert min/max dates to Date objects
  const getMinDate = () => {
    if (!effectiveMinDate) return undefined
    if (effectiveMinDate instanceof Date) return effectiveMinDate
    if (dayjs.isDayjs(effectiveMinDate)) return effectiveMinDate.toDate()
    if (typeof effectiveMinDate === 'string') return new Date(effectiveMinDate)
    return undefined
  }

  const getMaxDate = () => {
    if (!effectiveMaxDate) return undefined
    if (effectiveMaxDate instanceof Date) return effectiveMaxDate
    if (dayjs.isDayjs(effectiveMaxDate)) return effectiveMaxDate.toDate()
    if (typeof effectiveMaxDate === 'string') return new Date(effectiveMaxDate)
    return undefined
  }

  const handleDateChange = (selectedDate) => {
    if (onChange) {
      // Check if onChange expects a synthetic event (for compatibility)
      if (name) {
        const syntheticEvent = {
          target: {
            name: name,
            value: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
          }
        }
        onChange(syntheticEvent)
      } else {
        // Pass dayjs object for compatibility with existing code
        onChange(selectedDate ? dayjs(selectedDate) : null)
      }
    }
  }

  const dateValue = getDateValue()
  const minDateValue = getMinDate()
  const maxDateValue = getMaxDate()

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-10 border-gray-300 hover:bg-gray-50",
              !dateValue && "text-gray-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateChange}
            disabled={(date) => {
              if (minDateValue && date < minDateValue) return true
              if (maxDateValue && date > maxDateValue) return true
              return disabled
            }}
            initialFocus
            {...props}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
