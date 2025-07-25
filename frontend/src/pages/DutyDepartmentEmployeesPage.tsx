import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, UserGroupIcon, Cog6ToothIcon, MinusIcon, PlusIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EmployeeDutyTypesModal from '../components/EmployeeDutyTypesModal'
import EmployeeDutyCalendarModal from '../components/EmployeeDutyCalendarModal'
import NotificationModal from '../components/NotificationModal'
import Breadcrumbs from '../components/Breadcrumbs'

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
  duty_count?: number
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
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<{[key: number]: number}>({})
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    show: boolean
  }>({
    type: 'info',
    message: '',
    show: false,
  })

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
    fetchData()
  }

  const handleOpenCalendar = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsCalendarModalOpen(true)
  }

  const handleCalendarModalClosed = () => {
    setIsCalendarModalOpen(false)
    setSelectedEmployee(null)
  }

  const handleDutyCountChange = async (employeeId: number, change: number) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return

    const currentCount = employee.duty_count || 0
    const newCount = Math.max(0, currentCount + change)
    
    // Обновляем локальное состояние
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId 
        ? { ...emp, duty_count: newCount }
        : emp
    ))

    // Добавляем в список ожидающих изменений
    setPendingChanges(prev => ({
      ...prev,
      [employeeId]: newCount
    }))

    // Показываем окно сохранения
    setHasUnsavedChanges(true)
  }

  const handleSaveChanges = async () => {
    try {
      console.log('Начинаем сохранение изменений:', pendingChanges)
      
      // Отправляем все изменения на сервер
      const promises = Object.entries(pendingChanges).map(([employeeId, dutyCount]) => {
        console.log(`Отправляем запрос для сотрудника ${employeeId}: duty_count = ${dutyCount}`)
        return api.patch(`/employees/${employeeId}/duty-count`, { duty_count: dutyCount })
      })
      
      const results = await Promise.all(promises)
      console.log('Результаты сохранения:', results)
      
      // Очищаем список изменений
      setPendingChanges({})
      setHasUnsavedChanges(false)
      
      setNotification({
        type: 'success',
        message: 'Изменения сохранены успешно!',
        show: true
      })
    } catch (err) {
      console.error('Error saving changes:', err)
      setNotification({
        type: 'error',
        message: 'Ошибка при сохранении изменений',
        show: true
      })
      
      // В случае ошибки возвращаем предыдущее состояние
      fetchData()
    }
  }

  const handleBackClick = () => {
    navigate(`/duty-structures/${structureId}/subdepartments/${subdepartmentId}/duty-types`)
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
        <Breadcrumbs 
          items={[
            { label: 'Система нарядов', path: '/duty-structures' },
            { label: structure?.name || 'Структура', path: `/duty-structures/${structureId}/subdepartments` },
            { label: department?.name || 'Подразделение', path: `/duty-structures/${structureId}/subdepartments/${subdepartmentId}/duty-types` }
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
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ФИО и должность
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группа
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Типов нарядов
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Количество нарядов
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleOpenEmployeeDutyTypesModal(employee)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <span className="font-medium text-gray-900">
                            {employee.rank && <span className="text-gray-600 mr-2">{employee.rank}</span>}
                            {employee.last_name} {employee.first_name} {employee.middle_name}
                          </span>
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getGroupName(employee.group_id)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-600">
                          {employee.duty_types?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Количество:</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDutyCountChange(employee.id, -1)
                              }}
                              className="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Уменьшить количество нарядов"
                            >
                              <MinusIcon className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {employee.duty_count || 0}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDutyCountChange(employee.id, 1)
                              }}
                              className="inline-flex items-center p-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Увеличить количество нарядов"
                            >
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenCalendar(employee)
                            }}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"

                          >
                            <CalendarIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Сообщение о том, что сотрудники не найдены */}
        {employees.length > 0 && filteredEmployees.length === 0 && (searchQuery || selectedGroupId) && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
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
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
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

      {/* Модальное окно календаря предпочтений */}
      <EmployeeDutyCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={handleCalendarModalClosed}
        employee={selectedEmployee}
      />

      {/* Динамическое окно сохранения изменений */}
      {hasUnsavedChanges && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-6 py-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Есть несохраненные изменения
              </span>
            </div>
            <button
              onClick={handleSaveChanges}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно уведомления */}
      <NotificationModal
        isOpen={notification.show}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        type={notification.type}
        title={
          notification.type === 'success' ? 'Успешно' :
          notification.type === 'error' ? 'Ошибка' :
          notification.type === 'warning' ? 'Предупреждение' :
          'Информация'
        }
        message={notification.message}
      />
    </div>
  )
}

export default DutyDepartmentEmployeesPage 