import React, { useState } from 'react'
import { api } from '../services/api'
import { useEffect } from 'react';

interface DepartmentDistribution {
  department_id: number
  department_name: string
  duties: any[]
}

interface DutyRecord {
  id?: number;
  date: string;
  employee_name: string;
  department_id: number;
  department_name: string;
  duty_type_id: number;
  duty_type_name: string;
}

const DutyDistributionPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [distribution, setDistribution] = useState<DepartmentDistribution[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDistribution | null>(null)
  const [departmentDuties, setDepartmentDuties] = useState<DutyRecord[]>([])
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'departments' | 'duties'>('departments');
  const [dutyTypes, setDutyTypes] = useState<any[]>([]);
  const [selectedDutyType, setSelectedDutyType] = useState<any | null>(null);
  const [dutyTypeRecords, setDutyTypeRecords] = useState<any[]>([]);
  const [loadingDutyTypes, setLoadingDutyTypes] = useState(false);
  const [allDuties, setAllDuties] = useState<DutyRecord[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Новый useEffect для загрузки всех нарядов за месяц/год при монтировании и при смене года/месяца
  useEffect(() => {
    fetchAllDuties();
  }, [year, month]);

  const fetchAllDuties = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/duty-distribution/all?year=${year}&month=${month}`);
      // Сохраняем все наряды в отдельное состояние
      setAllDuties(response.data);
      // Группируем по подразделениям для distribution
      const grouped = groupByDepartment(response.data);
      setDistribution(grouped);
    } catch (err) {
      setError('Ошибка при загрузке нарядов');
      setDistribution([]);
      setAllDuties([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция группировки по подразделениям
  const groupByDepartment = (duties: DutyRecord[]) => {
    const map = new Map();
    duties.forEach(duty => {
      if (!map.has(duty.department_id)) {
        map.set(duty.department_id, {
          department_id: duty.department_id,
          department_name: duty.department_name,
          duties: []
        });
      }
      map.get(duty.department_id).duties.push(duty);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (activeTab === 'duties') {
      fetchDutyTypes();
    }
  }, [activeTab]);

  const fetchDutyTypes = async () => {
    setLoadingDutyTypes(true);
    try {
      const response = await api.get('/duty-types');
      setDutyTypes(response.data);
    } catch (err) {
      setDutyTypes([]);
    } finally {
      setLoadingDutyTypes(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setDistribution([])
    setSelectedDepartment(null)
    setShowModal(false)
    try {
      const response = await api.post('/duty-distribution/generate', { year, month })
      setDistribution(response.data)
    } catch (err) {
      setError('Ошибка при генерации нарядов')
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentClick = async (dept: DepartmentDistribution) => {
    setSelectedDepartment(dept)
    setShowModal(true)
    setDepartmentDuties([])
    try {
      const response = await api.get(`/duty-distribution/department/${dept.department_id}`)
      setDepartmentDuties(response.data)
    } catch (err) {
      setError('Ошибка при загрузке нарядов подразделения')
    }
  }

  const handleDutyTypeClick = async (dutyType: any) => {
    setSelectedDutyType(dutyType);
    setDutyTypeRecords([]);
    setLoadingDutyTypes(true);
    try {
      const response = await api.get(`/duty-distribution/duty-type/${dutyType.id}`);
      setDutyTypeRecords(response.data);
    } catch (err) {
      setDutyTypeRecords([]);
    } finally {
      setLoadingDutyTypes(false);
    }
  };

  const handleClearDuties = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/duty-distribution/clear?year=${year}&month=${month}`);
      setDistribution([]);
      setSelectedDepartment(null);
      setShowModal(false);
    } catch (err) {
      setError('Ошибка при очистке нарядов');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      let url = '';
      if (selectedDepartment) {
        url = `${API_BASE_URL}/duty-distribution/export/department/${selectedDepartment.department_id}?year=${year}&month=${month}`;
      } else {
        url = `${API_BASE_URL}/duty-distribution/export?year=${year}&month=${month}`;
      }
      const response = await fetch(url, {
        method: 'GET',
      });
      if (response.ok) {
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = selectedDepartment
          ? `department_${selectedDepartment.department_id}_duties_${year}_${month.toString().padStart(2, '0')}.xlsx`
          : `duty_distribution_${year}_${month.toString().padStart(2, '0')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
      } else {
        setError('Ошибка при скачивании файла');
      }
    } catch (err) {
      setError('Ошибка при скачивании файла');
    }
  };

  // --- Новый рендер таблицы ---
  const renderDutyTable = () => {
    if (!departmentDuties || departmentDuties.length === 0) {
      return <div className="p-6 text-gray-400 text-center">Нет нарядов</div>;
    }
    // Собираем уникальные даты и сотрудников
    const dates = Array.from(new Set(departmentDuties.map(d => d.date))).sort();
    const employees = Array.from(new Set(departmentDuties.map(d => d.employee_name))).sort();
    // Функция форматирования даты в формат ДД-ММ
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}`;
    };
    // Строим мапу: сотрудник -> дата -> тип наряда
    const dutyMap: Record<string, Record<string, string>> = {};
    for (const emp of employees) {
      dutyMap[emp] = {};
    }
    for (const duty of departmentDuties) {
      dutyMap[duty.employee_name][duty.date] = duty.duty_type_name;
    }
    return (
      <div className="overflow-x-auto max-h-[calc(90vh-120px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
              {dates.map(date => (
                <th key={date} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{formatDate(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{emp}</td>
                {dates.map(date => (
                  <td key={date} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {dutyMap[emp][date] ? (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                        {dutyMap[emp][date]}
                      </span>
                    ) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Новый рендер таблицы по типу наряда
  const renderDutyTypeTable = () => {
    if (!dutyTypeRecords || dutyTypeRecords.length === 0) {
      return <div className="p-6 text-gray-400 text-center">Нет нарядов для выбранного типа</div>;
    }
    // Сортируем по дате
    const sorted = [...dutyTypeRecords].sort((a, b) => a.date.localeCompare(b.date));
    // Формат даты
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}`;
    };
    return (
      <div className="overflow-x-auto max-h-[calc(90vh-120px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Подразделение</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((rec, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(rec.date)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rec.employee_name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rec.department_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Распределение нарядов</h1>
            <p className="mt-2 text-sm text-gray-700">
              Сгенерируйте наряды на выбранный месяц и выберите подразделение или тип наряда для просмотра деталей
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 mb-6">
          <label className="text-sm">Год:
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded"
              min={2020}
              max={2100}
            />
          </label>
          <label className="text-sm">Месяц:
            <input
              type="number"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded"
              min={1}
              max={12}
            />
          </label>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Генерация...' : 'Сгенерировать наряды'}
          </button>
          <button
            onClick={handleClearDuties}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Очистить наряды за месяц
          </button>
        </div>
        {/* Вкладки */}
        <div className="mb-6 flex border-b">
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${activeTab === 'departments' ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('departments')}
          >
            По подразделениям
          </button>
          <button
            className={`ml-4 px-4 py-2 -mb-px border-b-2 ${activeTab === 'duties' ? 'border-indigo-600 text-indigo-700 font-semibold' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('duties')}
          >
            По нарядам
          </button>
        </div>
        {/* Содержимое вкладок */}
        {activeTab === 'departments' && (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
            )}
            {distribution.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {distribution.map(dept => (
                  <div
                    key={dept.department_id}
                    onClick={() => handleDepartmentClick(dept)}
                    className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{dept.department_name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Нарядов: {dept.duties.length}</p>
                      </div>
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {dept.duties.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Модальное окно с таблицей нарядов подразделения */}
            {showModal && selectedDepartment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Наряды подразделения: {selectedDepartment?.department_name}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleDownloadExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Скачать Excel
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {renderDutyTable()}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'duties' && (
          <div className="mt-8">
            {loadingDutyTypes && <div className="text-center text-gray-500">Загрузка...</div>}
            {!loadingDutyTypes && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {dutyTypes.map(dt => (
                  <div
                    key={dt.id}
                    onClick={() => handleDutyTypeClick(dt)}
                    className={`bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow duration-200 ${selectedDutyType && selectedDutyType.id === dt.id ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{dt.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{dt.description || '—'}</p>
                      </div>
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {dt.people_per_day}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedDutyType && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedDutyType.name}</h2>
                {renderDutyTypeTable()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DutyDistributionPage 