import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  status: string
}

interface Group {
  id: number
  name: string
  description: string | null
  department_id: number
  employee_count: number
}

interface TransferEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employee: Employee | null
  currentGroupId: number
  departmentId: number
}

const TransferEmployeeModal: React.FC<TransferEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  currentGroupId,
  departmentId
}) => {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && departmentId) {
      fetchGroups()
    }
  }, [isOpen, departmentId])

  const fetchGroups = async () => {
    try {
      const response = await api.get(`/groups?department_id=${departmentId}`)
      // Фильтруем текущую группу из списка
      const availableGroups = response.data.filter((group: Group) => group.id !== currentGroupId)
      setGroups(availableGroups)
    } catch (err) {
      console.error('Error fetching groups:', err)
      setError('Ошибка загрузки групп')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGroupId) {
      setError('Выберите группу для перевода')
      return
    }

    if (!employee) {
      setError('Сотрудник не выбран')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.patch(`/employees/${employee.id}/group`, {
        group_id: selectedGroupId
      })

      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при переводе сотрудника')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedGroupId(0)
      setError(null)
      onClose()
    }
  }

  if (!isOpen || !employee) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Перевести сотрудника</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Сотрудник: <span className="font-medium">{employee.last_name} {employee.first_name} {employee.middle_name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Должность: <span className="font-medium">{employee.position}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                Выберите группу *
              </label>
              <select
                id="group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              >
                <option value={0}>Выберите группу</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.employee_count} сотрудников)
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || !selectedGroupId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Перевод...' : 'Перевести'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TransferEmployeeModal 