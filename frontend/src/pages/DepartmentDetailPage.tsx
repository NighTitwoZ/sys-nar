import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { UserIcon, PlusIcon, TrashIcon, PencilIcon, CogIcon, ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import AddEmployeeModal from '../components/AddEmployeeModal'
import EditEmployeeModal from '../components/EditEmployeeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EmployeeDutyTypesModal from '../components/EmployeeDutyTypesModal'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string | null
  position: string
  is_active: boolean
  status: string
  duty_types?: Array<{
    id: number
    name: string
    priority: number
    people_per_day: number
  }>
}

interface Department {
  id: number
  name: string
  description: string | null
}

const DepartmentDetailPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string; departmentId: string }>()
  const id = departmentId // Используем departmentId для получения сотрудников
  const [department, setDepartment] = useState<Department | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDutyTypesModalOpen, setIsDutyTypesModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null)
  const [employeeForDutyTypes, setEmployeeForDutyTypes] = useState<Employee | null>(null)

  useEffect(() => {
    if (id) {
      fetchDepartmentData()
    }
  }, [id])

  const fetchDepartmentData = async () => {
    try {
      setLoading(true)
      const [deptResponse, empResponse] = await Promise.all([
        api.get(`/departments/${id}`),
        api.get(`/employees/department/${id}`)
      ])
      setDepartment(deptResponse.data)
      setEmployees(empResponse.data)
    } catch (err) {
      setError('Ошибка при загрузке данных подразделения')
      console.error('Error fetching department data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = () => {
    fetchDepartmentData()
  }

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return

    try {
      setDeleteLoading(true)
      await api.delete(`/employees/${employeeToDelete.id}`)
      fetchDepartmentData()
      setIsDeleteModalOpen(false)
      setEmployeeToDelete(null)
    } catch (err: any) {
      console.error('Error deleting employee:', err)
      // Можно добавить уведомление об ошибке
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setEmployeeToDelete(null)
  }

  const handleEditClick = (employee: Employee) => {
    setEmployeeToEdit(employee)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchDepartmentData()
    setIsEditModalOpen(false)
    setEmployeeToEdit(null)
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEmployeeToEdit(null)
  }

  const handleDutyTypesClick = (employee: Employee) => {
    setEmployeeForDutyTypes(employee)
    setIsDutyTypesModalOpen(true)
  }

  const handleDutyTypesClose = () => {
    setIsDutyTypesModalOpen(false)
    setEmployeeForDutyTypes(null)
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'НЛ': 'bg-green-100 text-green-800',
      'Б': 'bg-red-100 text-red-800',
      'К': 'bg-blue-100 text-blue-800',
      'НВ': 'bg-purple-100 text-purple-800',
      'НГ': 'bg-orange-100 text-orange-800',
      'О': 'bg-yellow-100 text-yellow-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !department) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error || 'Подразделение не найдено'}</div>
        <button
          onClick={fetchDepartmentData}
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
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <button
                  onClick={() => window.location.href = '/departments'}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Структуры
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <button
                  onClick={() => window.location.href = `/departments/${structureId}/subdepartments`}
                  className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Подразделения
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-900">{department?.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Кнопки навигации */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => window.location.href = `/departments/${structureId}/subdepartments`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад к подразделениям
          </button>
        </div>

        {/* Заголовок подразделения */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          {department.description && (
            <p className="mt-2 text-gray-600">{department.description}</p>
          )}
        </div>

        {/* Список сотрудников */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold leading-6 text-gray-900">
              Сотрудники подразделения
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Список всех сотрудников в подразделении "{department.name}"
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Добавить сотрудника
            </button>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Сотрудник
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Должность
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Статус
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Типы нарядов
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center">
                            <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="font-medium">
                                {employee.last_name} {employee.first_name}
                              </div>
                              {employee.middle_name && (
                                <div className="text-gray-500">{employee.middle_name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {employee.position}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(employee.status)}`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {employee.duty_types && employee.duty_types.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {employee.duty_types.map((dutyType) => (
                                <span
                                  key={dutyType.id}
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    dutyType.duty_category === 'academic' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                  title={`Вид наряда: ${dutyType.duty_category === 'academic' ? 'Академический' : 'По подразделению'}, Человек/сутки: ${dutyType.people_per_day}`}
                                >
                                  {dutyType.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Не назначены</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditClick(employee)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Редактировать сотрудника"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDutyTypesClick(employee)}
                              className="text-green-600 hover:text-green-900"
                              title="Управление типами нарядов"
                            >
                              <CogIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(employee)}
                              className="text-red-600 hover:text-red-900"
                              title="Удалить сотрудника"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Нет сотрудников</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом подразделении пока нет сотрудников.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Добавить сотрудника
              </button>
            </div>
          </div>
        )}

        {/* Модальное окно добавления сотрудника */}
        <AddEmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
          departmentId={department?.id}
        />

        {/* Модальное окно редактирования сотрудника */}
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={handleEditCancel}
          onSuccess={handleEditSuccess}
          employee={employeeToEdit}
        />

        {/* Модальное окно управления типами нарядов */}
        <EmployeeDutyTypesModal
          isOpen={isDutyTypesModalOpen}
          onClose={handleDutyTypesClose}
          employee={employeeForDutyTypes}
        />

        {/* Модальное окно подтверждения удаления */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Удалить сотрудника"
          message="Вы уверены, что хотите удалить сотрудника?"
          itemName={employeeToDelete ? `${employeeToDelete.last_name} ${employeeToDelete.first_name}` : ''}
          loading={deleteLoading}
        />
      </div>
    </div>
  )
}

export default DepartmentDetailPage 