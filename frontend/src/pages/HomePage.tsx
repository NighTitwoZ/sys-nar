import React from 'react'
import { Link } from 'react-router-dom'
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  const features = [
    {
      name: 'Управление подразделениями',
      description: 'Создавайте и управляйте подразделениями организации',
      icon: BuildingOfficeIcon,
      href: '/departments',
    },
    {
      name: 'Управление сотрудниками',
      description: 'Добавляйте сотрудников и назначайте им типы нарядов',
      icon: UserGroupIcon,
      href: '/departments',
    },
    {
      name: 'Распределение нарядов',
      description: 'Автоматическое распределение нарядов с учетом различных критериев',
      icon: CalendarIcon,
      href: '/duty-distribution',
    },
  ]

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Система распределения нарядов
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Эффективное управление нарядами сотрудников с автоматическим распределением 
            на основе различных критериев и справедливым учетом нагрузки.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/duty-distribution"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Распределить наряды
              <ArrowRightIcon className="ml-2 h-4 w-4 inline" />
            </Link>
            <Link
              to="/departments"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Управление подразделениями <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Функции системы */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Функции системы
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Все необходимое для управления нарядами
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Link
                      to={feature.href}
                      className="text-sm font-semibold leading-6 text-indigo-600"
                    >
                      Подробнее <span aria-hidden="true">→</span>
                    </Link>
                  </p>
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