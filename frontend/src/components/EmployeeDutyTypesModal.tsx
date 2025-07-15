import React, { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface DutyType {
  id: number
  name: string
  description: string | null
}

interface EmployeeDutyType {
  id: number
  employee_id: number
  duty_type_id: number
  duty_type: DutyType
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string | null
  position: string
}

interface EmployeeDutyTypesModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
}

const EmployeeDutyTypesModal: React.FC<EmployeeDutyTypesModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [employeeDutyTypes, setEmployeeDutyTypes] = useState<EmployeeDutyType[]>([])
  const [selectedDutyTypeId, setSelectedDutyTypeId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && employee) {
      fetchDutyTypes()
      fetchEmployeeDutyTypes()
    }
  }, [isOpen, employee])

  const fetchDutyTypes = async () => {
    try {
      const response = await api.get('/duty-types')
      setDutyTypes(response.data)
    } catch (err) {
      console.error('Error fetching duty types:', err)
    }
  }

  const fetchEmployeeDutyTypes = async () => {
    if (!employee) return
    
    try {
      const response = await api.get(`/employees/${employee.id}/duty-types`)
      setEmployeeDutyTypes(response.data)
    } catch (err) {
      console.error('Error fetching employee duty types:', err)
    }
  }

  const handleAddDutyType = async () => {
    if (!employee || !selectedDutyTypeId) return

    try {
      setLoading(true)
      setError(null)
      
      await api.post(`/employees/${employee.id}/duty-types`, {
        duty_type_id: selectedDutyTypeId
      })
      
      fetchEmployeeDutyTypes()
      setSelectedDutyTypeId(0)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении типа наряда')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDutyType = async (employeeDutyTypeId: number) => {
    try {
      await api.delete(`/employee-duty-types/${employeeDutyTypeId}`)
      fetchEmployeeDutyTypes()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении типа наряда')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSelectedDutyTypeId(0)
      onClose()
    }
  }

  if (!isOpen || !employee) return null

  const availableDutyTypes = dutyTypes.filter(dutyType => 
    !employeeDutyTypes.some(edt => edt.duty_type_id === dutyType.id)
  )

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Типы нарядов сотрудника
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Информация о сотруднике */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Сотрудник:</strong> {employee.last_name} {employee.first_name} {employee.middle_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Должность:</strong> {employee.position}
            </p>
          </div>

          {/* Добавление типа наряда */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Добавить тип наряда</h4>
            <div className="flex space-x-2">
              <select
                value={selectedDutyTypeId}
                onChange={(e) => setSelectedDutyTypeId(Number(e.target.value))}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={loading || availableDutyTypes.length === 0}
              >
                <option value={0}>Выберите тип наряда</option>
                {availableDutyTypes.map((dutyType) => (
                  <option key={dutyType.id} value={dutyType.id}>
                    {dutyType.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddDutyType}
                disabled={loading || !selectedDutyTypeId || availableDutyTypes.length === 0}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Список типов нарядов */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Назначенные типы нарядов</h4>
            {employeeDutyTypes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Нет назначенных типов нарядов</p>
            ) : (
              <div className="space-y-2">
                {employeeDutyTypes.map((employeeDutyType) => (
                  <div
                    key={employeeDutyType.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm text-gray-700">
                      {employeeDutyType.duty_type.name}
                    </span>
                    <button
                      onClick={() => handleRemoveDutyType(employeeDutyType.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Удалить тип наряда"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          {/* Кнопка закрытия */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDutyTypesModal 