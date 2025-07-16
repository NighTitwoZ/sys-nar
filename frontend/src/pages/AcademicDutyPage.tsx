import React, { useState, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface DutyType {
  id: number
  name: string
  description?: string
  duty_category: string
  people_per_day: number
}

interface Department {
  id: number
  name: string
  description?: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  position: string
  department_id: number
}

const AcademicDutyPage: React.FC = () => {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDutyType, setSelectedDutyType] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [departmentEmployees, setDepartmentEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Получение академических типов нарядов
  useEffect(() => {
    const fetchDutyTypes = async () => {
      try {
        const response = await api.get('/academic-duty/duty-types')
        setDutyTypes(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке типов нарядов:', error)
      }
    }
    fetchDutyTypes()
  }, [])

  // Получение подразделений
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/academic-duty/departments')
        setDepartments(response.data)
      } catch (error) {
        console.error('Ошибка при загрузке подразделений:', error)
      }
    }
    fetchDepartments()
  }, [])

  // Получение сотрудников подразделения
  useEffect(() => {
    if (selectedDepartment) {
      const fetchEmployees = async () => {
        try {
          const response = await api.get(`/academic-duty/departments/${selectedDepartment}/employees`)
          setDepartmentEmployees(response.data)
        } catch (error) {
          console.error('Ошибка при загрузке сотрудников:', error)
        }
      }
      fetchEmployees()
    }
  }, [selectedDepartment])

  // Генерация календаря
  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1)
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const calendar = []
    const currentDate = new Date(startDate)

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      calendar.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return calendar
  }

  // Обработка клика по дате
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDepartmentModal(true)
    setSelectedDepartment(null)
    setSelectedEmployee(null)
  }

  // Назначение сотрудника на наряд
  const assignEmployeeToDuty = async () => {
    if (!selectedEmployee || !selectedDate || !selectedDutyType) {
      alert('Пожалуйста, выберите сотрудника, дату и тип наряда')
      return
    }

    setLoading(true)
    try {
      await api.post('/academic-duty/assign', {
        employee_id: selectedEmployee,
        duty_type_id: selectedDutyType,
        duty_date: selectedDate.toISOString().split('T')[0],
        notes: 'Академический наряд'
      })
      
      alert('Сотрудник успешно назначен на наряд!')
      setShowDepartmentModal(false)
      setSelectedDate(null)
      setSelectedDepartment(null)
      setSelectedEmployee(null)
    } catch (error) {
      console.error('Ошибка при назначении наряда:', error)
      alert('Ошибка при назначении наряда')
    } finally {
      setLoading(false)
    }
  }

  const calendar = generateCalendar()
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Академические наряды</h1>
        
        {/* Выбор типа наряда, года и месяца */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип академического наряда
            </label>
            <select
              value={selectedDutyType || ''}
              onChange={(e) => setSelectedDutyType(Number(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Выберите тип наряда</option>
              {dutyTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Год
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Месяц
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Календарь */}
        {selectedDutyType && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Заголовок календаря */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11)
                      setSelectedYear(selectedYear - 1)
                    } else {
                      setSelectedMonth(selectedMonth - 1)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0)
                      setSelectedYear(selectedYear + 1)
                    } else {
                      setSelectedMonth(selectedMonth + 1)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {weekDays.map((day) => (
                <div key={day} className="px-3 py-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Дни календаря */}
            <div className="grid grid-cols-7">
              {calendar.map((date, index) => {
                const isCurrentMonth = date.getMonth() === selectedMonth
                const isToday = date.toDateString() === new Date().toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      px-3 py-2 text-sm border-r border-b border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
                      ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday ? 'bg-blue-50 font-semibold' : ''}
                      ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно выбора подразделения */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Выбор подразделения для {selectedDate?.toLocaleDateString('ru-RU')}
              </h3>

              {/* Выбор подразделения */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подразделение
                </label>
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => setSelectedDepartment(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Выберите подразделение</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор сотрудника */}
              {selectedDepartment && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сотрудник
                  </label>
                  <select
                    value={selectedEmployee || ''}
                    onChange={(e) => setSelectedEmployee(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите сотрудника</option>
                    {departmentEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {`${emp.last_name} ${emp.first_name} ${emp.middle_name || ''}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDepartmentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Отмена
                </button>
                <button
                  onClick={assignEmployeeToDuty}
                  disabled={!selectedEmployee || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Назначение...' : 'Назначить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AcademicDutyPage 