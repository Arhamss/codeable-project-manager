import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

const CustomDatePicker = ({
  selected,
  onChange,
  placeholderText = "Select date",
  minDate,
  maxDate,
  disabled = false,
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleDateChange = (date) => {
    // Only call onChange if we have a valid date
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const CustomInput = React.forwardRef(({ value, onClick, onChange, placeholder }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        onChange={onChange}
        placeholder={placeholder}
        readOnly
        className={`
          w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
          text-white placeholder-gray-400 focus:outline-none focus:ring-2
          focus:ring-primary-500 focus:border-transparent transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600'}
          ${className}
        `}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    </div>
  ));

  const CustomHeader = ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        className="p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="w-5 h-5 text-gray-300" />
      </motion.button>
      
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-white"
      >
        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </motion.h2>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        className="p-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </motion.button>
    </div>
  );

  const CustomDay = ({ date, ...props }) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selected && date.toDateString() === selected.toDateString();
    
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
          cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-primary-500 text-white shadow-lg' 
            : isToday 
              ? 'bg-gray-600 text-white' 
              : 'text-gray-300 hover:bg-gray-700'
          }
        `}
        {...props}
      >
        {date.getDate()}
      </motion.div>
    );
  };

  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={handleDateChange}
        customInput={<CustomInput />}
        renderCustomHeader={CustomHeader}
        dayClassName={date => 'custom-day'}
        renderDayContents={(day, date) => <CustomDay date={date} />}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        placeholderText={placeholderText}
        dateFormat="dd/MM/yyyy"
        showPopperArrow={false}
        popperClassName="custom-datepicker-popper"
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8,
            },
          },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['top-start', 'bottom-start'],
            },
          },
        ]}
        {...props}
      />
      
      <style jsx>{`
        .custom-datepicker-popper {
          z-index: 99999 !important;
        }
        
        .react-datepicker-popper {
          z-index: 99999 !important;
        }
        
        .react-datepicker {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          font-family: inherit !important;
        }
        
        .react-datepicker__header {
          background-color: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .react-datepicker__current-month {
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day-name {
          color: #9ca3af !important;
          font-weight: 500 !important;
          width: 2rem !important;
          line-height: 2rem !important;
        }
        
        .react-datepicker__day {
          color: #d1d5db !important;
          width: 2rem !important;
          line-height: 2rem !important;
          margin: 0.125rem !important;
          border-radius: 50% !important;
          transition: all 0.2s !important;
        }
        
        .react-datepicker__day:hover {
          background-color: #374151 !important;
          color: white !important;
        }
        
        .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        
        .react-datepicker__day--disabled {
          color: #6b7280 !important;
          cursor: not-allowed !important;
        }
        
        .react-datepicker__day--outside-month {
          color: #6b7280 !important;
        }
        
        .react-datepicker__navigation {
          top: 1rem !important;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: #9ca3af !important;
        }
        
        .react-datepicker__navigation:hover *::before {
          border-color: #d1d5db !important;
        }
        
        .react-datepicker__month-container {
          background-color: #1f2937 !important;
        }
        
        .react-datepicker__month {
          margin: 0.4rem !important;
        }
        
        .react-datepicker__week {
          display: flex !important;
          justify-content: center !important;
        }
        
        /* Ensure date picker is always visible */
        .react-datepicker-wrapper {
          position: relative !important;
        }
        
        .react-datepicker__input-container {
          position: relative !important;
        }
        
        /* Force date picker to be above all other elements */
        .react-datepicker-popper[data-popper-placement^="top"] {
          z-index: 99999 !important;
        }
        
        .react-datepicker-popper[data-popper-placement^="bottom"] {
          z-index: 99999 !important;
        }
        
        /* Ensure proper positioning relative to the input */
        .react-datepicker-popper {
          position: absolute !important;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;
