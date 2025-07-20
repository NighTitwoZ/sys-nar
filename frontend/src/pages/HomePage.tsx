import React from 'react'
import { Link } from 'react-router-dom'
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  const systems = [
    {
      name: 'Система нарядов',
      description: 'Комплексная система для управления нарядами сотрудников с автоматическим распределением на основе различных критериев. Включает управление структурами, подразделениями, типами нарядов и их распределением.',
      icon: ClipboardDocumentListIcon,
      href: '/duty-structures',
      features: [
        'Управление структурами и подразделениями',
        'Создание и настройка типов нарядов',
        'Автоматическое распределение нарядов',
        'Просмотр сотрудников и их статусов',
        'Академические наряды'
      ]
    },
    {
      name: 'Расход личного состава',
      description: 'Система для учета и анализа расхода личного состава по подразделениям. Позволяет отслеживать численность сотрудников, их распределение по группам и подразделениям.',
      icon: UserGroupIcon,
      href: '/personnel-expense',
      features: [
        'Управление подразделениями и группами',
        'Учет сотрудников по подразделениям',
        'Анализ расхода личного состава',
        'Группировка сотрудников',
        'Статистика по структурам'
      ]
    }
  ]

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Системы управления
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Две основные системы для эффективного управления нарядами сотрудников 
            и учета расхода личного состава организации.
          </p>
        </div>
      </div>

      {/* Системы */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Доступные системы
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Выберите нужную систему
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {systems.map((system) => (
              <div key={system.name} className="flex flex-col bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-gray-900 mb-4">
                  <system.icon className="h-6 w-6 flex-none text-indigo-600" aria-hidden="true" />
                  {system.name}
                </dt>
                <dd className="flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto mb-6">{system.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Основные возможности:</h4>
                    <ul className="space-y-2">
                      {system.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-auto">
                    <Link
                      to={system.href}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Перейти к системе
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default HomePage 