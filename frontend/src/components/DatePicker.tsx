import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelect,
  placeholder = 'Выберите дату',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Пн=0, Вс=6
  };
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  const handleDateClick = (day: number) => {
    // Create date in UTC to avoid timezone shifts
    const utcDate = new Date(Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    // Convert back to local date for display
    const newDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    onDateSelect(newDate);
    setIsOpen(false);
  };
  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date in UTC to avoid timezone shifts
      const utcDate = new Date(Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), day));
      // Convert back to local date for display
      const date = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
            isSelected(date)
              ? 'bg-indigo-600 text-white'
              : isToday(date)
              ? 'bg-indigo-100 text-indigo-700'
              : 'hover:bg-gray-100 text-gray-900'
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
          {selectedDate ? selectedDate.toLocaleDateString('ru-RU') : placeholder}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-1 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h2 className="text-sm font-semibold text-gray-900">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker; 