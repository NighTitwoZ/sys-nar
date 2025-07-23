import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  const sections = [
    {
      name: 'Система нарядов',
      description: 'Комплексная система для управления нарядами сотрудников с автоматическим распределением на основе различных критериев. Включает управление структурами, подразделениями, типами нарядов и их распределением.',
      icon: ClipboardDocumentListIcon,
      href: '/duty-structures',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      iconColor: 'text-indigo-600'
    },
    {
      name: 'Расход личного состава',
      description: 'Система для учета и анализа расхода личного состава по подразделениям. Позволяет отслеживать численность сотрудников, их распределение по группам и подразделениям.',
      icon: UserGroupIcon,
      href: '/personnel-expense',
      color: 'bg-green-600 hover:bg-green-700',
      iconColor: 'text-green-600'
    },
    {
      name: 'Управление подразделениями',
      description: 'Система для управления структурой подразделений организации. Позволяет создавать, редактировать и удалять подразделения, а также управлять сотрудниками в них.',
      icon: BuildingOfficeIcon,
      href: '/departments',
      color: 'bg-purple-600 hover:bg-purple-700',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Системы управления
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Выберите нужный раздел для работы с системой управления организацией
          </p>
        </div>

        {/* Три большие кнопки */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sections.map((section) => (
            <Link
              key={section.name}
              to={section.href}
              className="group block h-full"
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 overflow-hidden h-full flex flex-col">
                {/* Иконка */}
                <div className="p-8 text-center flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 group-hover:bg-gray-50 transition-colors duration-300">
                    <section.icon className={`h-10 w-10 ${section.iconColor}`} />
                  </div>
                </div>

                {/* Контент */}
                <div className="px-8 pb-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {section.name}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed mb-6 flex-1">
                    {section.description}
                  </p>
                  
                  {/* Кнопка */}
                  <div className="text-center flex-shrink-0">
                    <div className={`inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold ${section.color} transition-colors duration-300`}>
                      Перейти к разделу
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage 