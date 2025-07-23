import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface AddDutyTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  departmentId?: number // ID подразделения, для которого создается тип наряда
  isAcademic?: boolean // Если true, создает академический наряд по умолчанию
}

const AddDutyTypeModal: React.FC<AddDutyTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentId,
  isAcademic = false
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [peoplePerDay, setPeoplePerDay] = useState(1)
  const [daysDuration, setDaysDuration] = useState(1)
  const [dutyCategory, setDutyCategory] = useState(isAcademic ? 'academic' : 'department')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setPeoplePerDay(value);
  };

  const handleDaysSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setDaysDuration(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Пожалуйста, введите название типа наряда')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Если указан departmentId, создаем тип наряда для подразделения
      if (departmentId) {
        await api.post('/duty-types/department', {
          name: name.trim(),
          description: description.trim() || null,
          people_per_day: peoplePerDay,
          days_duration: daysDuration,
          duty_category: 'department', // Для подразделений всегда используем 'department'
          department_id: departmentId
        })
      } else {
        // Иначе создаем обычный тип наряда
        await api.post('/duty-types', {
          name: name.trim(),
          description: description.trim() || null,
          people_per_day: peoplePerDay,
          days_duration: daysDuration,
          duty_category: dutyCategory
        })
      }
      
      // Сброс формы
      setName('')
      setDescription('')
      setPeoplePerDay(1)
      setDaysDuration(1)
      setDutyCategory('academic')
      
      // Закрытие модального окна и обновление списка
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании типа наряда')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setPeoplePerDay(1)
      setDaysDuration(1)
      setDutyCategory('academic')
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
              {departmentId ? 'Добавить тип наряда в подразделение' : 'Добавить тип наряда'}
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Название */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Название *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите название типа наряда"
                  disabled={loading}
                />
              </div>

              {/* Описание */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите описание типа наряда (необязательно)"
                  disabled={loading}
                />
              </div>

              {/* Количество человек в сутки */}
              <div>
                <label htmlFor="peoplePerDay" className="block text-sm font-medium text-gray-700">
                  Количество человек в сутки: {peoplePerDay} *
                </label>
                <input
                  type="range"
                  id="peoplePerDay"
                  value={peoplePerDay}
                  onChange={handleSliderChange}
                  min="1"
                  max="10"
                  step="1"
                  className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Сколько человек заступает в этот наряд в сутки
                </p>
              </div>

              {/* Сколько дней занимает наряд */}
              <div>
                <label htmlFor="daysDuration" className="block text-sm font-medium text-gray-700">
                  Сколько дней занимает наряд: {daysDuration} *
                </label>
                <input
                  type="range"
                  id="daysDuration"
                  value={daysDuration}
                  onChange={handleDaysSliderChange}
                  min="1"
                  max="3"
                  step="1"
                  className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Сколько дней подряд занимает этот наряд
                </p>
              </div>

              {/* Информация о назначении сотрудникам */}
              {departmentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    Тип наряда будет автоматически назначен всем сотрудникам подразделения. 
                    Если тип наряда с таким названием уже существует в системе, будет использован существующий.
                  </p>
                </div>
              )}

              {/* Ошибка */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* Кнопки */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Создание...
                    </div>
                  ) : (
                    'Создать'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddDutyTypeModal 