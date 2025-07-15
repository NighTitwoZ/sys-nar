import React, { useState, useEffect } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface Department {
  id: number
  name: string
  description: string | null
}

const DutyStructuresPage: React.FC = () => {
  const [structures, setStructures] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStructures()
  }, [])

  const fetchStructures = async () => {
    try {
      setLoading(true)
      const response = await api.get('/departments')
      setStructures(response.data)
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке структур')
      console.error('Error fetching structures:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStructureClick = (structure: Department) => {
    navigate(`/duty-structures/${structure.id}/subdepartments`)
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
            <h1 className="text-2xl font-semibold text-gray-900">Структуры</h1>
            <p className="mt-2 text-sm text-gray-700">
              Выберите структуру для просмотра подразделений и их типов нарядов
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => navigate('/duty-structures/all')}
              className="block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Все наряды
            </button>
          </div>
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mt-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Наряды</span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                <span className="ml-4 text-sm font-medium text-gray-900">Структуры</span>
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
              {structures.length === 0 ? (
                <li className="px-6 py-4 text-center text-sm text-gray-500">
                  Нет структур для отображения
                </li>
              ) : (
                structures.map((structure) => (
                  <li key={structure.id}>
                    <button
                      onClick={() => handleStructureClick(structure)}
                      className="w-full block hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                    >
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {structure.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {structure.name}
                            </div>
                            {structure.description && (
                              <div className="text-sm text-gray-500">
                                {structure.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DutyStructuresPage 