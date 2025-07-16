import React, { useState, useEffect } from 'react'
import { ChevronRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams } from 'react-router-dom'
import AddDutyTypeModal from '../components/AddDutyTypeModal'
import EditDutyTypeModal from '../components/EditDutyTypeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

interface DutyType {
  id: number
  name: string
  description: string | null
  priority: number
  people_per_day: number
}

interface Department {
  id: number
  name: string
  description: string | null
}

const DutyTypesByDepartmentPage: React.FC = () => {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [department, setDepartment] = useState<Department | null>(null)
  const [structure, setStructure] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [dutyTypeToDelete, setDutyTypeToDelete] = useState<DutyType | null>(null)
  const [dutyTypeToEdit, setDutyTypeToEdit] = useState<DutyType | null>(null)
  
  const navigate = useNavigate()
  const { structureId, subdepartmentId } = useParams<{ structureId: string; subdepartmentId: string }>()

  useEffect(() => {
    if (structureId && subdepartmentId) {
      fetchData()
    }
  }, [structureId, subdepartmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Получаем информацию о структуре
      const structureResponse = await api.get(`/departments/${structureId}`)
      setStructure(structureResponse.data)
      
      // Получаем информацию о подразделении
      const departmentResponse = await api.get(`/departments/${subdepartmentId}`)
      setDepartment(departmentResponse.data)
      
      // Получаем типы нарядов для подразделения
      const dutyTypesResponse = await api.get(`/duty-types/department/${subdepartmentId}`)
      setDutyTypes(dutyTypesResponse.data)
      
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке типов нарядов')
      console.error('Error fetching duty types:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    navigate(`/duty-structures/${structureId}/subdepartments`)
  }

  const handleAddSuccess = () => {
    fetchData()
  }

  const handleEditClick = (dutyType: DutyType) => {
    setDutyTypeToEdit(dutyType)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = (updatedDutyType: DutyType) => {
    setDutyTypes(prev => prev.map(dt => dt.id === updatedDutyType.id ? updatedDutyType : dt))
    setIsEditModalOpen(false)
    setDutyTypeToEdit(null)
  }

  const handleDeleteClick = (dutyType: DutyType) => {
    setDutyTypeToDelete(dutyType)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!dutyTypeToDelete || !subdepartmentId) return

    try {
      setDeleteLoading(true)
      // Удаляем тип наряда только из текущего подразделения
      await api.delete(`/duty-types/${dutyTypeToDelete.id}/department/${subdepartmentId}`)
      fetchData()
      setIsDeleteModalOpen(false)
      setDutyTypeToDelete(null)
    } catch (err: any) {
      console.error('Error deleting duty type from department:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setDutyTypeToDelete(null)
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
            <h1 className="text-2xl font-semibold text-gray-900">
              Типы нарядов - {department?.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Управление типами нарядов для подразделения {department?.name}
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Добавить тип наряда
            </button>
          </div>
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mt-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Наряды</span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <button
                  onClick={() => navigate('/duty-structures')}
                  className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Структуры
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <button
                  onClick={handleBackClick}
                  className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {structure?.name}
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-900">
                  {department?.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Кнопка назад */}
        <div className="mt-4">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад к подразделениям
          </button>
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

        {/* Таблица типов нарядов */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Название
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Описание
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Вид наряда
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Человек/сутки
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dutyTypes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Нет типов нарядов для этого подразделения. Создайте первый тип наряда.
                        </td>
                      </tr>
                    ) : (
                      dutyTypes.map((dutyType) => (
                        <tr key={dutyType.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {dutyType.name}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {dutyType.description || '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              dutyType.duty_category === 'academic' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {dutyType.duty_category === 'academic' ? 'Академический' : 'По подразделению'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                              {dutyType.people_per_day}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditClick(dutyType)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Редактировать тип наряда"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(dutyType)}
                                className="text-red-600 hover:text-red-900"
                                title="Удалить тип наряда"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
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
      </div>

      {/* Модальное окно добавления типа наряда */}
      <AddDutyTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
        departmentId={subdepartmentId ? parseInt(subdepartmentId) : undefined}
      />

      {/* Модальное окно редактирования типа наряда */}
      <EditDutyTypeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setDutyTypeToEdit(null)
        }}
        dutyType={dutyTypeToEdit}
        onUpdate={handleEditSuccess}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Удалить тип наряда из подразделения"
        message="Вы уверены, что хотите удалить тип наряда из этого подразделения? Тип наряда останется доступным в других подразделениях."
        itemName={dutyTypeToDelete?.name || ''}
        loading={deleteLoading}
      />
    </div>
  )
}

export default DutyTypesByDepartmentPage 