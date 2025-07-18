import React, { useState } from 'react'
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface StatusDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  employee: {
    id: number
    first_name: string
    last_name: string
    middle_name: string
    position: string
    status: string
  } | null
}

interface StatusDetails {
  status: string
  start_date: string
  notes?: string
}

const StatusDetailsModal: React.FC<StatusDetailsModalProps> = ({ isOpen, onClose, employee }) => {
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusOptions = [
    { value: 'НЛ', label: 'НЛ', color: 'bg-green-100 text-green-800' },
    { value: 'Б', label: 'Б', color: 'bg-red-100 text-red-800' },
    { value: 'К', label: 'К', color: 'bg-blue-100 text-blue-800' },
    { value: 'НВ', label: 'НВ', color: 'bg-purple-100 text-purple-800' },
    { value: 'НГ', label: 'НГ', color: 'bg-orange-100 text-orange-800' },
    { value: 'О', label: 'О', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { title: string; description: string } } = {
      'НЛ': { title: 'На лицо', description: 'Сотрудник находится на рабочем месте' },
      'Б': { title: 'Больничный', description: 'Сотрудник находится на больничном листе' },
      'К': { title: 'Командировка', description: 'Сотрудник находится в командировке' },
      'НВ': { title: 'Не вышел', description: 'Сотрудник не вышел на работу' },
      'НГ': { title: 'Не готов', description: 'Сотрудник не готов к выполнению задач' },
      'О': { title: 'Отпуск', description: 'Сотрудник находится в отпуске' },
    }
    return statusMap[status] || { title: status, description: 'Статус не определен' }
  }

  const handleSave = async () => {
    if (!employee || !startDate) return

    try {
      setLoading(true)
      setError(null)
      
      // Здесь можно добавить API вызов для сохранения деталей статуса
      // await api.post(`/employees/${employee.id}/status-details`, {
      //   status: employee.status,
      //   start_date: startDate,
      //   notes: notes
      // })
      
      onClose()
    } catch (err) {
      setError('Ошибка при сохранении данных')
      console.error('Error saving status details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !employee) return null

  const statusInfo = getStatusInfo(employee.status)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Детали статуса сотрудника
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Информация о сотруднике */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-900">
              {employee.last_name} {employee.first_name} {employee.middle_name}
            </p>
            <p className="text-sm text-gray-600">{employee.position}</p>
          </div>

          {/* Текущий статус */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текущий статус
            </label>
            <div className="flex items-center space-x-2">
              {statusOptions.map((status) => (
                <span
                  key={status.value}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    employee.status === status.value
                      ? status.color
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {status.label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{statusInfo.title}</strong> - {statusInfo.description}
            </p>
          </div>

          {/* Дата начала статуса */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата начала статуса
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Примечания */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Примечания
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Дополнительная информация о статусе..."
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !startDate}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusDetailsModal 