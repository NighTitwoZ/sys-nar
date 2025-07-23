  import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()

  const navigation = [
    { name: 'Главная', href: '/', icon: HomeIcon },
    { name: 'Наряды', href: '/duty-structures', icon: ClipboardDocumentListIcon },
    { name: 'Распределение нарядов', href: '/duty-distribution', icon: CalendarIcon },
  ]

  // Определяем текущий раздел
  const getCurrentSection = () => {
    if (location.pathname.startsWith('/duty-structures') || location.pathname.startsWith('/duty-distribution')) {
      return 'Система нарядов'
    } else if (location.pathname.startsWith('/personnel-expense')) {
      return 'Расход личного состава'
    } else if (location.pathname.startsWith('/departments')) {
      return 'Управление подразделениями'
    }
    return null
  }

  const currentSection = getCurrentSection()
  const isDutySystem = location.pathname.startsWith('/duty-structures') || location.pathname.startsWith('/duty-distribution')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Вкладка Главная */}
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                    location.pathname === '/'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <HomeIcon className="h-5 w-5" />
                </Link>
              </div>

              {/* Остальные вкладки навигации - только для Системы нарядов */}
              {isDutySystem && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.slice(1).map((item) => {
                      const isActive = item.href === '/' 
                        ? location.pathname === item.href
                        : location.pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                          isActive
                            ? 'border-indigo-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Заголовок раздела */}
      {currentSection && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentSection}
            </h1>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 