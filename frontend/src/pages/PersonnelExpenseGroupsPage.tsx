import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  UserIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'
import StatusDetailsModal from '../components/StatusDetailsModal'
import NotificationModal from '../components/NotificationModal'
import Breadcrumbs from '../components/Breadcrumbs'
import EmployeeStatusCalendarModal from '../components/EmployeeStatusCalendarModal'

interface Structure {
  id: number
  name: string
  description: string
}

interface Department {
  id: number
  name: string
  description: string
}

interface Group {
  id: number
  name: string
  description: string | null
  department_id: number
  department_name: string
  employee_count: number
  created_at: string
  updated_at: string | null
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
  status_updated_at?: string
  status_start_date?: string
  status_notes?: string
  group_id?: number
}

const PersonnelExpenseGroupsPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string; departmentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isStatusCalendarModalOpen, setIsStatusCalendarModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: string }>({})
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Все') // Новое состояние для фильтрации по статусу
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all') // Фильтрация по группам
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
    if (structureId && departmentId) {
      fetchStructure()
      fetchDepartment()
      fetchGroups()
      fetchEmployees()
    }
  }, [structureId, departmentId])

  useEffect(() => {
    fetchData()
  }, [structureId, departmentId, fetchData])

  // Принудительная перезагрузка данных при возврате на страницу
  useEffect(() => {
    const handleFocus = () => {
      if (structureId && departmentId) {
        setTimeout(() => {
          fetchData()
        }, 100)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [structureId, departmentId, fetchData])

  // Принудительная перезагрузка данных при изменении URL
  useEffect(() => {
    fetchData()
  }, [location.pathname, fetchData])

  // Убираем useEffect с focus, который может вызывать проблемы

  const fetchStructure = async () => {
    try {
      const response = await api.get(`/departments/${structureId}`)
      setStructure(response.data)
    } catch (err) {
      setError('Ошибка загрузки структуры')
      console.error('Error fetching structure:', err)
    }
  }

  const fetchDepartment = async () => {
    try {
      const response = await api.get(`/departments/${departmentId}`)
      setDepartment(response.data)
    } catch (err) {
      setError('Ошибка загрузки подразделения')
      console.error('Error fetching department:', err)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await api.get(`/groups/department/${departmentId}`)
      console.log('Loaded groups:', response.data)
      setGroups(response.data)
    } catch (err) {
      console.error('Error fetching groups:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      // Добавляем уникальный параметр времени для обхода кэширования
      const timestamp = Date.now()
      const response = await api.get(`/employees/department/${departmentId}/with-status?_t=${timestamp}`)
      console.log('Loaded employees:', response.data)
      setEmployees(response.data)
    } catch (err) {
      // не критично
    } finally {
      setLoading(false)
    }
  }

  const updateEmployeeStatus = async (employeeId: number, status: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [employeeId]: status
    }))
    setHasUnsavedChanges(true)
  }

  const handleStatusCalendar = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsStatusCalendarModalOpen(true)
  }

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      setNotification({
        type: 'warning',
        message: 'Нет изменений для сохранения',
        show: true
      })
      return
    }

    setSaving(true)
    try {
      const promises = Object.entries(pendingChanges).map(([employeeId, status]) =>
        api.patch(`/employees/${employeeId}/status`, { status })
      )
      
      await Promise.all(promises)
      
      setEmployees(prev => prev.map(emp => 
        pendingChanges[emp.id] ? { ...emp, status: pendingChanges[emp.id] } : emp
      ))
      
      setPendingChanges({})
      setHasUnsavedChanges(false)
      
      setNotification({
        type: 'success',
        message: 'Изменения сохранены успешно!',
        show: true
      })
    } catch (err) {
      setError('Ошибка сохранения изменений')
      console.error('Error saving changes:', err)
      setNotification({
        type: 'error',
        message: 'Ошибка при сохранении изменений',
        show: true
      })
    } finally {
      setSaving(false)
    }
  }

  const getEmployeeStatus = (employee: Employee) => {
    return pendingChanges[employee.id] || employee.status
  }

  const hasChanges = Object.keys(pendingChanges).length > 0

  const statusOptions = [
    { value: 'НЛ', label: 'НЛ', color: 'bg-green-100 text-green-800', title: 'На лицо' },
    { value: 'Б', label: 'Б', color: 'bg-red-100 text-red-800', title: 'Болен' },
    { value: 'К', label: 'К', color: 'bg-blue-100 text-blue-800', title: 'Командировка' },
    { value: 'НВ', label: 'НВ', color: 'bg-purple-100 text-purple-800', title: 'Наряд внутренний' },
    { value: 'НГ', label: 'НГ', color: 'bg-orange-100 text-orange-800', title: 'Наряд гарнизонный' },
    { value: 'О', label: 'О', color: 'bg-yellow-100 text-yellow-800', title: 'Отпуск' },
  ]

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

  if (error || !department) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error || 'Подразделение не найдено'}</div>
        <button
          onClick={fetchEmployees}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchQuery === '' || 
      `${employee.last_name} ${employee.first_name} ${employee.middle_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'Все' || employee.status === statusFilter
    
    const matchesGroup = selectedGroup === 'all' || employee.group_id?.toString() === selectedGroup
    
    // Отладочная информация
    if (selectedGroup !== 'all') {
      console.log(`Employee ${employee.last_name} ${employee.first_name}: group_id=${employee.group_id}, selectedGroup=${selectedGroup}, matchesGroup=${matchesGroup}`)
    }
    
    return matchesSearch && matchesStatus && matchesGroup
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Расход личного состава', path: '/personnel-expense' },
            { label: structure?.name || 'Структура', path: `/personnel-expense/${structureId}/subdepartments` },
            { label: department?.name || 'Подразделение' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/personnel-expense/${structureId}/subdepartments`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад
            </button>
          </div>
          <button
            onClick={() => navigate(`/personnel-expense/${structureId}/subdepartments/${departmentId}/report`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Строевая записка
          </button>
        </div>

        {/* Заголовок подразделения */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          {department.description && (
            <p className="mt-2 text-gray-600">{department.description}</p>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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

        {/* Поиск и фильтры */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Поиск и фильтрация сотрудников</h3>
              <div className="text-sm text-gray-500">
                Найдено: {filteredEmployees.length} из {employees.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск по ФИО
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Введите ФИО сотрудника..."
                  />
                </div>
              </div>
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
                  Фильтр по группе
                </label>
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">Все группы</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id.toString()}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Фильтрация по статусам */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Фильтрация по статусам</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('Все')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'Все'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setStatusFilter('НЛ')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'НЛ'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                НЛ
              </button>
              <button
                onClick={() => setStatusFilter('Б')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'Б'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Б
              </button>
              <button
                onClick={() => setStatusFilter('НВ')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'НВ'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                НВ
              </button>
              <button
                onClick={() => setStatusFilter('НГ')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'НГ'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                НГ
              </button>
              <button
                onClick={() => setStatusFilter('К')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'К'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                К
              </button>
              <button
                onClick={() => setStatusFilter('О')}
                className={`px-6 py-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  statusFilter === 'О'
                    ? 'bg-yellow-600 text-white border-yellow-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                О
              </button>
            </div>
          </div>
        )}

        {/* Список сотрудников подразделения */}
        {filteredEmployees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Сотрудники подразделения</h3>
            <ul className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => {
                const currentStatus = getEmployeeStatus(employee)
                const hasPendingChange = pendingChanges[employee.id]
                
                return (
                  <li key={employee.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">
                          {employee.rank && <span className="text-gray-600 mr-2">{employee.rank}</span>}
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </span>
                        <p className="text-sm text-gray-500">{employee.position}</p>
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
                        {hasPendingChange && (
                          <p className="text-sm text-orange-600 font-medium">
                            ⚠ Изменение не сохранено
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {statusOptions.map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateEmployeeStatus(employee.id, status.value)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              currentStatus === status.value
                                ? status.color
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={status.title}
                          >
                            {status.label}
                          </button>
                        ))}
                        <button
                          onClick={() => handleStatusCalendar(employee)}
                          className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                          title="Календарь статусов"
                        >
                          <CalendarIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setIsStatusModalOpen(true)
                          }}
                          disabled={currentStatus === 'НЛ'}
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            currentStatus !== 'НЛ'
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                          title={currentStatus === 'НЛ' ? 'Нет дополнительной информации' : 'Подробнее о статусе'}
                        >
                          <ExclamationTriangleIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Сообщение о том, что сотрудники не найдены */}
        {employees.length > 0 && filteredEmployees.length === 0 && (searchQuery || statusFilter !== 'Все') && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery && statusFilter !== 'Все' 
                ? `По запросу "${searchQuery}" и статусу "${statusFilter}" сотрудники не найдены.`
                : searchQuery 
                ? `По запросу "${searchQuery}" сотрудники не найдены.`
                : `Сотрудники со статусом "${statusFilter}" не найдены.`
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Модальное окно с деталями статуса */}
      <StatusDetailsModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={() => {
          fetchEmployees() // Обновляем данные после сохранения
        }}
        employee={selectedEmployee}
      />

      {/* Динамическое окно сохранения изменений */}
      {hasUnsavedChanges && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-6 py-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Есть несохраненные изменения статусов
              </span>
            </div>
            <button
              onClick={saveChanges}
              disabled={saving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }`}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно календаря статусов сотрудника */}
      <EmployeeStatusCalendarModal
        isOpen={isStatusCalendarModalOpen}
        onClose={() => {
          setIsStatusCalendarModalOpen(false)
          setSelectedEmployee(null)
        }}
        onUpdate={() => {
          setIsStatusCalendarModalOpen(false)
          setSelectedEmployee(null)
          fetchEmployees()
        }}
        employee={selectedEmployee}
      />

      {/* Модальное окно уведомлений */}
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

export default PersonnelExpenseGroupsPage