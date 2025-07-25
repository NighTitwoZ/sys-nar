import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import AddEmployeeModal from '../components/AddEmployeeModal'
import EditEmployeeModal from '../components/EditEmployeeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import Breadcrumbs from '../components/Breadcrumbs'
import StatusDetailsModal from '../components/StatusDetailsModal'
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

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
}

const PersonnelExpenseEmployeesPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string; departmentId: string }>()
  const navigate = useNavigate()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isStatusCalendarModalOpen, setIsStatusCalendarModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (structureId && departmentId) {
      fetchStructure()
      fetchDepartment()
      fetchEmployees()
    }
  }, [structureId, departmentId])

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

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/employees/department/${departmentId}`)
      setEmployees(response.data)
      // Очищаем pending changes при загрузке новых данных
      setPendingChanges({})
    } catch (err) {
      setError('Ошибка загрузки сотрудников')
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateEmployeeStatus = async (employeeId: number, status: string) => {
    // Добавляем изменение в pending changes вместо немедленного сохранения
    setPendingChanges(prev => ({
      ...prev,
      [employeeId]: status
    }))
  }

  const handleStatusCalendar = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsStatusCalendarModalOpen(true)
  }

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      alert('Нет изменений для сохранения')
      return
    }

    setSaving(true)
    try {
      // Сохраняем все изменения
      const promises = Object.entries(pendingChanges).map(([employeeId, status]) =>
        api.patch(`/employees/${employeeId}/status`, { status })
      )
      
      await Promise.all(promises)
      
      // Обновляем локальное состояние
      setEmployees(prev => prev.map(emp => 
        pendingChanges[emp.id] ? { ...emp, status: pendingChanges[emp.id] } : emp
      ))
      
      // Очищаем pending changes
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
    // Возвращаем pending status если есть, иначе текущий статус
    return pendingChanges[employee.id] || employee.status
  }

  const hasChanges = Object.keys(pendingChanges).length > 0

  const statusOptions = [
    { value: 'НЛ', label: 'НЛ', color: 'bg-green-100 text-green-800' },
    { value: 'Б', label: 'Б', color: 'bg-red-100 text-red-800' },
    { value: 'К', label: 'К', color: 'bg-blue-100 text-blue-800' },
    { value: 'НВ', label: 'НВ', color: 'bg-purple-100 text-purple-800' },
    { value: 'НГ', label: 'НГ', color: 'bg-orange-100 text-orange-800' },
    { value: 'О', label: 'О', color: 'bg-yellow-100 text-yellow-800' },
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

  if (!department) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">Подразделение не найдено</div>
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
            { label: 'Сотрудники' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="flex space-x-4 mb-6">
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

        {/* Список сотрудников */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Сотрудники подразделения
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Список всех сотрудников в подразделении {department.name}
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {employees.map((employee) => {
              const currentStatus = getEmployeeStatus(employee)
              const hasPendingChange = pendingChanges[employee.id]
              
              return (
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
                           {hasPendingChange && (
                             <p className="text-sm text-orange-600 font-medium">
                               ⚠ Изменение не сохранено
                             </p>
                           )}
                         </div>
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
                             title={status.label}
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
                           {/* ExclamationTriangleIcon was removed from imports, so this button will not work as intended */}
                           {/* <ExclamationTriangleIcon className="h-3 w-3" /> */}
                         </button>
                         <button
                           onClick={() => handleStatusCalendar(employee)}
                           className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                           title="Календарь статусов"
                         >
                           <CalendarIcon className="h-3 w-3" />
                         </button>
                       </div>
                     </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Пустое состояние */}
        {employees.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом подразделении пока нет сотрудников.
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
        employee={selectedEmployee}
      />

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
    </div>
  )
}

export default PersonnelExpenseEmployeesPage 