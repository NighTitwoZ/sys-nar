import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BuildingOfficeIcon, 
  ChevronRightIcon,
  PlusIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Structure {
  id: number
  name: string
  description: string
  employee_statuses?: { [key: string]: number }  // статус -> количество
  employees_count?: number
  duty_types_count?: number
  people_per_day_total?: number
}

const PersonnelExpensePage: React.FC = () => {
  const [structures, setStructures] = useState<Structure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStructures()
  }, [])

  const fetchStructures = async () => {
    try {
      setLoading(true)
      const response = await api.get('/departments/with-stats')
      setStructures(response.data)
    } catch (err) {
      setError('Ошибка загрузки структур')
      console.error('Error fetching structures:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'НЛ', label: 'НЛ', color: 'bg-green-100 text-green-800' },
    { value: 'Б', label: 'Б', color: 'bg-red-100 text-red-800' },
    { value: 'К', label: 'К', color: 'bg-blue-100 text-blue-800' },
    { value: 'НВ', label: 'НВ', color: 'bg-purple-100 text-purple-800' },
    { value: 'НГ', label: 'НГ', color: 'bg-orange-100 text-orange-800' },
    { value: 'О', label: 'О', color: 'bg-yellow-100 text-yellow-800' },
  ]

  const renderStatusBadges = (statuses: { [key: string]: number } | undefined) => {
    if (!statuses) return null
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {statusOptions.map((status) => {
          const count = statuses[status.value] || 0
          if (count === 0) return null
          
          return (
            <span
              key={status.value}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
            >
              {status.label}: {count}
            </span>
          )
        })}
      </div>
    )
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
            <h1 className="text-2xl font-semibold text-gray-900">Расход личного состава</h1>
            <p className="mt-2 text-sm text-gray-700">
              Выберите структуру для просмотра подразделений и сотрудников
            </p>
          </div>
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mt-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Расход личного состава</span>
              </div>
            </li>
          </ol>
        </nav>

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

        {/* Список структур */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {structures.map((structure) => (
                <li key={structure.id}>
                  <Link
                    to={`/personnel-expense/${structure.id}/subdepartments`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {structure.name}
                            </p>
                            {structure.description && (
                              <p className="text-sm text-gray-500">
                                {structure.description}
                              </p>
                            )}
                            {renderStatusBadges(structure.employee_statuses)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Пустое состояние */}
        {structures.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Структуры не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              Начните с создания первой структуры.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonnelExpensePage 