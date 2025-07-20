import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronRightIcon,
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Structure {
  id: number
  name: string
  description: string
}

interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  position: string
  department_name: string
  status: string
  status_start_date?: string
  status_notes?: string
}

const PersonnelExpenseStructureEmployeesPage: React.FC = () => {
  const { structureId, status } = useParams<{ structureId: string; status: string }>()
  const navigate = useNavigate()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (structureId && status) {
      fetchStructure()
      fetchEmployees()
    }
  }, [structureId, status])

  const fetchStructure = async () => {
    try {
      const response = await api.get(`/departments/${structureId}`)
      setStructure(response.data)
    } catch (err) {
      setError('Ошибка загрузки структуры')
      console.error('Error fetching structure:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/employees/structure/${structureId}/status/${status}`)
      setEmployees(response.data)
    } catch (err) {
      setError('Ошибка загрузки сотрудников')
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'НЛ': 'На лицо',
      'Б': 'Болен',
      'К': 'Командировка',
      'НВ': 'Наряд внутренний',
      'НГ': 'Наряд гарнизонный',
      'О': 'Отпуск',
    }
    return statusMap[status] || status
  }

  const handleBackClick = () => {
    navigate(-1)
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
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/personnel-expense')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Расход личного состава
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <button
                  onClick={handleBackClick}
                  className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {structure?.name}
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-900">
                  Статус: {getStatusLabel(status || '')}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Кнопка назад */}
        <div className="mb-4">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Сотрудники со статусом "{getStatusLabel(status || '')}"
          </h1>
          <p className="mt-2 text-gray-600">
            {structure?.name} • Всего: {employees.length} сотрудников
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
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

        {/* Таблица сотрудников */}
        {employees.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Список сотрудников
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ФИО
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Подразделение
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата начала статуса
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Примечание
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.last_name} {employee.first_name} {employee.middle_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.status_start_date 
                          ? new Date(employee.status_start_date).toLocaleDateString('ru-RU')
                          : 'Не указана'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {employee.status_notes || 'Нет примечаний'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Сотрудники не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              Сотрудники со статусом "{getStatusLabel(status || '')}" не найдены в структуре {structure?.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonnelExpenseStructureEmployeesPage 