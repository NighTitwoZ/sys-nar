import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  UserGroupIcon, 
  ChevronRightIcon,
  ArrowLeftIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'
import StatusDetailsModal from '../components/StatusDetailsModal'
import CreateGroupModal from '../components/CreateGroupModal'
import EditGroupModal from '../components/EditGroupModal'

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
}

const PersonnelExpenseGroupsPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string; departmentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: string }>({})
  const [saving, setSaving] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<Group | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Все') // Новое состояние для фильтрации по статусу

  const fetchData = useCallback(async () => {
    if (structureId && departmentId) {
      fetchStructure()
      fetchDepartment()
      fetchGroups()
      if (departmentId) {
        fetchEmployees()
      }
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
      setLoading(true)
      const response = await api.get(`/groups?department_id=${departmentId}`)
      setGroups(response.data)
    } catch (err) {
      setError('Ошибка загрузки групп')
      console.error('Error fetching groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      // Добавляем уникальный параметр времени для обхода кэширования
      const timestamp = Date.now()
      const response = await api.get(`/employees/department/${departmentId}/with-status?_t=${timestamp}`)
      setEmployees(response.data)
    } catch (err) {
      // не критично
    }
  }

  const updateEmployeeStatus = async (employeeId: number, status: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [employeeId]: status
    }))
  }

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      alert('Нет изменений для сохранения')
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
      
      alert('Изменения сохранены успешно!')
    } catch (err) {
      setError('Ошибка сохранения изменений')
      console.error('Error saving changes:', err)
      alert('Ошибка при сохранении изменений')
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

  const handleCreateGroup = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroupForEdit(group)
    setIsEditModalOpen(true)
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту группу?')) {
      try {
        await api.delete(`/groups/${groupId}`)
        // Обновляем список групп
        fetchGroups()
        alert('Группа успешно удалена!')
      } catch (err) {
        console.error('Error deleting group:', err)
        alert('Ошибка при удалении группы')
      }
    }
  }

  const handleGroupCreated = () => {
    setIsCreateModalOpen(false)
    fetchGroups()
  }

  const handleGroupUpdated = () => {
    setIsEditModalOpen(false)
    setSelectedGroupForEdit(null)
    fetchGroups()
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

  if (error || !department) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error || 'Подразделение не найдено'}</div>
        <button
          onClick={fetchGroups}
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
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/personnel-expense')}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Главная
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={() => navigate(`/personnel-expense/${structureId}/subdepartments`)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Структуры
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <span className="text-sm font-medium text-gray-900">{structure?.name}</span>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <span className="text-sm font-medium text-gray-900">{department.name}</span>
            </li>
          </ol>
        </nav>

        {/* Кнопки навигации */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              hasChanges && !saving
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>

        {/* Заголовок подразделения */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          {department.description && (
            <p className="mt-2 text-gray-600">{department.description}</p>
          )}
        </div>

        {/* Список групп */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold leading-6 text-gray-900">
              Группы подразделения
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Выберите группу для управления статусами сотрудников
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={handleCreateGroup}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Создать группу
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {group.employee_count} сотрудников
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => navigate(`/personnel-expense/${structureId}/subdepartments/${departmentId}/groups/${group.id}/employees`)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Управление сотрудниками
                  </button>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="Изменить группу"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Удалить группу"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Нет групп</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом подразделении пока нет групп.
            </p>
          </div>
        )}

        {/* Поиск сотрудников */}
        {employees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Поиск сотрудников</h3>
              <div className="text-sm text-gray-500">
                Найдено: {filteredEmployees.length} из {employees.length}
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
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </span>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                        {employee.rank && <p className="text-sm text-gray-500">{employee.rank}</p>}
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
      
      {/* Модальное окно создания группы */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleGroupCreated}
        departmentId={parseInt(departmentId || '0')}
      />

      {/* Модальное окно редактирования группы */}
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedGroupForEdit(null)
        }}
        onSuccess={handleGroupUpdated}
        group={selectedGroupForEdit}
      />
    </div>
  )
}

export default PersonnelExpenseGroupsPage