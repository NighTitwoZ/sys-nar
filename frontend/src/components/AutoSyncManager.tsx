import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

interface AutoSyncManagerProps {
  onSyncComplete?: () => void
}

const AutoSyncManager: React.FC<AutoSyncManagerProps> = ({ onSyncComplete }) => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Проверяем, была ли уже выполнена синхронизация сегодня
  useEffect(() => {
    const today = new Date().toDateString()
    const lastSync = localStorage.getItem('lastAutoSyncDate')
    
    if (lastSync === today) {
      setIsAutoSyncEnabled(true)
      const lastSyncTimeStr = localStorage.getItem('lastAutoSyncTime')
      if (lastSyncTimeStr) {
        setLastSyncTime(new Date(lastSyncTimeStr))
      }
    }
  }, [])

  const handleManualSync = async () => {
    try {
      setIsSyncing(true)
      setError(null)
      
      const response = await api.post('/sync-all-employees')
      
      // Сохраняем время синхронизации
      const now = new Date()
      setLastSyncTime(now)
      localStorage.setItem('lastAutoSyncDate', now.toDateString())
      localStorage.setItem('lastAutoSyncTime', now.toISOString())
      
      console.log('Автоматическая синхронизация выполнена:', response.data)
      
      if (onSyncComplete) {
        onSyncComplete()
      }
      
    } catch (err: any) {
      console.error('Ошибка при автоматической синхронизации:', err)
      setError(err.response?.data?.detail || 'Ошибка при синхронизации')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleToggleAutoSync = () => {
    if (isAutoSyncEnabled) {
      // Отключаем автоматическую синхронизацию
      setIsAutoSyncEnabled(false)
      localStorage.removeItem('lastAutoSyncDate')
      localStorage.removeItem('lastAutoSyncTime')
      setLastSyncTime(null)
    } else {
      // Включаем автоматическую синхронизацию
      setIsAutoSyncEnabled(true)
      handleManualSync()
    }
  }

  const formatLastSyncTime = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Автоматическая синхронизация статусов
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Автоматически обновляет статусы сотрудников на основе их расписаний
          </p>
          {lastSyncTime && (
            <p className="text-xs text-gray-400 mt-1">
              Последняя синхронизация: {formatLastSyncTime(lastSyncTime)}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}
          
          <button
            onClick={handleToggleAutoSync}
            disabled={isSyncing}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isAutoSyncEnabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSyncing ? 'Синхронизация...' : 
             isAutoSyncEnabled ? 'Отключить автосинхронизацию' : 'Включить автосинхронизацию'}
          </button>
          
          {isAutoSyncEnabled && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AutoSyncManager 