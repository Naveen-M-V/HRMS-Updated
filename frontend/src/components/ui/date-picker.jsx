import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import dayjs from "dayjs"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

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
    if (!value) return undefined
    if (value instanceof Date) return value
    if (dayjs.isDayjs(value)) return value.toDate()
    
    // Handle DD/MM/YYYY format
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/')
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    }
    
    return new Date(value)
  }

  const [date, setDate] = React.useState(getDateValue())

  React.useEffect(() => {
    setDate(getDateValue())
  }, [value])

  const handleSelect = (selectedDate) => {
    setDate(selectedDate)
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
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(date) => {
              if (effectiveMinDate && date < new Date(effectiveMinDate)) return true
              if (effectiveMaxDate && date > new Date(effectiveMaxDate)) return true
              return false
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
