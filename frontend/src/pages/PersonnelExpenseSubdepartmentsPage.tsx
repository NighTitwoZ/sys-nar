import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

interface Structure {
  id: number
  name: string
  description: string
}

interface Subdepartment {
  id: number
  name: string
  description: string
  employee_count: number
  employee_statuses?: { [key: string]: number }  // статус -> количество
  duty_types_count?: number
  people_per_day_total?: number
}

const PersonnelExpenseSubdepartmentsPage: React.FC = () => {
  const { structureId } = useParams<{ structureId: string }>()
  const navigate = useNavigate()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [subdepartments, setSubdepartments] = useState<Subdepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (structureId) {
      fetchStructure()
      fetchSubdepartments()
    }
  }, [structureId])

  const fetchStructure = async () => {
    try {
      const response = await api.get(`/departments/${structureId}`)
      setStructure(response.data)
    } catch (err) {
      setError('Ошибка загрузки структуры')
      console.error('Error fetching structure:', err)
    }
  }

  const fetchSubdepartments = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/departments/${structureId}/subdepartments-with-stats`)
      setSubdepartments(response.data)
    } catch (err) {
      setError('Ошибка загрузки подразделений')
      console.error('Error fetching subdepartments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    navigate('/personnel-expense')
  }

  const renderStatusBadges = (statuses: { [key: string]: number } | undefined) => {
    if (!statuses) return null
    
    const statusOptions = [
      { value: 'НЛ', label: 'НЛ', color: 'bg-green-100 text-green-800' },
      { value: 'Б', label: 'Б', color: 'bg-red-100 text-red-800' },
      { value: 'К', label: 'К', color: 'bg-blue-100 text-blue-800' },
      { value: 'НВ', label: 'НВ', color: 'bg-purple-100 text-purple-800' },
      { value: 'НГ', label: 'НГ', color: 'bg-orange-100 text-orange-800' },
      { value: 'О', label: 'О', color: 'bg-yellow-100 text-yellow-800' },
    ]
    
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
            <h1 className="text-2xl font-semibold text-gray-900">
              {structure?.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Выберите подразделение для управления статусами сотрудников
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => navigate(`/personnel-expense/${structureId}/report`)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Строевая записка
            </button>
          </div>
        </div>

        {/* Хлебные крошки */}
        <Breadcrumbs 
          items={[
            { label: 'Расход личного состава', path: '/personnel-expense' },
            { label: structure?.name || 'Структура' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mt-4">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
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
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {subdepartments.map((subdepartment) => (
                <li key={subdepartment.id}>
                  <button
                    onClick={() => navigate(`/personnel-expense/${structureId}/subdepartments/${subdepartment.id}/groups`)}
                    className="block w-full text-left hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* BuildingOfficeIcon was removed from imports, so it's commented out */}
                          {/* <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" /> */}
                          <div>
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {subdepartment.name}
                            </p>
                            {subdepartment.description && (
                              <p className="text-sm text-gray-500">
                                {subdepartment.description}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Сотрудников: {subdepartment.employee_count}
                            </p>
                            {renderStatusBadges(subdepartment.employee_statuses)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Пустое состояние */}
        {subdepartments.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            {/* UserGroupIcon was removed from imports, so it's commented out */}
            {/* <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" /> */}
            <h3 className="mt-2 text-sm font-medium text-gray-900">Подразделения не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этой структуре пока нет подразделений.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonnelExpenseSubdepartmentsPage 