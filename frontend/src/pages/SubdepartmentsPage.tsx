import React, { useState, useEffect } from 'react'
import { ChevronRightIcon, ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams } from 'react-router-dom'
import AddDepartmentModal from '../components/AddDepartmentModal'
import EditDepartmentModal from '../components/EditDepartmentModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

interface Department {
  id: number
  name: string
  description: string | null
}

const SubdepartmentsPage: React.FC = () => {
  const { structureId } = useParams<{ structureId: string }>()
  const [structure, setStructure] = useState<Department | null>(null)
  const [subdepartments, setSubdepartments] = useState<Department[]>([])
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
    if (structureId) {
      fetchStructureAndSubdepartments()
    }
  }, [structureId])

  const fetchStructureAndSubdepartments = async () => {
    try {
      setLoading(true)
      const [structureResponse, subdepartmentsResponse] = await Promise.all([
        api.get(`/departments/${structureId}`),
        api.get(`/departments/${structureId}/subdepartments`)
      ])
      setStructure(structureResponse.data)
      setSubdepartments(subdepartmentsResponse.data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке подразделений')
      console.error('Error fetching subdepartments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = () => {
    fetchStructureAndSubdepartments()
  }

  const handleSubdepartmentClick = (subdepartment: Department) => {
    navigate(`/departments/${structureId}/subdepartments/${subdepartment.id}`)
  }

  const handleBackClick = () => {
    navigate('/departments')
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
      fetchStructureAndSubdepartments()
      setIsDeleteModalOpen(false)
      setDepartmentToDelete(null)
    } catch (err: any) {
      console.error('Error deleting department:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleEditSuccess = () => {
    fetchStructureAndSubdepartments()
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
        {/* Заголовок */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Подразделения</h1>
            <p className="mt-2 text-sm text-gray-700">
              Список подразделений в структуре {structure?.name}
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Добавить подразделение
            </button>
          </div>
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mt-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <button
                  onClick={handleBackClick}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Структуры
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-900">{structure?.name}</span>
              </div>
            </li>
          </ol>
        </nav>

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

        {/* Список подразделений */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {subdepartments.length === 0 ? (
                <li className="px-6 py-4 text-center text-sm text-gray-500">
                  Нет подразделений для отображения
                </li>
              ) : (
                subdepartments.map((subdepartment) => (
                  <li key={subdepartment.id}>
                    <button
                      onClick={() => handleSubdepartmentClick(subdepartment)}
                      className="w-full block hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                    >
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {subdepartment.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subdepartment.name}
                            </div>
                            {subdepartment.description && (
                              <div className="text-sm text-gray-500">
                                {subdepartment.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleEditClick(subdepartment, e)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Редактировать подразделение"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(subdepartment, e)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Удалить подразделение"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления подразделения */}
      <AddDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
        parentId={structure?.id}
      />

      {/* Модальное окно редактирования подразделения */}
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
        title="Удалить подразделение"
        message="Вы уверены, что хотите удалить подразделение?"
        itemName={departmentToDelete?.name || ''}
        loading={deleteLoading}
      />
    </div>
  )
}

export default SubdepartmentsPage 