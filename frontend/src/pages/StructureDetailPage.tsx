import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BuildingOfficeIcon, UserGroupIcon, ArrowLeftIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'
import AddDepartmentModal from '../components/AddDepartmentModal'

interface Department {
  id: number
  name: string
  description: string | null
}

interface Structure {
  id: number
  name: string
  description: string | null
}

const StructureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [structure, setStructure] = useState<Structure | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleEditClick = (department: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Добавить модальное окно редактирования
    console.log('Edit department:', department)
  }

  useEffect(() => {
    if (id) {
      fetchStructureAndDepartments()
    }
  }, [id])

  const fetchStructureAndDepartments = async () => {
    try {
      setLoading(true)
      const [structureResponse, departmentsResponse] = await Promise.all([
        api.get(`/departments/${id}`),
        api.get(`/departments/${id}/subdepartments`)
      ])
      setStructure(structureResponse.data)
      setDepartments(departmentsResponse.data)
    } catch (err) {
      setError('Ошибка при загрузке данных структуры')
      console.error('Error fetching structure data:', err)
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

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">{error}</div>
        <button
          onClick={fetchStructureAndDepartments}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="text-center">
        <div className="text-red-600 text-lg">Структура не найдена</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Заголовок */}
      <div className="mb-8">
        <Link
          to="/departments"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Назад к структурам
        </Link>
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{structure.name}</h1>
            <p className="text-gray-600">{structure.description}</p>
          </div>
        </div>
      </div>

      {/* Подразделения */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Подразделения</h2>
            <p className="text-sm text-gray-600">Список подразделений в структуре {structure.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-2" />
            Добавить подразделение
          </button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {departments.map((department) => (
            <div key={department.id} className="px-6 py-4 hover:bg-gray-50">
              <Link
                to={`/departments/${structure.id}/subdepartments/${department.id}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-600">{department.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleEditClick(department, e)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Редактировать подразделение"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <div className="text-indigo-600 hover:text-indigo-900">
                    Просмотр сотрудников →
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно добавления подразделения */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false)
          fetchStructure()
        }}
        parentId={structure?.id}
      />
    </div>
  )
}

export default StructureDetailPage 