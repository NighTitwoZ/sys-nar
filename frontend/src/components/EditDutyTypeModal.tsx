import React, { useState, useEffect } from 'react';

interface DutyType {
  id: number;
  name: string;
  description?: string;
  priority: number;
  people_per_day: number;
  duty_category: string;
}

interface EditDutyTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dutyType: DutyType | null;
  onUpdate: (dutyType: DutyType) => void;
}

const EditDutyTypeModal: React.FC<EditDutyTypeModalProps> = ({
  isOpen,
  onClose,
  dutyType,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    people_per_day: 1,
    duty_category: 'internal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (dutyType) {
      setFormData({
        name: dutyType.name,
        description: dutyType.description || '',
        priority: dutyType.priority,
        people_per_day: dutyType.people_per_day,
        duty_category: dutyType.duty_category
      });
    }
  }, [dutyType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyType) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8000/api/duty-types/${dutyType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedDutyType = await response.json();
        onUpdate(updatedDutyType);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка при обновлении типа наряда');
      }
    } catch (err) {
      setError('Ошибка сети при обновлении типа наряда');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' || name === 'people_per_day' ? parseInt(value) || 1 : value
    }));
  };

  if (!isOpen || !dutyType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Редактировать тип наряда
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория наряда *
            </label>
            <select
              name="duty_category"
              value={formData.duty_category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="academic">Академический</option>
              <option value="division">По подразделению</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вид наряда *
            </label>
            <select
              name="duty_category"
              value={formData.duty_category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="academic">Академический</option>
              <option value="division">По подразделению</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество человек в сутки *
            </label>
            <input
              type="number"
              name="people_per_day"
              value={formData.people_per_day}
              onChange={handleChange}
              min="1"
              max="10"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDutyTypeModal; 