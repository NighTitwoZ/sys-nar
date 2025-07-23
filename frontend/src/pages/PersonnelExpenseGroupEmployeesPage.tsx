import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, Cog6ToothIcon, UserIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams } from 'react-router-dom'
import EditEmployeeModal from '../components/EditEmployeeModal'
import TransferEmployeeModal from '../components/TransferEmployeeModal'
import EmployeeDutyTypesModal from '../components/EmployeeDutyTypesModal'
import Breadcrumbs from '../components/Breadcrumbs'

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
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
}

const PersonnelExpenseGroupEmployeesPage: React.FC = () => {
  const { structureId, departmentId, groupId } = useParams<{ structureId: string; departmentId: string; groupId: string }>()
  const navigate = useNavigate()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isDutyTypesModalOpen, setIsDutyTypesModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    if (structureId && departmentId && groupId) {
      fetchStructure()
      fetchDepartment()
      fetchGroup()
      fetchEmployees()
    }
  }, [structureId, departmentId, groupId])

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

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`)
      setGroup(response.data)
    } catch (err) {
      setError('Ошибка загрузки группы')
      console.error('Error fetching group:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/groups/${groupId}/employees`)
      setEmployees(response.data)
    } catch (err) {
      setError('Ошибка загрузки сотрудников группы')
      console.error('Error fetching group employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditModalOpen(true)
  }

  const handleTransferEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsTransferModalOpen(true)
  }

  const handleDutyTypes = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsDutyTypesModalOpen(true)
  }

  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await api.delete(`/employees/${employeeId}`)
        fetchEmployees()
        alert('Сотрудник успешно удален!')
      } catch (err) {
        console.error('Error deleting employee:', err)
        alert('Ошибка при удалении сотрудника')
      }
    }
  }

  const handleEmployeeUpdated = () => {
    setIsEditModalOpen(false)
    setSelectedEmployee(null)
    fetchEmployees()
  }

  const handleEmployeeTransferred = () => {
    setIsTransferModalOpen(false)
    setSelectedEmployee(null)
    fetchEmployees()
  }

  const handleDutyTypesUpdated = () => {
    setIsDutyTypesModalOpen(false)
    setSelectedEmployee(null)
    fetchEmployees()
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

  if (error || !group) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error || 'Группа не найдена'}</div>
        <button
          onClick={fetchEmployees}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Расход личного состава', path: '/personnel-expense' },
            { label: structure?.name || 'Структура', path: `/personnel-expense/${structureId}/subdepartments` },
            { label: department?.name || 'Подразделение', path: `/personnel-expense/${structureId}/subdepartments/${departmentId}/groups` },
            { label: group?.name || 'Группа' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок группы */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="mt-2 text-gray-600">{group.description}</p>
          )}
        </div>

        {/* Список сотрудников */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Сотрудники группы
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Список всех сотрудников в группе {group.name}
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {employees.map((employee) => (
              <li key={employee.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {employee.rank && <span className="text-gray-600 mr-2">{employee.rank}</span>}
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {employee.position}
                        </p>
                        <p className="text-sm text-gray-500">
                          Статус: {employee.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Изменить сотрудника"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTransferEmployee(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Перевести в другую группу"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDutyTypes(employee)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Управление типами нарядов"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Удалить сотрудника"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Пустое состояние */}
        {employees.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этой группе пока нет сотрудников.
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования сотрудника */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={handleEmployeeUpdated}
        employee={selectedEmployee}
      />

      {/* Модальное окно перевода сотрудника */}
      <TransferEmployeeModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={handleEmployeeTransferred}
        employee={selectedEmployee}
        currentGroupId={parseInt(groupId || '0')}
        departmentId={parseInt(departmentId || '0')}
      />

      {/* Модальное окно управления типами нарядов */}
      <EmployeeDutyTypesModal
        isOpen={isDutyTypesModalOpen}
        onClose={() => {
          setIsDutyTypesModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={handleDutyTypesUpdated}
        employee={selectedEmployee}
      />
    </div>
  )
}

export default PersonnelExpenseGroupEmployeesPage 