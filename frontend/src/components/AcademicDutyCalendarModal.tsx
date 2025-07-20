import React, { useState, useEffect } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface DutyType {
  id: number
  name: string
  description: string | null
  priority: number
  people_per_day: number
  duty_category: string
}

interface DutySchedule {
  id: number
  employee_id: number
  employee_name: string
  duty_type_id: number
  duty_type_name: string
  duty_date: string
  notes: string | null
}

interface AcademicDutyCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  dutyType: DutyType | null
  departmentId: number
  onUpdate: () => void
}

const AcademicDutyCalendarModal: React.FC<AcademicDutyCalendarModalProps> = ({
  isOpen,
  onClose,
  dutyType,
  departmentId,
  onUpdate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  useEffect(() => {
    if (isOpen && dutyType) {
      fetchDutySchedules()
    }
  }, [isOpen, dutyType, currentDate])

  const fetchDutySchedules = async () => {
    if (!dutyType) return

    try {
      setLoading(true)
      setError(null)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      console.log('Fetching duty schedules with params:', {
        year,
        month,
        departmentId,
        dutyTypeId: dutyType.id
      })
      
      // Загружаем дни дежурства подразделения из новой таблицы DepartmentDutyDay
      const response = await api.get(`/academic-duty/department-days?year=${year}&month=${month}&duty_type_id=${dutyType.id}&department_id=${departmentId}`)
      
      console.log('API response:', response.data)
      
      // Преобразуем записи в формат для отображения
      const calendarRecords = response.data.map((record: any) => ({
        id: record.id,
        employee_id: null, // В новой системе нет конкретного сотрудника
        employee_name: 'Подразделение', // Показываем что это день подразделения
        duty_type_id: record.duty_type_id,
        duty_type_name: record.duty_type_name,
        duty_date: record.duty_date,
        notes: null
      }))
      
      setDutySchedules(calendarRecords)
      
      console.log('Calendar records:', calendarRecords)
      
      // Преобразуем даты в объекты Date для удобства работы
      const dates = calendarRecords.map((schedule: any) => {
        const dateParts = schedule.duty_date.split('-')
        return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
      })
      setSelectedDates(dates)
      
      console.log('Selected dates:', dates)
    } catch (err) {
      console.error('Error fetching duty schedules:', err)
      console.error('Error details:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        departmentId,
        dutyTypeId: dutyType?.id,
        error: err
      })
      setError('Ошибка при загрузке расписания дежурств')
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = async (date: Date) => {
    if (!dutyType) return

    // Используем локальный формат даты вместо toISOString()
    const dateString = date.toLocaleDateString('en-CA') // Формат YYYY-MM-DD
    const isSelected = selectedDates.some(d => d.toLocaleDateString('en-CA') === dateString)

    try {
      if (isSelected) {
        // Находим запись для удаления
        const recordToDelete = dutySchedules.find((schedule: any) => 
          schedule.duty_date === dateString
        )
        
        if (recordToDelete) {
          // Удаляем день дежурства подразделения
          await api.delete(`/academic-duty/department-days/${recordToDelete.id}`)
          setSelectedDates(prev => prev.filter(d => d.toLocaleDateString('en-CA') !== dateString))
        }
      } else {
        // Добавляем день дежурства подразделения
        await api.post('/academic-duty/department-days', {
          department_id: departmentId,
          duty_type_id: dutyType.id,
          duty_date: dateString
        })
        setSelectedDates(prev => [...prev, date])
      }
      
      onUpdate()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении расписания')
    }
  }

  const handleClose = () => {
    setError(null)
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
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const isDateSelected = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    return selectedDates.some(d => d.toLocaleDateString('en-CA') === dateString)
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

  if (!isOpen || !dutyType) return null

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Расписание дежурств
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {dutyType.name} - {dutyType.people_per_day} чел/сут
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
                        className={`w-full h-full text-sm font-medium rounded-md transition-colors ${
                          isDateSelected(date)
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
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

          {/* Легенда */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-600 rounded"></div>
              <span>Дежурство</span>
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

export default AcademicDutyCalendarModal 