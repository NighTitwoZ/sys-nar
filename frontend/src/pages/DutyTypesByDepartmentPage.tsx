import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRightIcon, ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import AddDutyTypeModal from '../components/AddDutyTypeModal'
import EditDutyTypeModal from '../components/EditDutyTypeModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import AcademicDutyTypeModal from '../components/AcademicDutyTypeModal'
import AcademicDutyCalendarModal from '../components/AcademicDutyCalendarModal'
import Breadcrumbs from '../components/Breadcrumbs'

interface DutyType {
  id: number
  name: string
  description: string | null
  priority: number
  people_per_day: number
  duty_category: string
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
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [dutyTypeToDelete, setDutyTypeToDelete] = useState<DutyType | null>(null)
  const [dutyTypeToEdit, setDutyTypeToEdit] = useState<DutyType | null>(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { structureId, subdepartmentId } = useParams<{ structureId: string; subdepartmentId: string }>()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Добавляем уникальный параметр времени для обхода кэширования
      const timestamp = Date.now()
      
      // Получаем информацию о структуре
      const structureResponse = await api.get(`/departments/${structureId}?_t=${timestamp}`)
      setStructure(structureResponse.data)
      
      // Получаем информацию о подразделении
      const departmentResponse = await api.get(`/departments/${subdepartmentId}?_t=${timestamp}`)
      setDepartment(departmentResponse.data)
      
      // Получаем типы нарядов для подразделения
      const dutyTypesResponse = await api.get(`/duty-types/department/${subdepartmentId}?_t=${timestamp}`)
      setDutyTypes(dutyTypesResponse.data)
      
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке типов нарядов')
      console.error('Error fetching duty types:', err)
    } finally {
      setLoading(false)
    }
  }, [structureId, subdepartmentId])

  useEffect(() => {
    if (structureId && subdepartmentId) {
      fetchData()
    }
  }, [structureId, subdepartmentId, fetchData])

  // Перезагрузка данных при изменении URL (возврате на страницу)
  useEffect(() => {
    if (structureId && subdepartmentId) {
      fetchData()
    }
  }, [location.pathname, structureId, subdepartmentId, fetchData])

  const handleBackClick = () => {
    navigate(`/duty-structures/${structureId}/subdepartments`)
  }

  const handleAddSuccess = () => {
    fetchData()
  }

  const handleEditClick = (dutyType: DutyType) => {
    if (dutyType.duty_category === 'academic') {
      // Для академических нарядов открываем календарь
      setDutyTypeToEdit(dutyType)
      setIsCalendarModalOpen(true)
    } else {
      // Для обычных нарядов открываем стандартное редактирование
      setDutyTypeToEdit(dutyType)
      setIsEditModalOpen(true)
    }
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
        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Система нарядов', path: '/duty-structures' },
            { label: structure?.name || 'Структура', path: `/duty-structures/${structureId}/subdepartments` },
            { label: department?.name || 'Подразделение' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

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
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/duty-structures/${structureId}/subdepartments/${subdepartmentId}/employees`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Просмотр сотрудников
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить наряд по подразделению
            </button>
            <button
              type="button"
              onClick={() => setIsAcademicModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить академический наряд
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

        {/* Убираем секцию сотрудников - она не нужна в разделе "Наряды" */}

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
                        <tr 
                          key={dutyType.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/duty-structures/${structureId}/subdepartments/${subdepartmentId}/duty-types/${dutyType.id}/employees`)}
                        >
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditClick(dutyType)
                                }}
                                className={`hover:text-gray-900 ${
                                  dutyType.duty_category === 'academic' 
                                    ? 'text-purple-600 hover:text-purple-900' 
                                    : 'text-indigo-600 hover:text-indigo-900'
                                }`}
                                title={dutyType.duty_category === 'academic' ? 'Расписание дежурств' : 'Редактировать тип наряда'}
                              >
                                {dutyType.duty_category === 'academic' ? (
                                  <CalendarIcon className="h-4 w-4" />
                                ) : (
                                  <PencilIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(dutyType)
                                }}
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

      {/* Модальное окно добавления академического наряда */}
      <AcademicDutyTypeModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        onSuccess={handleAddSuccess}
        departmentId={subdepartmentId ? parseInt(subdepartmentId) : undefined}
      />

      {/* Модальное окно календаря для академических нарядов */}
      <AcademicDutyCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => {
          setIsCalendarModalOpen(false)
          setDutyTypeToEdit(null)
        }}
        dutyType={dutyTypeToEdit}
        departmentId={subdepartmentId ? parseInt(subdepartmentId) : undefined}
        onUpdate={handleAddSuccess}
      />
    </div>
  )
}

export default DutyTypesByDepartmentPage 