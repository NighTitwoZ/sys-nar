import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  UserIcon, 
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'
import EmployeeDutyTypesModal from '../components/EmployeeDutyTypesModal'

interface Structure {
  id: number
  name: string
  description?: string
}

interface Department {
  id: number
  name: string
  description?: string
}

interface Group {
  id: number
  name: string
  description?: string
  department_id: number
  employee_count: number
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
  group_id?: number
  department_id: number
  is_active: boolean
  duty_types?: Array<{
    id: number
    name: string
    duty_category: string
    people_per_day: number
  }>
}

const DutyDepartmentEmployeesPage: React.FC = () => {
  const { structureId, subdepartmentId } = useParams<{ structureId: string, subdepartmentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [isEmployeeDutyTypesModalOpen, setIsEmployeeDutyTypesModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const timestamp = Date.now()
      
      const [structureRes, departmentRes, groupsRes, employeesRes] = await Promise.all([
        api.get(`/departments/${structureId}?_t=${timestamp}`),
        api.get(`/departments/${subdepartmentId}?_t=${timestamp}`),
        api.get(`/groups?department_id=${subdepartmentId}&_t=${timestamp}`),
        api.get(`/employees/department/${subdepartmentId}?_t=${timestamp}`)
      ])
      
      setStructure(structureRes.data)
      setDepartment(departmentRes.data)
      setGroups(groupsRes.data)
      setEmployees(employeesRes.data)
    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [structureId, subdepartmentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [location.pathname, fetchData])

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.last_name} ${employee.first_name} ${employee.middle_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase())
    const matchesGroup = selectedGroupId === null || employee.group_id === selectedGroupId
    return matchesSearch && matchesGroup
  })

  const getGroupName = (groupId?: number) => {
    if (!groupId) return 'Без группы'
    const group = groups.find(g => g.id === groupId)
    return group ? group.name : 'Неизвестная группа'
  }

  const handleOpenEmployeeDutyTypesModal = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEmployeeDutyTypesModalOpen(true)
  }

  const handleEmployeeDutyTypesModalClosed = () => {
    setIsEmployeeDutyTypesModalOpen(false)
    setSelectedEmployee(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error || !structure || !department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Ошибка загрузки данных'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-500"
              >
                Главная
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigate('/duty-structures')}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  Наряды
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigate('/duty-structures')}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  Структуры
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigate(`/duty-structures/${structureId}/subdepartments`)}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  {structure.name}
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => navigate(`/duty-structures/${structureId}/subdepartments/${subdepartmentId}/duty-types`)}
                  className="ml-4 text-gray-400 hover:text-gray-500"
                >
                  {department.name}
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-gray-400">/</span>
                <span className="ml-4 text-gray-900">Сотрудники</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники подразделения</h1>
          <p className="mt-2 text-gray-600">
            {department.name} - {structure.name}
          </p>
        </div>

        {/* Поиск сотрудников */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Поиск и фильтрация сотрудников</h3>
              <div className="text-sm text-gray-500">
                Найдено: {filteredEmployees.length} из {employees.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Поиск по ФИО сотрудника..."
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Все группы</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.employee_count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Список сотрудников подразделения */}
        {filteredEmployees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Сотрудники подразделения</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <li key={employee.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="font-medium text-gray-900">
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </span>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        {employee.rank && <p className="text-sm text-gray-500">{employee.rank}</p>}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getGroupName(employee.group_id)}
                      </span>
                      {employee.duty_types && employee.duty_types.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {employee.duty_types.map((dutyType) => (
                            <span 
                              key={dutyType.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              title={`${dutyType.name} (${dutyType.people_per_day} чел/сут)`}
                            >
                              {dutyType.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEmployeeDutyTypesModal(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Управление типами нарядов"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Сообщение о том, что сотрудники не найдены */}
        {employees.length > 0 && filteredEmployees.length === 0 && (searchQuery || selectedGroupId) && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery && selectedGroupId 
                ? `По запросу "${searchQuery}" в выбранной группе сотрудники не найдены.`
                : searchQuery 
                ? `По запросу "${searchQuery}" сотрудники не найдены.`
                : `В выбранной группе сотрудники не найдены.`
              }
            </p>
          </div>
        )}

        {/* Пустое состояние */}
        {employees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом подразделении пока нет сотрудников.
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно управления типами нарядов сотрудника */}
      <EmployeeDutyTypesModal
        isOpen={isEmployeeDutyTypesModalOpen}
        onClose={handleEmployeeDutyTypesModalClosed}
        employee={selectedEmployee}
      />
    </div>
  )
}

export default DutyDepartmentEmployeesPage 