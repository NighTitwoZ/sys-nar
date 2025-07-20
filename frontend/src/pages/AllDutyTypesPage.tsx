import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import AddDutyTypeModal from '../components/AddDutyTypeModal'
import EditDutyTypeModal from '../components/EditDutyTypeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

interface DutyType {
  id: number
  name: string
  description: string | null
  priority: number
  people_per_day: number
  duty_category: string
}

const AllDutyTypesPage: React.FC = () => {
  const navigate = useNavigate()
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDutyType, setSelectedDutyType] = useState<DutyType | null>(null)

  useEffect(() => {
    fetchAcademicDutyTypes()
  }, [])

  const fetchAcademicDutyTypes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/duty-types/unique')
      // Фильтруем только академические наряды
      const academicDutyTypes = response.data.filter((dutyType: DutyType) => 
        dutyType.duty_category === 'academic'
      )
      setDutyTypes(academicDutyTypes)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке типов нарядов')
      console.error('Error fetching duty types:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = () => {
    setIsAddModalOpen(false)
    fetchAcademicDutyTypes()
  }

  const handleEditClick = (dutyType: DutyType) => {
    setSelectedDutyType(dutyType)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    setSelectedDutyType(null)
    fetchAcademicDutyTypes()
  }

  const handleDeleteClick = (dutyType: DutyType) => {
    setSelectedDutyType(dutyType)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDutyType) return

    try {
      await api.delete(`/duty-types/${selectedDutyType.id}`)
      setIsDeleteModalOpen(false)
      setSelectedDutyType(null)
      fetchAcademicDutyTypes()
    } catch (err) {
      console.error('Error deleting duty type:', err)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setSelectedDutyType(null)
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
        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Академические наряды</h1>
            <p className="mt-2 text-sm text-gray-700">
              Список всех академических типов нарядов в системе
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Добавить наряд
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

        {/* Таблица */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Название наряда
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Описание
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
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Нет академических типов нарядов в системе
                        </td>
                      </tr>
                    ) : (
                      dutyTypes.map((dutyType) => (
                        <tr key={dutyType.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="font-semibold">{dutyType.name}</div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {dutyType.description || '-'}
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
        isAcademic={true}
      />

      {/* Модальное окно редактирования типа наряда */}
      <EditDutyTypeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedDutyType(null)
        }}
        dutyType={selectedDutyType}
        onUpdate={handleEditSuccess}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Удалить тип наряда"
        message="Вы уверены, что хотите удалить этот тип наряда? Это действие нельзя отменить."
        itemName={selectedDutyType?.name || ''}
      />
    </div>
  )
}

export default AllDutyTypesPage 