import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { goalsApi } from '../../utils/performanceApi';
import { toast } from 'react-toastify';
import ModernDatePicker from '../ModernDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function CreateGoalDrawer({ isOpen, onClose, onSuccess, employees }) {
    const [formData, setFormData] = useState({
        goalName: '',
        description: '',
        assignee: '',
        startDate: '',
        dueDate: '',
        measurementType: 'Progress (%)',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const measurementTypes = [
        'Yes/No',
        'Progress (%)',
        'Numeric Target',
        'Milestones',
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.goalName.trim()) newErrors.goalName = 'Goal name is required';
        // Description is now optional
        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be 500 characters or less';
        }
        if (!formData.assignee) newErrors.assignee = 'Please select an assignee';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
        if (!formData.measurementType) newErrors.measurementType = 'Measurement type is required';
        if (formData.startDate && formData.dueDate && new Date(formData.dueDate) <= new Date(formData.startDate)) {
            newErrors.dueDate = 'Due date must be after start date';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                goalName: formData.goalName.trim(),
                description: (formData.description || '').trim(),
                assignee: formData.assignee,
                startDate: formData.startDate,
                dueDate: formData.dueDate,
                measurementType: formData.measurementType,
            };
            await goalsApi.createGoal(payload);
            toast.success('Goal created successfully');
            // Reset form
            setFormData({
                goalName: '',
                description: '',
                assignee: '',
                startDate: '',
                dueDate: '',
                measurementType: 'Progress (%)',
            });
            setErrors({});
            onSuccess();
        } catch (error) {
            const responseData = error?.response?.data;
            console.error('Error creating goal:', { error, responseData });

            let message = responseData?.message || 'Failed to create goal';
            if (responseData?.details && typeof responseData.details === 'object') {
                const detailText = Object.entries(responseData.details)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');
                message = `${message} (${detailText})`;
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFormData({
                goalName: '',
                description: '',
                assignee: '',
                startDate: '',
                dueDate: '',
                measurementType: 'Progress (%)',
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Create Goal</h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Goal Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Goal name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="goalName"
                            value={formData.goalName}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.goalName ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter goal name"
                        />
                        {errors.goalName && (
                            <p className="mt-1 text-sm text-red-500">{errors.goalName}</p>
                        )}
                    </div>

                    {/* Description - Now Optional */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            maxLength={500}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Describe the goal... (optional)"
                        />
                        <div className="flex justify-between mt-1">
                            {errors.description ? (
                                <p className="text-sm text-red-500">{errors.description}</p>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    {formData.description.length}/500 characters
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Assign to - Using standard select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to <span className="text-red-500">*</span>
                        </label>
                        <Select value={formData.assignee || 'select'} onValueChange={(v) => handleChange({ target: { name: 'assignee', value: v === 'select' ? '' : v } })}>
                            <SelectTrigger
                                className={`${errors.assignee ? 'border-red-500' : 'border-gray-300'} focus:ring-green-500 focus:ring-offset-0`}
                            >
                                <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="select">Select employee</SelectItem>
                                {Array.isArray(employees) && employees.map((emp) => (
                                    <SelectItem key={emp._id || emp.id} value={String(emp._id || emp.id)}>
                                        {emp.firstName} {emp.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.assignee && (
                            <p className="mt-1 text-sm text-red-500">{errors.assignee}</p>
                        )}
                        {Array.isArray(employees) && employees.length === 0 && (
                            <p className="mt-1 text-sm text-yellow-600">No employees found. Please add employees first.</p>
                        )}
                    </div>

                    {/* Start Date - Using ModernDatePicker */}
                    <ModernDatePicker
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        label="Start date"
                        required={true}
                        placeholder="Select start date"
                    />
                    {errors.startDate && (
                        <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                    )}

                    {/* Due Date - Using ModernDatePicker */}
                    <ModernDatePicker
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        label="Due date"
                        required={true}
                        placeholder="Select due date"
                        min={formData.startDate}
                    />
                    {errors.dueDate && (
                        <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>
                    )}

                    {/* Measurement Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Measurement type <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            {measurementTypes.map((type) => (
                                <label key={type} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="measurementType"
                                        value={type}
                                        checked={formData.measurementType === type}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
