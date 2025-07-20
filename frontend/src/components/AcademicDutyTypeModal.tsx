import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface AcademicDutyType {
  id: number
  name: string
  description: string | null
  priority: number
  people_per_day: number
  duty_category: string
}

interface AcademicDutyTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  departmentId: number
}

const AcademicDutyTypeModal: React.FC<AcademicDutyTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentId
}) => {
  const [academicDutyTypes, setAcademicDutyTypes] = useState<AcademicDutyType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDutyType, setSelectedDutyType] = useState<AcademicDutyType | null>(null)
  const [addingLoading, setAddingLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAcademicDutyTypes()
    }
  }, [isOpen])

  const fetchAcademicDutyTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/duty-types/unique')
      // Фильтруем только академические наряды
      const academicTypes = response.data.filter((dutyType: AcademicDutyType) => 
        dutyType.duty_category === 'academic'
      )
      setAcademicDutyTypes(academicTypes)
    } catch (err) {
      setError('Ошибка при загрузке академических нарядов')
      console.error('Error fetching academic duty types:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToDepartment = async () => {
    if (!selectedDutyType) return

    try {
      setAddingLoading(true)
      setError(null)
      
      await api.post('/duty-types/department', {
        name: selectedDutyType.name,
        description: selectedDutyType.description,
        people_per_day: selectedDutyType.people_per_day,
        duty_category: selectedDutyType.duty_category,
        department_id: departmentId
      })
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении наряда в подразделение')
    } finally {
      setAddingLoading(false)
    }
  }

  const handleClose = () => {
    if (!addingLoading) {
      setSelectedDutyType(null)
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Выберите академический наряд
            </h3>
            <button
              onClick={handleClose}
              disabled={addingLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Список академических нарядов */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              {error}
            </div>
          ) : academicDutyTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет доступных академических нарядов</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {academicDutyTypes.map((dutyType) => (
                <div
                  key={dutyType.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedDutyType?.id === dutyType.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDutyType(dutyType)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{dutyType.name}</h4>
                      {dutyType.description && (
                        <p className="text-sm text-gray-500 mt-1">{dutyType.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Академический
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {dutyType.people_per_day} чел/сут
                        </span>
                      </div>
                    </div>
                    {selectedDutyType?.id === dutyType.id && (
                      <CheckIcon className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mt-4">
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={addingLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleAddToDepartment}
              disabled={!selectedDutyType || addingLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {addingLoading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AcademicDutyTypeModal 