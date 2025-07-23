import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ChevronRightIcon,
  ArrowLeftIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'
import Breadcrumbs from '../components/Breadcrumbs'

interface Structure {
  id: number
  name: string
  description: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
  department_name: string
  status_updated_at?: string
  status_start_date?: string
  status_notes?: string
}

interface Department {
  id: number
  name: string
  description: string | null
}

const DutyStructureEmployeesPage: React.FC = () => {
  const { structureId } = useParams<{ structureId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')

  const fetchData = async () => {
    if (structureId) {
      fetchStructure()
      fetchDepartments()
      fetchEmployees()
    }
  }

  useEffect(() => {
    fetchData()
  }, [structureId])

  // Перезагрузка данных при изменении URL (возврате на страницу)
  useEffect(() => {
    fetchData()
  }, [location.pathname])

  const fetchStructure = async () => {
    try {
      const timestamp = Date.now()
      const response = await api.get(`/departments/${structureId}?_t=${timestamp}`)
      setStructure(response.data)
    } catch (err) {
      setError('Ошибка загрузки структуры')
      console.error('Error fetching structure:', err)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api.get(`/departments/${structureId}/subdepartments`)
      setDepartments(response.data)
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const timestamp = Date.now()
      const response = await api.get(`/employees/structure/${structureId}/with-status?_t=${timestamp}`)
      setAllEmployees(response.data)
      setEmployees(response.data)
    } catch (err) {
      setError('Ошибка загрузки сотрудников')
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Функция фильтрации по подразделению
  const filterByDepartment = (departmentName: string) => {
    setSelectedDepartment(departmentName)
    if (departmentName === 'all') {
      setEmployees(allEmployees)
    } else {
      const filtered = allEmployees.filter(employee => 
        employee.department_name === departmentName
      )
      setEmployees(filtered)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.last_name} ${employee.first_name} ${employee.middle_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === 'all' || employee.department_name === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'НЛ':
        return 'bg-green-100 text-green-800'
      case 'Б':
        return 'bg-red-100 text-red-800'
      case 'НВ':
        return 'bg-purple-100 text-purple-800'
      case 'НГ':
        return 'bg-orange-100 text-orange-800'
      case 'К':
        return 'bg-blue-100 text-blue-800'
      case 'О':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'НЛ':
        return 'На лицо'
      case 'Б':
        return 'Болен'
      case 'НВ':
        return 'Наряд внутренний'
      case 'НГ':
        return 'Наряд гарнизонный'
      case 'К':
        return 'Командировка'
      case 'О':
        return 'Отпуск'
      default:
        return status
    }
  }

  const handleBackClick = () => {
    navigate('/duty-structures')
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

  if (error || !structure) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error || 'Ошибка загрузки данных'}</p>
            <button
              onClick={() => navigate('/duty-structures')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Вернуться к структурам
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Система нарядов', path: '/duty-structures' },
            { label: structure?.name || 'Структура' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники структуры {structure.name}</h1>
          {structure.description && (
            <p className="mt-2 text-gray-600">{structure.description}</p>
          )}
        </div>

        {/* Поиск сотрудников */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Поиск сотрудников</h3>
              <div className="text-sm text-gray-500">
                Показано: {filteredEmployees.length} из {allEmployees.length}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Поиск по ФИО сотрудника..."
              />
            </div>
          </div>
        )}

        {/* Фильтрация по подразделениям */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Фильтрация по подразделениям</h3>
            <div className="flex items-center space-x-4">
              <label htmlFor="department-filter" className="text-sm font-medium text-gray-700">
                Выберите подразделение:
              </label>
              <select
                id="department-filter"
                value={selectedDepartment}
                onChange={(e) => filterByDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Все подразделения</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                Показано: {filteredEmployees.length} из {allEmployees.length}
              </span>
            </div>
          </div>
        )}

        {/* Список сотрудников */}
        {filteredEmployees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Сотрудники структуры</h3>
            <ul className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <li key={employee.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {employee.rank && <span className="text-gray-600 mr-2">{employee.rank}</span>}
                        {employee.last_name} {employee.first_name} {employee.middle_name}
                      </span>
                      <p className="text-sm text-gray-500">{employee.position}</p>
                      <p className="text-sm text-gray-500">Подразделение: {employee.department_name}</p>
                      {employee.status !== 'НЛ' && employee.status_updated_at && (
                        <p className="text-sm text-gray-500">
                          Статус изменен: {new Date(employee.status_updated_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {employee.status !== 'НЛ' && employee.status_start_date && (
                        <p className="text-sm text-gray-500">
                          Дата начала статуса: {new Date(employee.status_start_date).toLocaleDateString('ru-RU')}
                        </p>
                      )}
                      {employee.status !== 'НЛ' && employee.status_notes && (
                        <p className="text-sm text-gray-500">
                          Примечания: {employee.status_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(employee.status)}`}>
                        {employee.status} - {getStatusLabel(employee.status)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Сообщение о том, что сотрудники не найдены */}
        {employees.length > 0 && filteredEmployees.length === 0 && (searchQuery || selectedDepartment !== 'all') && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery && selectedDepartment !== 'all' 
                ? 'Попробуйте изменить критерии поиска или фильтрации'
                : searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Попробуйте изменить фильтр по подразделению'
              }
            </p>
          </div>
        )}

        {/* Сообщение о том, что нет сотрудников */}
        {employees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет сотрудников</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этой структуре пока нет сотрудников.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DutyStructureEmployeesPage 