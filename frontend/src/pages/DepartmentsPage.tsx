import React, { useState, useEffect } from 'react'
import { ChevronRightIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'
import AddDepartmentModal from '../components/AddDepartmentModal'
import EditDepartmentModal from '../components/EditDepartmentModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import Breadcrumbs from '../components/Breadcrumbs'

interface Department {
  id: number
  name: string
  description: string | null
}

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/departments')
      setDepartments(response.data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке структур')
      console.error('Error fetching departments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = () => {
    fetchDepartments()
  }

  const handleDepartmentClick = (department: Department) => {
    navigate(`/departments/${department.id}/subdepartments`)
  }

  const handleEditClick = (department: Department, e: React.MouseEvent) => {
    e.stopPropagation()
    setDepartmentToEdit(department)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (department: Department, e: React.MouseEvent) => {
    e.stopPropagation()
    setDepartmentToDelete(department)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return
    try {
      setDeleteLoading(true)
      await api.delete(`/departments/${departmentToDelete.id}`)
      setError(null) // Очищаем ошибки при успешном удалении
      fetchDepartments()
      setIsDeleteModalOpen(false)
      setDepartmentToDelete(null)
    } catch (err: any) {
      console.error('Error deleting department:', err)
      setError(err.response?.data?.detail || 'Ошибка при удалении структуры')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditSuccess = () => {
    fetchDepartments()
    setIsEditModalOpen(false)
    setDepartmentToEdit(null)
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setDepartmentToEdit(null)
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setDepartmentToDelete(null)
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
        <Breadcrumbs 
          items={[
            { label: 'Подразделения' }
          ]} 
        />

        {/* Заголовок */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Структуры</h1>
            <p className="mt-2 text-sm text-gray-700">
              Выберите структуру для просмотра подразделений и сотрудников
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Добавить структуру
            </button>
          </div>
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

        {/* Список структур */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {departments.length === 0 ? (
                <li className="px-6 py-4 text-center text-sm text-gray-500">
                  Нет структур для отображения
                </li>
              ) : (
                departments.map((department) => (
                  <li key={department.id}>
                    <div
                      onClick={() => handleDepartmentClick(department)}
                      className="w-full block hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset cursor-pointer"
                    >
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {department.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {department.name}
                            </div>
                            {department.description && (
                              <div className="text-sm text-gray-500">
                                {department.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleEditClick(department, e)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Редактировать структуру"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(department, e)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Удалить структуру"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления структуры */}
      <AddDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Модальное окно редактирования структуры */}
      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        onSuccess={handleEditSuccess}
        department={departmentToEdit}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Удалить структуру"
        message="Вы уверены, что хотите удалить структуру?"
        itemName={departmentToDelete?.name || ''}
        loading={deleteLoading}
      />
    </div>
  )
}

export default DepartmentsPage 