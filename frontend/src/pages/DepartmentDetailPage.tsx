import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ChevronRightIcon, 
  ArrowLeftIcon, 
  UserGroupIcon, 
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'
import CreateGroupModal from '../components/CreateGroupModal'
import EditGroupModal from '../components/EditGroupModal'
import EditEmployeeModal from '../components/EditEmployeeModal'
import AddEmployeeModal from '../components/AddEmployeeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
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
  structure_id: number
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

const DepartmentDetailPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string, departmentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<Group | null>(null)
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'employee', id: number, name: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [structureId, departmentId])

  // Перезагрузка данных при изменении URL (возврате на страницу)
  useEffect(() => {
    fetchData()
  }, [location.pathname])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Добавляем уникальный параметр времени для обхода кэширования
      const timestamp = Date.now()
      
      const [structureRes, departmentRes, groupsRes, employeesRes] = await Promise.all([
        api.get(`/departments/${structureId}?_t=${timestamp}`),
        api.get(`/departments/${departmentId}?_t=${timestamp}`),
        api.get(`/groups?department_id=${departmentId}&_t=${timestamp}`),
        api.get(`/employees/department/${departmentId}?_t=${timestamp}`)
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
  }

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.last_name} ${employee.first_name} ${employee.middle_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'А':
        return 'bg-green-100 text-green-800'
      case 'Б':
        return 'bg-yellow-100 text-yellow-800'
      case 'В':
        return 'bg-red-100 text-red-800'
      case 'Г':
        return 'bg-blue-100 text-blue-800'
      case 'НЛ':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'А':
        return 'Активен'
      case 'Б':
        return 'Больничный'
      case 'В':
        return 'Отпуск'
      case 'Г':
        return 'Командировка'
      case 'НЛ':
        return 'Нет данных'
      default:
        return status
    }
  }

  const getGroupName = (groupId?: number) => {
    if (!groupId) return 'Без группы'
    const group = groups.find(g => g.id === groupId)
    return group ? group.name : 'Неизвестная группа'
  }

  const handleCreateGroup = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setSelectedGroupForEdit(group)
    setIsEditModalOpen(true)
  }

  const handleDeleteGroup = (group: Group) => {
    setDeleteTarget({ type: 'group', id: group.id, name: group.name })
    setIsDeleteModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditEmployeeModalOpen(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteTarget({ type: 'employee', id: employee.id, name: `${employee.last_name} ${employee.first_name} ${employee.middle_name}` })
    setIsDeleteModalOpen(true)
  }

  const handleGroupCreated = () => {
    setIsCreateModalOpen(false)
    fetchData()
  }

  const handleGroupUpdated = () => {
    setIsEditModalOpen(false)
    setSelectedGroupForEdit(null)
    fetchData()
  }

  const handleEmployeeUpdated = () => {
    setIsEditEmployeeModalOpen(false)
    setSelectedEmployee(null)
    fetchData()
  }

  const handleEmployeeAdded = () => {
    setIsAddEmployeeModalOpen(false)
    fetchData()
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'group') {
        await api.delete(`/groups/${deleteTarget.id}`)
      } else {
        await api.delete(`/employees/${deleteTarget.id}`)
      }
      
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Ошибка при удалении')
    }
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
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Вернуться на главную
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
            { label: 'Подразделения', path: '/departments' },
            { label: department?.name || 'Подразделение' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
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
              Выберите группу для просмотра сотрудников
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
                    onClick={() => navigate(`/departments/${structureId}/${departmentId}/groups/${group.id}/employees`)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Просмотр сотрудников
                  </button>
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="Изменить группу"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group)}
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

        {/* Список сотрудников подразделения */}
        {filteredEmployees.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Сотрудники подразделения</h3>
              <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Добавить сотрудника
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <li key={employee.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900">
                          {employee.rank && <span className="text-gray-600 mr-2">{employee.rank}</span>}
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </span>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      </div>
                      <div className="ml-6 flex-shrink-0 w-32 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getGroupName(employee.group_id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Редактировать сотрудника"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Удалить сотрудника"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Сообщение о том, что сотрудники не найдены */}
        {employees.length > 0 && filteredEmployees.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              По запросу "{searchQuery}" сотрудники не найдены.
            </p>
          </div>
        )}
      </div>

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

      {/* Модальное окно редактирования сотрудника */}
      <EditEmployeeModal
        isOpen={isEditEmployeeModalOpen}
        onClose={() => {
          setIsEditEmployeeModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={handleEmployeeUpdated}
        employee={selectedEmployee}
        departmentId={parseInt(departmentId || '0')}
      />

      {/* Модальное окно добавления сотрудника */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onSuccess={handleEmployeeAdded}
        departmentId={parseInt(departmentId || '0')}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirmed}
        title={deleteTarget?.type === 'group' ? 'Удалить группу?' : 'Удалить сотрудника?'}
        message={deleteTarget ? `Вы уверены, что хотите удалить "${deleteTarget.name}"? Это действие нельзя отменить.` : ''}
      />
    </div>
  )
}

export default DepartmentDetailPage 