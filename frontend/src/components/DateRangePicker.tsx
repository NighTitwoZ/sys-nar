import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  placeholder = 'Выберите период',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dateRange.startDate || new Date());

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
  
  const isInRange = (date: Date) => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    return date >= dateRange.startDate && date <= dateRange.endDate;
  };
  
  const isStartDate = (date: Date) => {
    if (!dateRange.startDate) return false;
    return date.getDate() === dateRange.startDate.getDate() &&
      date.getMonth() === dateRange.startDate.getMonth() &&
      date.getFullYear() === dateRange.startDate.getFullYear();
  };
  
  const isEndDate = (date: Date) => {
    if (!dateRange.endDate) return false;
    return date.getDate() === dateRange.endDate.getDate() &&
      date.getMonth() === dateRange.endDate.getMonth() &&
      date.getFullYear() === dateRange.endDate.getFullYear();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Начинаем новый диапазон
      onDateRangeChange({ startDate: clickedDate, endDate: null });
    } else {
      // Завершаем диапазон
      if (clickedDate >= dateRange.startDate) {
        onDateRangeChange({ startDate: dateRange.startDate, endDate: clickedDate });
        // Закрываем календарь при выборе второй даты
        setIsOpen(false);
      } else {
        // Если выбранная дата раньше начальной, меняем местами
        onDateRangeChange({ startDate: clickedDate, endDate: dateRange.startDate });
        // Закрываем календарь при выборе второй даты
        setIsOpen(false);
      }
    }
  };

  // Функция для выбора всего месяца
  const selectEntireMonth = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    onDateRangeChange({ startDate: firstDay, endDate: lastDay });
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
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isRange = isInRange(date);
      const isStart = isStartDate(date);
      const isEnd = isEndDate(date);
      
      let className = "h-8 w-8 rounded-full text-sm font-medium transition-colors ";
      
      if (isStart || isEnd) {
        className += "bg-indigo-600 text-white";
      } else if (isRange) {
        className += "bg-indigo-100 text-indigo-700";
      } else if (isToday(date)) {
        className += "bg-indigo-50 text-indigo-600 border border-indigo-200";
      } else {
        className += "hover:bg-gray-100 text-gray-900";
      }
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={className}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const formatDateRange = () => {
    if (!dateRange.startDate) return placeholder;
    if (!dateRange.endDate) {
      return `${dateRange.startDate.toLocaleDateString('ru-RU')} - выберите конечную дату`;
    }
    return `${dateRange.startDate.toLocaleDateString('ru-RU')} - ${dateRange.endDate.toLocaleDateString('ru-RU')}`;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <span className={dateRange.startDate ? 'text-gray-900' : 'text-gray-500'}>
          {formatDateRange()}
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
            
            {/* Кнопки управления */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              {/* Кнопка выбора всего месяца */}
              <button
                onClick={selectEntireMonth}
                className="w-full px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
              >
                Выбрать весь месяц
              </button>
              
              {/* Кнопка очистки */}
              <button
                onClick={() => onDateRangeChange({ startDate: null, endDate: null })}
                className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Очистить выбор
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker; 