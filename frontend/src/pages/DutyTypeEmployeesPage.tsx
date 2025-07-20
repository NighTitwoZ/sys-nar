import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams } from 'react-router-dom'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string | null
  position: string
  department_id: number
  group_id: number | null
  group_name?: string
  is_active: boolean
  duty_types: EmployeeDutyType[]
}

interface EmployeeDutyType {
  id: number
  employee_id: number
  duty_type_id: number
  is_active: boolean
}

interface DutyType {
  id: number
  name: string
  description: string | null
  duty_category: string
  people_per_day: number
}

interface Group {
  id: number
  name: string
  description: string | null
}

interface Department {
  id: number
  name: string
  description: string | null
}

const DutyTypeEmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [dutyType, setDutyType] = useState<DutyType | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()
  const { structureId, subdepartmentId, dutyTypeId } = useParams<{ 
    structureId: string; 
    subdepartmentId: string; 
    dutyTypeId: string 
  }>()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Получаем информацию о типе наряда
      const dutyTypeResponse = await api.get(`/duty-types/${dutyTypeId}`)
      setDutyType(dutyTypeResponse.data)
      
      // Получаем информацию о подразделении
      const departmentResponse = await api.get(`/departments/${subdepartmentId}`)
      setDepartment(departmentResponse.data)
      
      // Получаем группы подразделения
      const groupsResponse = await api.get(`/groups/department/${subdepartmentId}`)
      setGroups(groupsResponse.data)
      
      // Получаем сотрудников подразделения с их типами нарядов
      const employeesResponse = await api.get(`/employees/department/${subdepartmentId}`)
      const employeesData = employeesResponse.data
      
      // Для каждого сотрудника получаем его типы нарядов
      const employeesWithDutyTypes = await Promise.all(
        employeesData.map(async (employee: Employee) => {
          const dutyTypesResponse = await api.get(`/employee-duty-types/employee/${employee.id}`)
          return {
            ...employee,
            duty_types: dutyTypesResponse.data
          }
        })
      )
      
      // Добавляем названия групп к сотрудникам
      const employeesWithGroups = employeesWithDutyTypes.map(employee => {
        const group = groups.find(g => g.id === employee.group_id)
        return {
          ...employee,
          group_name: group?.name || null
        }
      })
      
      setEmployees(employeesWithGroups)
      
      // Устанавливаем уже выбранных сотрудников
      const selected = new Set<number>()
      employeesWithGroups.forEach(employee => {
        const hasDutyType = employee.duty_types.some(
          dt => dt.duty_type_id === parseInt(dutyTypeId!) && dt.is_active
        )
        if (hasDutyType) {
          selected.add(employee.id)
        }
      })
      setSelectedEmployees(selected)
      
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [structureId, subdepartmentId, dutyTypeId])

  useEffect(() => {
    if (structureId && subdepartmentId && dutyTypeId) {
      fetchData()
    }
  }, [structureId, subdepartmentId, dutyTypeId])

  // Фильтрация сотрудников
  useEffect(() => {
    let filtered = employees

    // Фильтр по поиску
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        `${employee.last_name} ${employee.first_name} ${employee.middle_name || ''} ${employee.position}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }

    // Фильтр по группе
    if (selectedGroupId) {
      filtered = filtered.filter(employee => employee.group_id === selectedGroupId)
    }

    setFilteredEmployees(filtered)
  }, [employees, searchTerm, selectedGroupId])

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    if (!dutyTypeId) return

    try {
      setSaving(true)
      
      // Получаем текущие связи сотрудников с этим типом наряда
      const currentConnections = new Map<number, EmployeeDutyType>()
      employees.forEach(employee => {
        const connection = employee.duty_types.find(dt => dt.duty_type_id === parseInt(dutyTypeId))
        if (connection) {
          currentConnections.set(employee.id, connection)
        }
      })

      // Обрабатываем изменения
      for (const employee of employees) {
        const isSelected = selectedEmployees.has(employee.id)
        const hasConnection = currentConnections.has(employee.id)
        const connection = currentConnections.get(employee.id)

        if (isSelected && !hasConnection) {
          // Создаем новую связь
          await api.post(`/employees/${employee.id}/duty-types`, {
            duty_type_id: parseInt(dutyTypeId),
            is_active: true
          })
        } else if (!isSelected && hasConnection && connection) {
          // Деактивируем существующую связь
          await api.put(`/employee-duty-types/${connection.id}`, {
            is_active: false
          })
        } else if (isSelected && hasConnection && connection && !connection.is_active) {
          // Активируем существующую связь
          await api.put(`/employee-duty-types/${connection.id}`, {
            is_active: true
          })
        }
      }

      // Обновляем данные
      await fetchData()
    } catch (err) {
      setError('Ошибка при сохранении изменений')
      console.error('Error saving changes:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleBackClick = () => {
    navigate(`/duty-structures/${structureId}/subdepartments/${subdepartmentId}/duty-types`)
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
        {/* Хлебные крошки */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/duty-structures')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Наряды
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={() => navigate('/duty-structures')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Структуры
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={() => navigate(`/duty-structures/${structureId}/subdepartments`)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Подразделения
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={handleBackClick}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {department?.name}
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <span className="text-sm font-medium text-gray-900">
                {dutyType?.name}
              </span>
            </li>
          </ol>
        </nav>

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
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Сотрудники для наряда - {dutyType?.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Управление сотрудниками подразделения {department?.name} для наряда {dutyType?.name}
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                'Сохранить изменения'
              )}
            </button>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Ошибка
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Поиск */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Поиск сотрудника
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="ФИО, должность..."
                />
              </div>
            </div>

            {/* Фильтр по группам */}
            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700">
                Группа
              </label>
              <select
                id="group"
                name="group"
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Все группы</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Таблица сотрудников */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        ФИО
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Должность
                      </th>
                      <th scope="col" className="relative px-6 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute right-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.has(emp.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)))
                            } else {
                              setSelectedEmployees(new Set())
                            }
                          }}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          {searchTerm || selectedGroupId ? 'Сотрудники не найдены' : 'Нет сотрудников в подразделении'}
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {employee.last_name} {employee.first_name} {employee.middle_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {employee.position}
                          </td>
                          <td className="relative px-6 sm:w-12 sm:px-6">
                            <input
                              type="checkbox"
                              className="absolute right-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedEmployees.has(employee.id)}
                              onChange={() => handleEmployeeToggle(employee.id)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Всего сотрудников</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{employees.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Выбрано</dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">{selectedEmployees.size}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Отфильтровано</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{filteredEmployees.length}</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DutyTypeEmployeesPage 