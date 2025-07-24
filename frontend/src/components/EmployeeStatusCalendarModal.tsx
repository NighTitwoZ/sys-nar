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
  status: string
}

interface EmployeeStatus {
  id: number
  employee_id: number
  status: string
  start_date: string
  end_date: string
  notes?: string
}

interface EmployeeStatusCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  employee: Employee | null
}

const EmployeeStatusCalendarModal: React.FC<EmployeeStatusCalendarModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  employee
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [isApplyingStatus, setIsApplyingStatus] = useState(false)

  useEffect(() => {
    if (isOpen && employee) {
      fetchEmployeeStatuses()
    }
  }, [isOpen, employee, currentDate])

  const fetchEmployeeStatuses = async () => {
    if (!employee) return

    try {
      setLoading(true)
      setError(null)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // Загружаем статусы сотрудника за текущий месяц
      const response = await api.get(`/employees/${employee.id}/status-schedules?year=${year}&month=${month}`)
      
      setEmployeeStatuses(response.data)
      
      // Очищаем выбранные даты при загрузке новых данных
      setSelectedDates([])
      
    } catch (err) {
      console.error('Error fetching employee statuses:', err)
      setError('Ошибка при загрузке статусов сотрудника')
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

  const handleApplyStatus = async () => {
    if (!employee || !selectedStatus || selectedDates.length === 0) return

    try {
      setIsApplyingStatus(true)
      setError(null)

      // Сортируем даты
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
      const startDate = sortedDates[0].toLocaleDateString('en-CA')
      const endDate = sortedDates[sortedDates.length - 1].toLocaleDateString('en-CA')

      // Преобразуем статус в короткий код
      const statusCode = selectedStatus === 'Болен' ? 'Б' : selectedStatus === 'Командировка' ? 'К' : 'О'

      // Создаем новый статус
      await api.post(`/employees/${employee.id}/status-schedules`, {
        status: statusCode,
        start_date: startDate,
        end_date: endDate
      })

      // Обновляем данные
      await fetchEmployeeStatuses()
      setSelectedDates([])
      setSelectedStatus('')
      onUpdate()
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при установке статуса')
    } finally {
      setIsApplyingStatus(false)
    }
  }

  const handleRemoveStatus = async () => {
    if (!employee || selectedDates.length === 0) return

    try {
      setIsApplyingStatus(true)
      setError(null)

      // Находим статусы, которые пересекаются с выбранными датами
      const datesToRemove = selectedDates.map(d => d.toLocaleDateString('en-CA'))
      
      for (const status of employeeStatuses) {
        const statusStart = new Date(status.start_date)
        const statusEnd = new Date(status.end_date)
        
        // Проверяем пересечение
        const hasIntersection = datesToRemove.some(dateStr => {
          const date = new Date(dateStr)
          return date >= statusStart && date <= statusEnd
        })
        
        if (hasIntersection) {
          await api.delete(`/employees/status-schedules/${status.id}`)
        }
      }

      // Обновляем данные
      await fetchEmployeeStatuses()
      setSelectedDates([])
      onUpdate()
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении статуса')
    } finally {
      setIsApplyingStatus(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSelectedDates([])
    setSelectedStatus('')
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

  const isDateWithStatus = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    return employeeStatuses.some(status => {
      const startDate = new Date(status.start_date)
      const endDate = new Date(status.end_date)
      const checkDate = new Date(dateString)
      return checkDate >= startDate && checkDate <= endDate
    })
  }

  const getStatusForDate = (date: Date) => {
    const dateString = date.toLocaleDateString('en-CA')
    const status = employeeStatuses.find(s => {
      const startDate = new Date(s.start_date)
      const endDate = new Date(s.end_date)
      const checkDate = new Date(dateString)
      return checkDate >= startDate && checkDate <= endDate
    })
    return status?.status
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Б':
        return 'bg-red-500'
      case 'К':
        return 'bg-blue-500'
      case 'О':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
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
              <h3 className="text-lg font-medium text-gray-900">
                Календарь статусов сотрудника
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {employee.last_name} {employee.first_name} {employee.middle_name}
              </p>
              <p className="text-sm text-gray-500">
                {employee.position} {employee.rank && `(${employee.rank})`}
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
                            : isDateWithStatus(date)
                            ? `${getStatusColor(getStatusForDate(date) || '')} text-white hover:opacity-80`
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

          {/* Кнопки статусов */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Установить статус:</h5>
            <div className="flex space-x-3 mb-4">
              <button
                onClick={() => setSelectedStatus('Болен')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedStatus === 'Болен'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Болен
              </button>
              <button
                onClick={() => setSelectedStatus('Командировка')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedStatus === 'Командировка'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Командировка
              </button>
              <button
                onClick={() => setSelectedStatus('Отпуск')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedStatus === 'Отпуск'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Отпуск
              </button>
            </div>

            {/* Кнопки действий */}
            <div className="flex space-x-3">
              <button
                onClick={handleApplyStatus}
                disabled={!selectedStatus || selectedDates.length === 0 || isApplyingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplyingStatus ? 'Применение...' : 'Применить статус'}
              </button>
              <button
                onClick={handleRemoveStatus}
                disabled={selectedDates.length === 0 || isApplyingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplyingStatus ? 'Удаление...' : 'Удалить статус'}
              </button>
            </div>
          </div>

          {/* Легенда */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-600 rounded"></div>
              <span>Выбрано</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Болен</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Командировка</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Отпуск</span>
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

export default EmployeeStatusCalendarModal
 