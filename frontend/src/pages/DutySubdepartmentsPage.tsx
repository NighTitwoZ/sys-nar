import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

interface Department {
  id: number
  name: string
  description: string | null
}

const DutySubdepartmentsPage: React.FC = () => {
  const [subdepartments, setSubdepartments] = useState<any[]>([])
  const [structure, setStructure] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { structureId } = useParams<{ structureId: string }>()

  const fetchStructureAndSubdepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Очищаем состояние перед загрузкой новых данных
      setStructure(null)
      setSubdepartments([])
      
      // Добавляем уникальный параметр времени для обхода кэширования
      const timestamp = Date.now()
      
      // Получаем информацию о структуре
      const structureResponse = await api.get(`/departments/${structureId}?_t=${timestamp}`)
      setStructure(structureResponse.data)
      
      // Получаем подразделения структуры с статистикой
      const subdepartmentsResponse = await api.get(`/departments/${structureId}/subdepartments-with-stats?_t=${timestamp}`)
      setSubdepartments(subdepartmentsResponse.data)
      
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке подразделений')
      console.error('Error fetching subdepartments:', err)
    } finally {
      setLoading(false)
    }
  }, [structureId])

  useEffect(() => {
    if (structureId) {
      fetchStructureAndSubdepartments()
    }
  }, [structureId, fetchStructureAndSubdepartments])

  // Принудительная перезагрузка данных при возврате на страницу
  useEffect(() => {
    const handleFocus = () => {
      if (structureId) {
        setTimeout(() => {
          fetchStructureAndSubdepartments()
        }, 100)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [structureId, fetchStructureAndSubdepartments])

  // Принудительная перезагрузка данных при изменении URL
  useEffect(() => {
    if (structureId) {
      fetchStructureAndSubdepartments()
    }
  }, [location.pathname, structureId, fetchStructureAndSubdepartments])

  const handleSubdepartmentClick = (subdepartment: Department) => {
    navigate(`/duty-structures/${structureId}/subdepartments/${subdepartment.id}/duty-types`)
  }

  const handleBackClick = () => {
    navigate('/duty-structures')
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
        <Breadcrumbs 
          items={[
            { label: 'Система нарядов', path: '/duty-structures' },
            { label: structure?.name || 'Структура' }
          ]} 
        />

        {/* Кнопка назад */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              {structure?.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Выберите подразделение для просмотра типов нарядов
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/duty-structures/${structureId}/all`)}
            className="block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Все наряды
          </button>
          <button
            type="button"
            onClick={() => navigate(`/duty-structures/${structureId}/employees`)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Просмотр сотрудников
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
              {subdepartments.length === 0 ? (
                <li className="px-6 py-4 text-center text-sm text-gray-500">
                  В этой структуре нет подразделений
                </li>
              ) : (
                subdepartments.map((subdepartment) => (
                  <li key={subdepartment.id}>
                    <button
                      onClick={() => handleSubdepartmentClick(subdepartment)}
                      className="w-full block hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                    >
                      <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {subdepartment.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subdepartment.name}
                            </div>
                            {subdepartment.description && (
                              <div className="text-sm text-gray-500">
                                {subdepartment.description}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                Нарядов: {subdepartment.duty_types_count}
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                Заступает в сутки: {subdepartment.people_per_day_total}
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                                Сотрудников: {subdepartment.employees_count}
                              </span>
                            </div>
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

export default DutySubdepartmentsPage 