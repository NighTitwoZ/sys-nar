import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { MILITARY_RANKS } from '../constants/ranks'

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  rank?: string
  group_id?: number
}

interface Group {
  id: number
  name: string
  description?: string
}

interface EditEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employee: Employee | null
  departmentId?: number
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  departmentId
}) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [position, setPosition] = useState('')
  const [rank, setRank] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name)
      setLastName(employee.last_name)
      setMiddleName(employee.middle_name)
      setPosition(employee.position)
      setRank(employee.rank || '')
      setSelectedGroupId(employee.group_id || null)
    }
  }, [employee])

  useEffect(() => {
    if (isOpen && departmentId) {
      fetchGroups()
    }
  }, [isOpen, departmentId])

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups for department:', departmentId)
      setGroupsLoaded(false)
      
      if (departmentId) {
        // Получаем группы подразделения
        const groupsResponse = await api.get(`/groups?department_id=${departmentId}`)
        console.log('Groups response:', groupsResponse.data)
        setGroups(groupsResponse.data)
        setGroupsLoaded(true)
      } else {
        console.log('No departmentId provided')
        setGroups([])
        setGroupsLoaded(true)
      }
    } catch (err: any) {
      console.error('Error fetching groups:', err)
      console.error('Error details:', err.response?.data)
      setError('Ошибка при загрузке групп')
      setGroupsLoaded(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim() || !position.trim()) {
      setError('Фамилия, имя и должность обязательны')
      return
    }

    if (!employee) {
      setError('Сотрудник не выбран')
      return
    }

    if (!departmentId) {
      setError('ID подразделения не указан')
      return
    }

    setLoading(true)
    setError(null)

    const updateData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim(),
      position: position.trim(),
      rank: rank.trim() || null,
      department_id: departmentId,
      group_id: selectedGroupId,
      status: employee.status // сохраняем текущий статус
    }

    console.log('Updating employee:', employee.id)
    console.log('Update data:', updateData)

    try {
      const response = await api.put(`/employees/${employee.id}`, updateData)
      console.log('Update response:', response.data)
      onSuccess()
    } catch (err: any) {
      console.error('Error updating employee:', err)
      console.error('Error status:', err.response?.status)
      console.error('Error data:', err.response?.data)
      console.error('Error message:', err.message)
      setError(err.response?.data?.detail || err.message || 'Ошибка при обновлении сотрудника')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setGroups([])
      setGroupsLoaded(false)
      onClose()
    }
  }

  if (!isOpen || !employee) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Изменить сотрудника</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите фамилию"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Имя *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите имя"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                Отчество
              </label>
              <input
                type="text"
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите отчество"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Должность *
              </label>
              <input
                type="text"
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите должность"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1">
                Звание
              </label>
              <select
                id="rank"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              >
                <option value="">Выберите звание</option>
                {MILITARY_RANKS.map((rankOption) => (
                  <option key={rankOption} value={rankOption}>
                    {rankOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                Группа
              </label>
              <select
                id="group"
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading || !groupsLoaded}
              >
                {!groupsLoaded ? (
                  <option value="">Загрузка групп...</option>
                ) : (
                  <>
                    <option value="">Без группы</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </>
                )}
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
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditEmployeeModal 