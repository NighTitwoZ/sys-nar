import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Department {
  id: number
  name: string
  description: string | null
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string | null
  position: string
  department_id: number
  department: Department
}

interface EditEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  employee: Employee | null
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee
}) => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [position, setPosition] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  useEffect(() => {
    if (employee) {
      setFirstName(employee.first_name)
      setLastName(employee.last_name)
      setMiddleName(employee.middle_name || '')
      setPosition(employee.position)
      setSelectedDepartmentId(employee.department_id)
    }
  }, [employee])

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments')
      setDepartments(response.data)
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!employee) return
    
    if (!firstName.trim() || !lastName.trim() || !position.trim() || !selectedDepartmentId) {
      setError('Пожалуйста, заполните все обязательные поля')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await api.put(`/employees/${employee.id}`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        position: position.trim(),
        department_id: selectedDepartmentId
      })
      
      // Закрытие модального окна и обновление списка
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении сотрудника')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  if (!isOpen || !employee) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Редактировать сотрудника
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
              {/* Фамилия */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Фамилия *
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите фамилию"
                  disabled={loading}
                />
              </div>

              {/* Имя */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Имя *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите имя"
                  disabled={loading}
                />
              </div>

              {/* Отчество */}
              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                  Отчество
                </label>
                <input
                  type="text"
                  id="middleName"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите отчество (необязательно)"
                  disabled={loading}
                />
              </div>

              {/* Должность */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Должность *
                </label>
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Введите должность"
                  disabled={loading}
                />
              </div>

              {/* Подразделение */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Подразделение *
                </label>
                <select
                  id="department"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                >
                  <option value={0}>Выберите подразделение</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

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
                      Сохранение...
                    </div>
                  ) : (
                    'Сохранить'
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

export default EditEmployeeModal 