import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

interface Department {
  id: number
  name: string
  description: string | null
}

interface DutyDistribution {
  id: number
  duty_type_name: string
  date: string
  employee_name: string
  department_name: string
}

const DutyDistributionByDepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [distributionData, setDistributionData] = useState<DutyDistribution[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/departments')
      setDepartments(response.data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке подразделений')
      console.error('Error fetching departments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentClick = async (department: Department) => {
    try {
      setSelectedDepartment(department)
      const response = await api.get(`/duty-distribution/department/${department.id}`)
      setDistributionData(response.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Error fetching distribution data:', err)
      setError('Ошибка при загрузке данных распределения')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getUniqueDates = () => {
    const dates = [...new Set(distributionData.map(item => item.date))]
    return dates.sort()
  }

  const getEmployeesByDepartment = () => {
    const employees = [...new Set(distributionData.map(item => item.employee_name))]
    return employees.sort()
  }

  const getDutyForEmployeeAndDate = (employeeName: string, date: string) => {
    const duty = distributionData.find(
      item => item.employee_name === employeeName && item.date === date
    )
    return duty?.duty_type_name || ''
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
              Распределение нарядов по подразделениям
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Нажмите на подразделение для просмотра детальной таблицы распределения нарядов
            </p>
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

        {/* Список подразделений */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.id}
              onClick={() => handleDepartmentClick(department)}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {department.name}
                    </h3>
                    {department.description && (
                      <p className="text-sm text-gray-500">
                        {department.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    Нажмите для просмотра распределения нарядов
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно с детальной таблицей */}
        {showDetailModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Распределение нарядов: {selectedDepartment.name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-x-auto max-h-[calc(90vh-120px)]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сотрудник
                      </th>
                      {getUniqueDates().map((date) => (
                        <th key={date} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formatDate(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getEmployeesByDepartment().map((employee) => (
                      <tr key={employee}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee}
                        </td>
                        {getUniqueDates().map((date) => (
                          <td key={date} className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getDutyForEmployeeAndDate(employee, date) && (
                              <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                                {getDutyForEmployeeAndDate(employee, date)}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DutyDistributionByDepartmentPage 