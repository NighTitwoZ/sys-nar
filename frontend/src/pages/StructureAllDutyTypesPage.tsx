import React, { useState, useEffect } from 'react'
import { ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import { useNavigate, useParams } from 'react-router-dom'

interface DutyTypeWithDepartment {
  id: number
  name: string
  description: string | null
  duty_category: string
  people_per_day: number
  department_name: string
}

interface Department {
  id: number
  name: string
  description: string | null
}

const StructureAllDutyTypesPage: React.FC = () => {
  const [dutyTypes, setDutyTypes] = useState<DutyTypeWithDepartment[]>([])
  const [allDutyTypes, setAllDutyTypes] = useState<DutyTypeWithDepartment[]>([])
  const [structure, setStructure] = useState<Department | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { structureId } = useParams<{ structureId: string }>()

  useEffect(() => {
    if (structureId) {
      fetchStructureAndDutyTypes()
    }
  }, [structureId])

  const fetchStructureAndDutyTypes = async () => {
    try {
      setLoading(true)
      
      // Получаем информацию о структуре
      const structureResponse = await api.get(`/departments/${structureId}`)
      setStructure(structureResponse.data)
      
      // Получаем подразделения структуры
      const departmentsResponse = await api.get(`/departments/${structureId}/subdepartments`)
      setDepartments(departmentsResponse.data)
      
      // Получаем все типы нарядов структуры
      const dutyTypesResponse = await api.get(`/duty-types/structure/${structureId}/all`)
      setAllDutyTypes(dutyTypesResponse.data)
      setDutyTypes(dutyTypesResponse.data)
      
      setError(null)
    } catch (err) {
      setError('Ошибка при загрузке типов нарядов')
      console.error('Error fetching duty types:', err)
    } finally {
      setLoading(false)
    }
  }

  // Функция фильтрации по подразделению
  const filterByDepartment = (departmentId: string) => {
    setSelectedDepartment(departmentId)
    if (departmentId === 'all') {
      setDutyTypes(allDutyTypes)
    } else {
      const filtered = allDutyTypes.filter(dutyType => 
        dutyType.department_name === departments.find(d => d.id.toString() === departmentId)?.name
      )
      setDutyTypes(filtered)
    }
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
          <ol className="flex items-center space-x-2">
            <li>
              <span className="text-sm font-medium text-indigo-600">Наряды</span>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <button
                onClick={() => navigate('/duty-structures')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Структуры
              </button>
            </li>
            <li className="text-gray-400">{'>'}</li>
            <li>
              <span className="text-sm font-medium text-gray-900">
                {structure?.name}
              </span>
            </li>
          </ol>
        </nav>

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
              Все наряды - {structure?.name}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Список всех типов нарядов в структуре {structure?.name}
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

        {/* Фильтр по подразделениям */}
        <div className="mt-6 mb-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="department-filter" className="text-sm font-medium text-gray-700">
              Фильтр по подразделению:
            </label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => filterByDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все подразделения</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id.toString()}>
                  {department.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              Показано: {dutyTypes.length} из {allDutyTypes.length}
            </span>
          </div>
        </div>

        {/* Таблица */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Название наряда - Подразделение
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Описание
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Вид наряда
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Человек/сутки
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dutyTypes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          В этой структуре нет типов нарядов
                        </td>
                      </tr>
                    ) : (
                      dutyTypes.map((dutyType) => (
                        <tr key={`${dutyType.id}-${dutyType.department_name}`}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div>
                              <div className="font-semibold">{dutyType.name}</div>
                              <div className="text-gray-500 text-xs">— {dutyType.department_name}</div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {dutyType.description || '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              dutyType.duty_category === 'academic' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {dutyType.duty_category === 'academic' ? 'Академический' : 'По подразделению'}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                              {dutyType.people_per_day}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StructureAllDutyTypesPage 