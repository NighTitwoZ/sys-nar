import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserGroupIcon, PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

interface Group {
  id: number
  name: string
  description: string | null
  department_id: number
  department_name: string
  employee_count: number
  created_at: string
  updated_at: string | null
}

interface Department {
  id: number
  name: string
  description: string | null
}

const DepartmentGroupsPage: React.FC = () => {
  const { structureId, departmentId } = useParams<{ structureId: string; departmentId: string }>()
  const [department, setDepartment] = useState<Department | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentData()
    }
  }, [departmentId])

  const fetchDepartmentData = async () => {
    try {
      setLoading(true)
      const [deptResponse, groupsResponse] = await Promise.all([
        api.get(`/departments/${departmentId}`),
        api.get(`/groups?department_id=${departmentId}`)
      ])
      setDepartment(deptResponse.data)
      setGroups(groupsResponse.data)
    } catch (err) {
      setError('Ошибка при загрузке данных подразделения')
      console.error('Error fetching department data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !department) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error || 'Подразделение не найдено'}</div>
        <button
          onClick={fetchDepartmentData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/departments')}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Главная
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={() => navigate(`/departments/${structureId}/subdepartments`)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Структуры
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <span className="text-sm font-medium text-gray-900">{department?.name}</span>
            </li>
          </ol>
        </nav>

        {/* Кнопки навигации */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад
          </button>
        </div>

        {/* Заголовок подразделения */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          {department.description && (
            <p className="mt-2 text-gray-600">{department.description}</p>
          )}
        </div>

        {/* Список групп */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold leading-6 text-gray-900">
              Группы подразделения
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Список всех групп в подразделении "{department.name}"
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {group.employee_count} сотрудников
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {/* The original code had Link to="/departments/${structureId}/${departmentId}/groups/${group.id}/employees" */}
                  {/* This will cause a routing error as Link is not imported. */}
                  {/* Assuming the intent was to navigate to the employees page. */}
                  <button
                    onClick={() => navigate(`/departments/${structureId}/${departmentId}/groups/${group.id}/employees`)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Просмотр сотрудников
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Нет групп</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом подразделении пока нет групп.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DepartmentGroupsPage 