import React, { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
}

interface EmployeeDutyPreference {
  id: number
  employee_id: number
  date: string
  preference_type: 'preferred' | 'unavailable'
  notes?: string
}

interface EmployeeDutyCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}

const EmployeeDutyCalendarModal: React.FC<EmployeeDutyCalendarModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [employeePreferences, setEmployeePreferences] = useState<EmployeeDutyPreference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [notes, setNotes] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [preferenceType, setPreferenceType] = useState<'preferred' | 'unavailable'>('preferred')

  useEffect(() => {
    if (isOpen && employee) {
      fetchEmployeePreferences()
    }
  }, [isOpen, employee, currentDate])

  const fetchEmployeePreferences = async () => {
    if (!employee) return

    try {
      setLoading(true)
      setError(null)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // Загружаем все предпочтения сотрудника за текущий месяц (без фильтрации по типу)
      const response = await api.get(`/employees/${employee.id}/duty-preferences?year=${year}&month=${month}`)
      
      setEmployeePreferences(response.data)
      
      // Очищаем выбранные даты при загрузке новых данных
      setSelectedDates([])
      
    } catch (err) {
      console.error('Error fetching employee preferences:', err)
      setError('Ошибка при загрузке предпочтений сотрудника')
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    const isSelected = selectedDates.some(d => d.toLocaleDateString('en-CA') === dateString)
    
    if (isSelected) {
      // Убираем дату из выбранных
      setSelectedDates(prev => prev.filter(d => d.toLocaleDateString('en-CA') !== dateString))
    } else {
      // Добавляем дату к выбранным
      setSelectedDates(prev => [...prev, date])
    }
  }

  const handleApplyPreferences = async () => {
    if (!employee || selectedDates.length === 0 || !selectedStatus) return

    try {
      setIsApplying(true)
      setError(null)

      // Создаем предпочтения для каждой выбранной даты
      const promises = selectedDates.map(date => {
        const dateString = date.toLocaleDateString('en-CA')
        return api.post(`/employees/${employee.id}/duty-preferences`, {
          date: dateString,
          preference_type: preferenceType,
          notes: notes.trim() || null
        })
      })

      await Promise.all(promises)

      // Обновляем данные
      await fetchEmployeePreferences()
      setSelectedDates([])
      setNotes('')
      setSelectedStatus('')
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при установке предпочтений')
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemovePreferences = async () => {
    if (!employee || selectedDates.length === 0) return

    try {
      setIsApplying(true)
      setError(null)

      // Находим предпочтения, которые пересекаются с выбранными датами
      const datesToRemove = selectedDates.map(d => d.toLocaleDateString('en-CA'))
      
      for (const preference of employeePreferences) {
        if (datesToRemove.includes(preference.date)) {
          await api.delete(`/employees/duty-preferences/${preference.id}`)
        }
      }

      // Обновляем данные
      await fetchEmployeePreferences()
      setSelectedDates([])
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении предпочтений')
    } finally {
      setIsApplying(false)
    }
  }

  const handleClearAllPreferences = async () => {
    if (!employee) return

    try {
      setIsApplying(true)
      setError(null)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      // Удаляем все предпочтения за текущий месяц
      await api.delete(`/employees/${employee.id}/duty-preferences/month?year=${year}&month=${month}`)

      // Обновляем данные
      await fetchEmployeePreferences()
      setSelectedDates([])
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при очистке предпочтений')
    } finally {
      setIsApplying(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSelectedDates([])
    setNotes('')
    setSelectedStatus('')
    setPreferenceType('preferred')
    onClose()
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Добавляем пустые ячейки для начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Добавляем дни месяца - создаем даты в UTC для избежания проблем с часовыми поясами
    for (let day = 1; day <= daysInMonth; day++) {
      // Создаем дату в UTC, чтобы избежать сдвигов из-за часовых поясов
      const utcDate = new Date(Date.UTC(year, month, day))
      // Конвертируем обратно в локальную дату для отображения
      const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
      days.push(localDate)
    }
    
    return days
  }

  const isDateSelected = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    return selectedDates.some(d => d.toLocaleDateString('en-CA') === dateString)
  }

  const getPreferenceForDate = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    return employeePreferences.find(preference => preference.date === dateString)
  }

  const isDateWithPreference = (date: Date) => {
    return getPreferenceForDate(date) !== undefined
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatMonthYear = (date: Date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const getPreferenceColor = () => {
    return selectedStatus === 'preferred' ? 'bg-green-500' : 
           selectedStatus === 'unavailable' ? 'bg-red-500' : 'bg-gray-500'
  }

  const getPreferenceLabel = () => {
    return selectedStatus === 'preferred' ? 'Предпочтительная дата' : 
           selectedStatus === 'unavailable' ? 'Нельзя заступать' : 'Не выбран'
  }

  const getStatusOptions = () => {
    return [
      { value: 'preferred', label: 'Предпочтительная дата', color: 'bg-green-500' },
      { value: 'unavailable', label: 'Нельзя заступать', color: 'bg-red-500' }
    ]
  }

  if (!isOpen || !employee) return null

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
             <div>

               <p className="text-sm text-gray-500 mt-1">
                 {employee.last_name} {employee.first_name} {employee.middle_name}
               </p>
               <p className="text-sm text-gray-500">
                 {employee.position}
               </p>
             </div>
             <button
               onClick={handleClose}
               className="text-gray-400 hover:text-gray-600"
             >
               <XMarkIcon className="h-6 w-6" />
             </button>
           </div>

          {/* Навигация по месяцам */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h4 className="text-lg font-semibold text-gray-900">
              {formatMonthYear(currentDate)}
            </h4>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          {/* Календарь */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg">
              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Дни месяца */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => (
                  <div key={index} className="h-12">
                    {date ? (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`w-full h-full text-sm font-medium rounded-md transition-colors relative ${
                          isDateSelected(date)
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : isDateWithPreference(date)
                            ? `${getPreferenceForDate(date)?.preference_type === 'preferred' ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-80`
                            : isToday(date)
                            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                            : 'text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <div className="h-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
                      )}

                     {/* Установить статус */}
          <div className="mt-6 mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Установить статус:</h5>
            <div className="flex space-x-3 mb-4">
              {getStatusOptions().map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPreferenceType(option.value as 'preferred' | 'unavailable')
                    setSelectedStatus(option.value)
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedStatus === option.value
                      ? `${option.color} text-white`
                      : `${option.color.replace('bg-', 'bg-').replace('500', '100')} ${option.color.replace('bg-', 'text-').replace('500', '700')} hover:${option.color.replace('bg-', 'bg-').replace('500', '200')}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Поле примечаний */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Примечания:
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Введите примечания к датам (необязательно)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                rows={3}
              />
            </div>
          </div>

                     {/* Кнопки действий */}
          <div className="flex space-x-3">
             <button
               onClick={handleApplyPreferences}
               disabled={selectedDates.length === 0 || !selectedStatus || isApplying}
               className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isApplying ? 'Применение...' : 'Применить'}
             </button>
             <button
               onClick={handleRemovePreferences}
               disabled={selectedDates.length === 0 || isApplying}
               className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isApplying ? 'Удаление...' : 'Удалить'}
             </button>
             <button
               onClick={handleClearAllPreferences}
               disabled={isApplying}
               className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isApplying ? 'Очистка...' : 'Очистить все'}
             </button>
           </div>

                               {/* Легенда */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
             <div className="flex items-center space-x-2">
               <div className="w-4 h-4 bg-purple-600 rounded"></div>
               <span>Выбрано</span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-4 h-4 bg-green-500 rounded"></div>
               <span>Предпочтительная дата</span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-4 h-4 bg-red-500 rounded"></div>
               <span>Нельзя заступать</span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-4 h-4 bg-blue-100 rounded"></div>
               <span>Сегодня</span>
             </div>
           </div>

          {/* Кнопки */}
          <div className="flex justify-end pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDutyCalendarModal 