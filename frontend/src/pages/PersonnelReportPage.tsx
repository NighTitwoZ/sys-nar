import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  department_name: string
  status: string
  status_start_date: string
  status_notes?: string
  rank?: string
  group_name?: string
}

interface StatusCount {
  status: string
  count: number
}

const PersonnelReportPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, selectedStatus, searchQuery, selectedStructure])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/employees/with-status')
      setEmployees(response.data)
      
      // Подсчитываем количество сотрудников по статусам
      const counts = response.data.reduce((acc: any, employee: Employee) => {
        const status = employee.status || 'По списку'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      
      const statusCountsArray = Object.entries(counts).map(([status, count]) => ({
        status,
        count: count as number
      }))
      
      setStatusCounts(statusCountsArray)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке сотрудников')
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    // Фильтрация по статусу
    if (selectedStatus === 'all') {
      // Показываем всех сотрудников со статусами не "На лицо"
      filtered = filtered.filter(emp => emp.status !== 'На лицо')
    } else {
      // Показываем сотрудников с выбранным статусом
      filtered = filtered.filter(emp => emp.status === selectedStatus)
    }

    // Фильтрация по структуре
    if (selectedStructure !== 'all') {
      filtered = filtered.filter(emp => getStructureFromDepartment(emp.department_name) === selectedStructure)
    }

    // Фильтрация по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(emp => {
        const fullName = getFullName(emp).toLowerCase()
        return fullName.includes(query)
      })
    }

    // Сортировка по статусам для кнопки "По списку"
    if (selectedStatus === 'all') {
      filtered = sortEmployeesByStatus(filtered)
    }

    setFilteredEmployees(filtered)
  }

  const handleEmployeeClick = async (employee: Employee) => {
    try {
      // Получаем дополнительную информацию о сотруднике
      const response = await api.get(`/employees/${employee.id}/detailed`)
      const detailedEmployee = response.data
      
      setSelectedEmployee({
        ...employee,
        rank: detailedEmployee.rank,
        group_name: detailedEmployee.group_name
      })
      setIsModalOpen(true)
    } catch (err) {
      console.error('Error fetching employee details:', err)
      // Если не удалось получить детали, показываем базовую информацию
      setSelectedEmployee(employee)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEmployee(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'По списку':
        return 'bg-gray-700 border-purple-300'
      case 'На лицо':
        return 'bg-green-600'
      case 'Наряд внутренний':
        return 'bg-blue-600'
      case 'Наряд по гарнизону':
        return 'bg-gray-700'
      case 'Болен':
        return 'bg-red-600'
      case 'Командировка':
        return 'bg-purple-600'
      case 'Отпуск':
        return 'bg-amber-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusCount = (status: string) => {
    if (status === 'all') {
      return employees.length
    }
    const statusCount = statusCounts.find(sc => sc.status === status)
    return statusCount ? statusCount.count : 0
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  }

  const getFullName = (employee: Employee) => {
    return `${employee.last_name} ${employee.first_name} ${employee.middle_name}`.trim()
  }

  const getStructureFromDepartment = (departmentName: string) => {
    if (!departmentName) return '-'
    // Извлекаем структуру из названия подразделения (например, "1фак_1каф" -> "1фак")
    const parts = departmentName.split('_')
    return parts[0] || departmentName
  }

  const getUniqueStructures = () => {
    const structures = employees.map(emp => getStructureFromDepartment(emp.department_name))
    return ['all', ...Array.from(new Set(structures)).sort()]
  }

  const getStatusOrder = (status: string) => {
    const order = {
      'Наряд внутренний': 1,
      'Наряд по гарнизону': 2,
      'Болен': 3,
      'Командировка': 4,
      'Отпуск': 5,
      'По списку': 6
    }
    return order[status as keyof typeof order] || 999
  }

  const sortEmployeesByStatus = (employees: Employee[]) => {
    return employees.sort((a, b) => {
      const statusA = a.status || 'По списку'
      const statusB = b.status || 'По списку'
      const orderA = getStatusOrder(statusA)
      const orderB = getStatusOrder(statusB)
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // Если статусы одинаковые, сортируем по ФИО
      return getFullName(a).localeCompare(getFullName(b), 'ru')
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/personnel-expense')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Строевая записка</h1>
          <p className="mt-2 text-sm text-gray-700">
            Список сотрудников по статусам
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Ошибка загрузки
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Большие кнопки статусов */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* По списку */}
            <button
              onClick={() => setSelectedStatus('all')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'all' 
                  ? 'bg-indigo-600 text-white border-2 border-indigo-600' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('all')}</div>
              <div className="text-sm">По списку</div>
            </button>

            {/* На лицо */}
            <button
              onClick={() => setSelectedStatus('На лицо')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'На лицо' 
                  ? 'bg-white text-gray-700 border-2 border-green-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('На лицо')}</div>
              <div className="text-sm">На лицо</div>
            </button>

            {/* Наряд внутренний */}
            <button
              onClick={() => setSelectedStatus('Наряд внутренний')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'Наряд внутренний' 
                  ? 'bg-white text-gray-700 border-2 border-blue-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('Наряд внутренний')}</div>
              <div className="text-sm">Наряд внутренний</div>
            </button>

            {/* Наряд по гарнизону */}
            <button
              onClick={() => setSelectedStatus('Наряд по гарнизону')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'Наряд по гарнизону' 
                  ? 'bg-white text-gray-700 border-2 border-gray-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('Наряд по гарнизону')}</div>
              <div className="text-sm">Наряд по гарнизону</div>
            </button>

            {/* Болен */}
            <button
              onClick={() => setSelectedStatus('Болен')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'Болен' 
                  ? 'bg-white text-gray-700 border-2 border-red-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('Болен')}</div>
              <div className="text-sm">Болен</div>
            </button>

            {/* Командировка */}
            <button
              onClick={() => setSelectedStatus('Командировка')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'Командировка' 
                  ? 'bg-white text-gray-700 border-2 border-purple-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('Командировка')}</div>
              <div className="text-sm">Командировка</div>
            </button>

            {/* Отпуск */}
            <button
              onClick={() => setSelectedStatus('Отпуск')}
              className={`relative p-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                selectedStatus === 'Отпуск' 
                  ? 'bg-white text-gray-700 border-2 border-amber-600' 
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-3xl font-bold mb-2">{getStatusCount('Отпуск')}</div>
              <div className="text-sm">Отпуск</div>
            </button>
          </div>
        </div>

        {/* Поиск и фильтрация */}
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Поиск */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Поиск сотрудников
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите ФИО сотрудника..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Фильтр по структуре */}
            <div>
              <label htmlFor="structure" className="block text-sm font-medium text-gray-700 mb-2">
                Структура
              </label>
              <select
                id="structure"
                value={selectedStructure}
                onChange={(e) => setSelectedStructure(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Все структуры</option>
                {getUniqueStructures().filter(structure => structure !== 'all').map((structure) => (
                  <option key={structure} value={structure}>
                    {structure}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Список сотрудников */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredEmployees.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Нет сотрудников с выбранным статусом
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ФИО
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Должность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Структура
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата начала статуса
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getFullName(employee)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getStructureFromDepartment(employee.department_name)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.status === 'Болен' ? 'bg-red-100 text-red-800' :
                          employee.status === 'Командировка' ? 'bg-purple-100 text-purple-800' :
                          employee.status === 'Отпуск' ? 'bg-amber-100 text-amber-800' :
                          employee.status === 'Наряд внутренний' ? 'bg-blue-100 text-blue-800' :
                          employee.status === 'Наряд по гарнизону' ? 'bg-gray-100 text-gray-800' :
                          employee.status === 'На лицо' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status || 'По списку'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(employee.status_start_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 border w-2/3 max-w-2xl mx-auto rounded-lg shadow-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Информация о сотруднике</h3>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">ФИО:</p>
                      <p className="text-lg font-semibold text-gray-900">{getFullName(selectedEmployee)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Должность:</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployee.position}</p>
                    </div>
                    {selectedEmployee.rank && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Звание:</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedEmployee.rank}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Организационная информация</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Структура:</p>
                      <p className="text-lg font-semibold text-gray-900">{getStructureFromDepartment(selectedEmployee.department_name)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Подразделение:</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployee.department_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Группа:</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedEmployee.group_name || 'Без группы'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Статус */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Текущий статус</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Статус:</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      selectedEmployee.status === 'Болен' ? 'bg-red-100 text-red-800' :
                      selectedEmployee.status === 'Командировка' ? 'bg-purple-100 text-purple-800' :
                      selectedEmployee.status === 'Отпуск' ? 'bg-amber-100 text-amber-800' :
                      selectedEmployee.status === 'Наряд внутренний' ? 'bg-blue-100 text-blue-800' :
                      selectedEmployee.status === 'Наряд по гарнизону' ? 'bg-gray-100 text-gray-800' :
                      selectedEmployee.status === 'На лицо' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEmployee.status || 'По списку'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Дата начала статуса:</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedEmployee.status_start_date)}</p>
                  </div>
                </div>
                {selectedEmployee.status_notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Примечание:</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedEmployee.status_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка закрытия */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonnelReportPage 