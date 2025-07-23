import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DateRangePicker from '../components/DateRangePicker';

interface Department {
  id: number;
  name: string;
  description?: string | null;
}

interface DepartmentDistribution {
  department_id: number;
  department_name: string;
  duties: any[];
}

interface DutyRecord {
  id?: number;
  date: string;
  employee_name: string;
  department_id: number;
  department_name: string;
  duty_type_id: number;
  duty_type_name: string;
  people_per_day?: number;
  duty_count?: number;  // Добавляем duty_count
}

const DutyDistributionPage: React.FC = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distribution, setDistribution] = useState<DepartmentDistribution[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDistribution | null>(null);
  const [departmentDuties, setDepartmentDuties] = useState<DutyRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDutyTypeModal, setShowDutyTypeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'departments' | 'duties'>('departments');
  const [dutyTypes, setDutyTypes] = useState<any[]>([]);
  const [selectedDutyType, setSelectedDutyType] = useState<any | null>(null);
  const [dutyTypeRecords, setDutyTypeRecords] = useState<any[]>([]);
  const [loadingDutyTypes, setLoadingDutyTypes] = useState(false);
  const [allDuties, setAllDuties] = useState<DutyRecord[]>([]);

  // Новое состояние для структур и подразделений
  const [structures, setStructures] = useState<Department[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null);
  const [subdepartments, setSubdepartments] = useState<Department[]>([]);
  const [selectedSubdepartmentId, setSelectedSubdepartmentId] = useState<number | null>(null);
  const [subLoading, setSubLoading] = useState(false);

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

  useEffect(() => {
    fetchStructures();
  }, []);

  useEffect(() => {
    if (selectedStructureId) {
      fetchSubdepartments(selectedStructureId);
    } else {
      setSubdepartments([]);
      setSelectedSubdepartmentId(null);
    }
  }, [selectedStructureId]);

  const fetchStructures = async () => {
    try {
      const response = await api.get('/departments/with-stats');
      setStructures(response.data);
    } catch (err) {
      setStructures([]);
    }
  };

  const fetchSubdepartments = async (structureId: number) => {
    setSubLoading(true);
    try {
      const response = await api.get(`/departments/${structureId}/subdepartments-with-stats`);
      setSubdepartments(response.data);
    } catch (err) {
      setSubdepartments([]);
    } finally {
      setSubLoading(false);
    }
  };

  // Функция для форматирования даты в читаемый вид
  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}.${month}`;
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const handleGenerate = async () => {
    if (!dateRange.startDate || !dateRange.endDate || !selectedStructureId) {
      setError('Выберите период и структуру/подразделение');
      return;
    }

    setLoading(true);
    setError(null);
    setDistribution([]);
    setSelectedDepartment(null);
    setShowModal(false);
    
    try {
      // Создаем даты без учета времени, чтобы избежать проблем с часовым поясом
      const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const requestData: any = {
        start_date: formatDateForAPI(dateRange.startDate),
        end_date: formatDateForAPI(dateRange.endDate)
      };

      // Если выбрана конкретная структура и подразделение
      if (selectedSubdepartmentId) {
        requestData.department_id = selectedSubdepartmentId;
      } else {
        // Если выбрана только структура (без подразделения)
        requestData.structure_id = selectedStructureId;
      }

      const response = await api.post('/duty-distribution/generate', requestData);
      setDistribution(response.data);
    } catch (err) {
      setError('Ошибка при генерации нарядов');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentClick = async (dept: DepartmentDistribution) => {
    setSelectedDepartment(dept)
    setShowModal(true)
    
    // Получаем всех сотрудников подразделения
    try {
      const response = await api.get(`/employees/department/${dept.department_id}`)
      const allEmployees = response.data
      
      // Создаем массив всех сотрудников с их duty_count и group_id
      const employeesWithDuties = allEmployees.map((emp: any) => ({
        employee_name: `${emp.last_name} ${emp.first_name}`,
        duty_count: emp.duty_count || 0,
        department_id: emp.department_id,
        group_id: emp.group_id || null,
        group_name: emp.group?.name || 'Без группы'
      }))
      
      // Используем данные из сгенерированного распределения, но добавляем всех сотрудников
      setDepartmentDuties(dept.duties)
      
      // Сохраняем всех сотрудников для отображения
      setAllEmployees(employeesWithDuties)
    } catch (err) {
      console.error('Ошибка при загрузке сотрудников:', err)
      // Если не удалось загрузить сотрудников, используем только тех, у кого есть наряды
      setDepartmentDuties(dept.duties)
      setAllEmployees([])
    }
  }

  const handleDepartmentDutyTypeClick = async (dept: DepartmentDistribution) => {
    setSelectedDepartment(dept)
    setShowDutyTypeModal(true)
    
    // Получаем всех сотрудников подразделения
    try {
      const response = await api.get(`/employees/department/${dept.department_id}`)
      const allEmployees = response.data
      
      // Создаем массив всех сотрудников с их duty_count и group_id
      const employeesWithDuties = allEmployees.map((emp: any) => ({
        employee_name: `${emp.last_name} ${emp.first_name}`,
        duty_count: emp.duty_count || 0,
        department_id: emp.department_id,
        group_id: emp.group_id || null,
        group_name: emp.group?.name || 'Без группы'
      }))
      
      // Используем данные из сгенерированного распределения, но добавляем всех сотрудников
      setDepartmentDuties(dept.duties)
      
      // Сохраняем всех сотрудников для отображения
      setAllEmployees(employeesWithDuties)
    } catch (err) {
      console.error('Ошибка при загрузке сотрудников:', err)
      // Если не удалось загрузить сотрудников, используем только тех, у кого есть наряды
      setDepartmentDuties(dept.duties)
      setAllEmployees([])
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
    if (!dateRange.startDate || !dateRange.endDate || !selectedStructureId) {
      setError('Выберите период и структуру/подразделение');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Создаем даты без учета времени, чтобы избежать проблем с часовым поясом
      const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const requestData: any = {
        start_date: formatDateForAPI(dateRange.startDate),
        end_date: formatDateForAPI(dateRange.endDate)
      };

      // Если выбрана конкретная структура и подразделение
      if (selectedSubdepartmentId) {
        requestData.department_id = selectedSubdepartmentId;
      } else {
        // Если выбрана только структура (без подразделения)
        requestData.structure_id = selectedStructureId;
      }

      await api.delete('/duty-distribution/clear', { data: requestData });
      setDistribution([]);
      setSelectedDepartment(null);
      setShowModal(false);
      // Обновляем список всех нарядов
      await fetchAllDuties();
    } catch (err) {
      setError('Ошибка при очистке нарядов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartmentDuties = async () => {
    if (!selectedDepartment) {
      setError('Ошибка: не выбрано подразделение');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Используем год и месяц для определения периода
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const requestData = {
        start_date: startDate,
        end_date: endDate,
        department_id: selectedDepartment.department_id
      };

      await api.delete('/duty-distribution/clear', { data: requestData });
      setShowModal(false);
      setSelectedDepartment(null);
      // Обновляем список всех нарядов
      await fetchAllDuties();
    } catch (err) {
      setError('Ошибка при удалении нарядов подразделения');
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

  // Функция для скачивания второй таблицы (по датам и типам нарядов)
  const handleDownloadDutyTypeExcel = async () => {
    try {
      if (!selectedDepartment || !departmentDuties || departmentDuties.length === 0) {
        setError('Нет данных для экспорта');
        return;
      }

      // Используем тот же API endpoint что и для первой таблицы, но с дополнительным параметром
      const url = `${API_BASE_URL}/duty-distribution/export/department/${selectedDepartment.department_id}?year=${year}&month=${month}&format=duty_types`;
      
      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `department_${selectedDepartment.department_id}_duty_types_${year}_${month.toString().padStart(2, '0')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
      } else {
        // Если API не поддерживает новый формат, создаем Excel на фронтенде
        await createDutyTypeExcelFrontend();
      }
    } catch (err) {
      // Если API недоступен, создаем Excel на фронтенде
      await createDutyTypeExcelFrontend();
    }
  };

  // Функция создания Excel файла на фронтенде (fallback)
  const createDutyTypeExcelFrontend = async () => {
    try {
      // Собираем данные для второй таблицы
      const dates = Array.from(new Set(departmentDuties.map(d => d.date))).sort();
      const dutyTypes = Array.from(new Set(departmentDuties.map(d => d.duty_type_name))).sort();
      
      // Строим мапу: дата -> тип наряда -> сотрудники
      const dutyMap: Record<string, Record<string, string[]>> = {};
      
      for (const date of dates) {
        dutyMap[date] = {};
        for (const dutyType of dutyTypes) {
          dutyMap[date][dutyType] = [];
        }
      }
      
      // Заполняем данные
      for (const duty of departmentDuties) {
        if (!dutyMap[duty.date][duty.duty_type_name]) {
          dutyMap[duty.date][duty.duty_type_name] = [];
        }
        dutyMap[duty.date][duty.duty_type_name].push(duty.employee_name);
      }

      // Создаем данные для Excel
      const excelData = [];
      
      // Заголовки
      const headers = ['Дата', ...dutyTypes];
      excelData.push(headers);
      
      // Данные
      for (const date of dates) {
        const row = [date];
        for (const dutyType of dutyTypes) {
          const employees = dutyMap[date][dutyType];
          row.push(employees && employees.length > 0 ? employees.join(', ') : '—');
        }
        excelData.push(row);
      }

      // Создаем Excel файл используя библиотеку SheetJS (если доступна)
      // Или создаем CSV с расширением .xlsx (простой fallback)
      let csvContent = '\uFEFF'; // BOM для корректного отображения кириллицы
      excelData.forEach(row => {
        const csvRow = row.map(cell => `"${cell}"`).join(',');
        csvContent += csvRow + '\n';
      });

      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `department_${selectedDepartment.department_id}_duty_types_${year}_${month.toString().padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    } catch (err) {
      setError('Ошибка при создании Excel файла');
    }
  };

  // --- Новый рендер таблицы ---
  const renderDutyTable = () => {
    if (!departmentDuties || departmentDuties.length === 0) {
      return <div className="p-6 text-gray-400 text-center">Нет нарядов</div>;
    }
    
    // Собираем уникальные даты
    const dates = Array.from(new Set(departmentDuties.map(d => d.date))).sort();
    
    // Используем всех сотрудников подразделения, если они загружены
    const employees = allEmployees.length > 0 
      ? allEmployees.map(emp => emp.employee_name)
      : Array.from(new Set(departmentDuties.map(d => d.employee_name))).sort();
    
    // Функция форматирования даты в формат ДД-ММ
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}`;
    };
    
    // Функция определения цвета на основе категории наряда
    const getDutyColor = (dutyTypeName: string) => {
      // Определяем категорию по названию наряда
      const name = dutyTypeName.toLowerCase();
      
      if (name.includes('академический')) {
        return 'bg-purple-100 text-purple-800 border-purple-200';
      } else {
        // Все остальные наряды (по подразделению)
        return 'bg-blue-100 text-blue-800 border-blue-200';
      }
    };

    // Функция получения цвета для Excel (RGB формат)
    const getDutyColorForExcel = (dutyTypeName: string) => {
      const name = dutyTypeName.toLowerCase();
      
      if (name.includes('академический')) {
        return { bg: 'E9D5FF', text: '7C3AED' }; // purple
      } else if (name.includes('дежурный') || name.includes('дежурство')) {
        return { bg: 'DBEAFE', text: '1D4ED8' }; // blue
      } else if (name.includes('патрульный') || name.includes('патруль')) {
        return { bg: 'D1FAE5', text: '047857' }; // green
      } else if (name.includes('караульный') || name.includes('караул')) {
        return { bg: 'FEE2E2', text: 'DC2626' }; // red
      } else if (name.includes('конвойный') || name.includes('конвой')) {
        return { bg: 'FED7AA', text: 'EA580C' }; // orange
      } else if (name.includes('охранный') || name.includes('охрана')) {
        return { bg: 'FEF3C7', text: 'D97706' }; // yellow
      } else if (name.includes('инспектор')) {
        return { bg: 'E0E7FF', text: '3730A3' }; // indigo
      } else if (name.includes('комендант')) {
        return { bg: 'FCE7F3', text: 'BE185D' }; // pink
      } else {
        return { bg: 'F3F4F6', text: '374151' }; // gray
      }
    };
    
    // Строим мапу: сотрудник -> дата -> наряд (полная информация)
    const dutyMap: Record<string, Record<string, any>> = {};
    // Считаем количество нарядов для каждого сотрудника в выбранном периоде
    const employeeDutyCountsInPeriod: Record<string, number> = {};
    // Словарь для хранения duty_count каждого сотрудника
    const employeeDutyCounts: Record<string, number> = {};
    
    for (const emp of employees) {
      dutyMap[emp] = {};
      employeeDutyCountsInPeriod[emp] = 0;
      employeeDutyCounts[emp] = 0;
    }
    
    // Заполняем данные из нарядов
    for (const duty of departmentDuties) {
      dutyMap[duty.employee_name][duty.date] = duty;
      employeeDutyCountsInPeriod[duty.employee_name]++;
      // Сохраняем duty_count сотрудника
      if (duty.duty_count !== undefined) {
        employeeDutyCounts[duty.employee_name] = duty.duty_count;
      }
    }
    
    // Заполняем duty_count из всех сотрудников
    for (const emp of allEmployees) {
      if (emp.employee_name in employeeDutyCounts) {
        employeeDutyCounts[emp.employee_name] = emp.duty_count;
      }
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нарядов до</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нарядов в выбранном периоде</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Общее количество нарядов</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{emp}</td>
                {dates.map(date => (
                  <td key={date} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {dutyMap[emp][date] ? (
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getDutyColor(dutyMap[emp][date].duty_type_name)}`}>
                        {dutyMap[emp][date].duty_type_name}
                      </span>
                    ) : ''}
                  </td>
                ))}
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                    {employeeDutyCounts[emp]}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                    {employeeDutyCountsInPeriod[emp]}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                    {employeeDutyCountsInPeriod[emp] + employeeDutyCounts[emp]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Рендер таблицы по типу наряда (для вкладки "По нарядам")
  const renderDutyTypeRecordsTable = () => {
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

  // Функция рендеринга таблицы по датам и типам нарядов
  const renderDutyTypeTable = () => {
    if (!departmentDuties || departmentDuties.length === 0) {
      return <div className="p-6 text-gray-400 text-center">Нет нарядов</div>;
    }
    
    // Собираем уникальные даты и типы нарядов
    const dates = Array.from(new Set(departmentDuties.map(d => d.date))).sort();
    const dutyTypes = Array.from(new Set(departmentDuties.map(d => d.duty_type_name))).sort();
    
    // Используем всех сотрудников подразделения, если они загружены
    const employees = allEmployees.length > 0 
      ? allEmployees.map(emp => emp.employee_name)
      : Array.from(new Set(departmentDuties.map(d => d.employee_name))).sort();
    
    // Функция форматирования даты в формат ДД-ММ
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}-${month}`;
    };
    
    // Функция определения цвета на основе группы сотрудника
    const getGroupColor = (groupId: number | null, groupName: string) => {
      if (!groupId) {
        return 'bg-gray-100 text-gray-800 border-gray-200'; // Без группы
      }
      
      // Используем groupId для определения цвета
      const colors = [
        'bg-red-100 text-red-800 border-red-200',      // 1 группа - красный
        'bg-blue-100 text-blue-800 border-blue-200',   // 2 группа - синий
        'bg-green-100 text-green-800 border-green-200', // 3 группа - зеленый
        'bg-yellow-100 text-yellow-800 border-yellow-200', // 4 группа - желтый
        'bg-purple-100 text-purple-800 border-purple-200', // 5 группа - фиолетовый
        'bg-pink-100 text-pink-800 border-pink-200',   // 6 группа - розовый
        'bg-indigo-100 text-indigo-800 border-indigo-200', // 7 группа - индиго
        'bg-orange-100 text-orange-800 border-orange-200', // 8 группа - оранжевый
        'bg-teal-100 text-teal-800 border-teal-200',   // 9 группа - бирюзовый
        'bg-cyan-100 text-cyan-800 border-cyan-200',   // 10 группа - голубой
      ];
      
      // Используем остаток от деления для циклического использования цветов
      const colorIndex = (groupId - 1) % colors.length;
      return colors[colorIndex];
    };

    // Функция получения цвета для Excel (RGB формат) на основе группы
    const getGroupColorForExcel = (groupId: number | null) => {
      if (!groupId) {
        return { bg: 'F3F4F6', text: '374151' }; // Без группы - серый
      }
      
      const colors = [
        { bg: 'FEE2E2', text: 'DC2626' }, // 1 группа - красный
        { bg: 'DBEAFE', text: '1D4ED8' }, // 2 группа - синий
        { bg: 'D1FAE5', text: '047857' }, // 3 группа - зеленый
        { bg: 'FEF3C7', text: 'D97706' }, // 4 группа - желтый
        { bg: 'E9D5FF', text: '7C3AED' }, // 5 группа - фиолетовый
        { bg: 'FCE7F3', text: 'BE185D' }, // 6 группа - розовый
        { bg: 'E0E7FF', text: '3730A3' }, // 7 группа - индиго
        { bg: 'FED7AA', text: 'EA580C' }, // 8 группа - оранжевый
        { bg: 'CCFBF1', text: '0F766E' }, // 9 группа - бирюзовый
        { bg: 'CFFAFE', text: '0891B2' }, // 10 группа - голубой
      ];
      
      const colorIndex = (groupId - 1) % colors.length;
      return colors[colorIndex];
    };

    // Функция определения цвета на основе категории наряда (оставляем для совместимости)
    const getDutyColor = (dutyTypeName: string) => {
      // Определяем цвет на основе названия наряда
      const name = dutyTypeName.toLowerCase();
      
      if (name.includes('академический')) {
        return 'bg-purple-100 text-purple-800 border-purple-200';
      } else if (name.includes('дежурный') || name.includes('дежурство')) {
        return 'bg-blue-100 text-blue-800 border-blue-200';
      } else if (name.includes('патрульный') || name.includes('патруль')) {
        return 'bg-green-100 text-green-800 border-green-200';
      } else if (name.includes('караульный') || name.includes('караул')) {
        return 'bg-red-100 text-red-800 border-red-200';
      } else if (name.includes('конвойный') || name.includes('конвой')) {
        return 'bg-orange-100 text-orange-800 border-orange-200';
      } else if (name.includes('охранный') || name.includes('охрана')) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      } else if (name.includes('инспектор')) {
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      } else if (name.includes('комендант')) {
        return 'bg-pink-100 text-pink-800 border-pink-200';
      } else {
        // По умолчанию для неизвестных типов
        return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };
    
    // Строим мапу: дата -> тип наряда -> сотрудники
    const dutyMap: Record<string, Record<string, string[]>> = {};
    
    for (const date of dates) {
      dutyMap[date] = {};
      for (const dutyType of dutyTypes) {
        dutyMap[date][dutyType] = [];
      }
    }
    
    // Заполняем данные
    for (const duty of departmentDuties) {
      if (!dutyMap[duty.date][duty.duty_type_name]) {
        dutyMap[duty.date][duty.duty_type_name] = [];
      }
      dutyMap[duty.date][duty.duty_type_name].push(duty.employee_name);
    }
    
    return (
      <div className="overflow-x-auto max-h-[calc(90vh-120px)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              {dutyTypes.map(dutyType => (
                <th key={dutyType} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {dutyType}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dates.map(date => (
              <tr key={date}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatDate(date)}
                </td>
                {dutyTypes.map(dutyType => (
                  <td key={dutyType} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {dutyMap[date][dutyType] && dutyMap[date][dutyType].length > 0 ? (
                      <div className="space-y-1">
                        {dutyMap[date][dutyType].map((employee, index) => {
                          // Находим информацию о сотруднике для определения группы
                          const employeeInfo = allEmployees.find(emp => emp.employee_name === employee);
                          const groupColor = getGroupColor(employeeInfo?.group_id || null, employeeInfo?.group_name || '');
                          
                          return (
                            <div key={index} className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 border shadow-sm ${groupColor}`}>
                              {employee}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-xs">—</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Новый UI выбора дат, структуры и подразделения
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
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Календарь */}
          <div className="w-64">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              placeholder="Выберите период"
            />
          </div>
          {/* Структура */}
          <div>
            <select
              className="px-3 py-2 border rounded min-w-[180px]"
              value={selectedStructureId ?? ''}
              onChange={e => {
                const val = e.target.value;
                setSelectedStructureId(val ? Number(val) : null);
              }}
            >
              <option value="">Выберите структуру</option>
              {structures.map(structure => (
                <option key={structure.id} value={structure.id}>{structure.name}</option>
              ))}
            </select>
          </div>
          {/* Подразделение */}
          <div>
            <select
              className="px-3 py-2 border rounded min-w-[180px]"
              value={selectedSubdepartmentId ?? ''}
              onChange={e => setSelectedSubdepartmentId(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedStructureId || subLoading}
            >
              <option value="">Выберите подразделение</option>
              {subdepartments.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          {/* Кнопка генерации */}
            <button
            onClick={handleGenerate}
            disabled={loading || !dateRange.startDate || !dateRange.endDate || !selectedStructureId || !selectedSubdepartmentId}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
            {loading ? 'Генерация...' : 'Сгенерировать наряды'}
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
                    className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Первая часть - общая информация */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{dept.department_name}</h2>
                          {dateRange.startDate && dateRange.endDate && (
                            <div className="mt-1 text-sm text-gray-600">
                              {dateRange.startDate.getMonth() === dateRange.endDate.getMonth() && 
                               dateRange.startDate.getFullYear() === dateRange.endDate.getFullYear() ? (
                                // Если выбран месяц, показываем название месяца
                                new Date(dateRange.startDate).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
                              ) : (
                                // Иначе показываем период
                                `Период: ${formatDateRange(dateRange.startDate, dateRange.endDate)}`
                              )}
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Нарядов: {dept.duties.length}
                            </span>
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              Заступает в сутки: {(() => {
                                const totalDuties = dept.duties.length;
                                const daysCount = dateRange.startDate && dateRange.endDate ? 
                                  Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
                                return Math.round(totalDuties / daysCount);
                              })()}
                            </span>
                          </div>
            </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                            {dept.duties.length}
                          </span>
              <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDepartment(dept);
                              handleDeleteDepartmentDuties();
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Удалить наряды подразделения"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
              </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Вторая часть - График дежурств */}
                    <div
                      onClick={() => handleDepartmentClick(dept)}
                      className="p-4 bg-blue-50 hover:bg-blue-100 transition-colors border-b border-gray-200"
                    >
                      <div className="text-center">
                        <span className="text-sm font-medium text-blue-700">График дежурств</span>
                        <div className="mt-1 text-xs text-blue-500">Нажмите для просмотра</div>
            </div>
          </div>

                    {/* Третья часть - Лист нарядов */}
                    <div
                      onClick={() => handleDepartmentDutyTypeClick(dept)}
                      className="p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <div className="text-center">
                        <span className="text-sm font-medium text-purple-700">Лист нарядов</span>
                        <div className="mt-1 text-xs text-purple-500">Нажмите для просмотра</div>
                      </div>
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

            {/* Модальное окно с таблицей по датам и типам нарядов */}
            {showDutyTypeModal && selectedDepartment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Наряды по датам и типам: {selectedDepartment?.department_name}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleDownloadDutyTypeExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Скачать Excel
                      </button>
                      <button
                        onClick={() => setShowDutyTypeModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {renderDutyTypeTable()}
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
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 mt-2 ${
                          dt.duty_category === 'academic' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {dt.duty_category === 'academic' ? 'Академический' : 'По подразделению'}
                        </span>
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
                {renderDutyTypeRecordsTable()}
              </div>
            )}
        </div>
      )}
      </div>
    </div>
  )
}

export default DutyDistributionPage 