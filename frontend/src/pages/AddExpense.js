import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Receipt, 
  Car, 
  Plus, 
  MapPin,
  FileText,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const AddExpense = () => {
  const navigate = useNavigate();
  const [claimType, setClaimType] = useState('receipt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common fields
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    currency: 'GBP',
    tax: 0,
    totalAmount: 0,
    category: 'Travel',
    tags: '',
    notes: '',
    // Receipt-specific
    supplier: '',
    receiptValue: 0,
    // Mileage-specific
    mileage: {
      distance: 0,
      unit: 'miles',
      ratePerUnit: 0.45,
      destinations: [{ address: '', latitude: null, longitude: null, order: 0 }]
    }
  });

  const [attachments, setAttachments] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMileageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      mileage: { ...prev.mileage, [field]: value }
    }));
  };

  const handleDestinationChange = (index, field, value) => {
    const newDestinations = [...formData.mileage.destinations];
    newDestinations[index] = { ...newDestinations[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      mileage: { ...prev.mileage, destinations: newDestinations }
    }));
  };

  const addDestination = () => {
    if (formData.mileage.destinations.length < 10) {
      setFormData(prev => ({
        ...prev,
        mileage: {
          ...prev.mileage,
          destinations: [
            ...prev.mileage.destinations,
            { address: '', latitude: null, longitude: null, order: prev.mileage.destinations.length }
          ]
        }
      }));
    }
  };

  const removeDestination = (index) => {
    if (formData.mileage.destinations.length > 1) {
      const newDestinations = formData.mileage.destinations.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        mileage: { ...prev.mileage, destinations: newDestinations }
      }));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 5) {
      alert('Maximum 5 attachments allowed per expense claim');
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const calculateMileageTotal = () => {
    const { distance, ratePerUnit } = formData.mileage;
    const subtotal = distance * ratePerUnit;
    return subtotal + (formData.tax || 0);
  };

  const calculateReceiptTotal = () => {
    return (formData.receiptValue || 0) + (formData.tax || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Calculate total amount based on claim type
      const totalAmount = claimType === 'mileage' ? calculateMileageTotal() : calculateReceiptTotal();

      // Prepare expense data
      const expenseData = {
        claimType,
        date: formData.date,
        currency: formData.currency,
        tax: formData.tax,
        totalAmount,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        notes: formData.notes
      };

      if (claimType === 'receipt') {
        expenseData.supplier = formData.supplier;
        expenseData.receiptValue = formData.receiptValue;
      } else {
        expenseData.mileage = {
          distance: formData.mileage.distance,
          unit: formData.mileage.unit,
          ratePerUnit: formData.mileage.ratePerUnit,
          destinations: formData.mileage.destinations
        };
      }

      // Create expense
      const response = await axios.post('/api/expenses', expenseData);
      const expenseId = response.data._id;

      // Upload attachments
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formDataObj = new FormData();
          formDataObj.append('file', file);
          await axios.post(`/api/expenses/${expenseId}/attachments`, formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      navigate('/user-dashboard?tab=expenses');
    } catch (err) {
      console.error('Error creating expense:', err);
      setError(err.response?.data?.message || 'Failed to create expense claim');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!formData.date || !formData.category) return false;
    if (claimType === 'receipt') {
      return formData.supplier && formData.receiptValue > 0;
    } else {
      return formData.mileage.distance > 0 && formData.mileage.ratePerUnit > 0;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/user-dashboard?tab=expenses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Expenses
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setClaimType('receipt')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition ${
              claimType === 'receipt'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <Receipt size={20} />
            Receipt
          </button>
          <button
            type="button"
            onClick={() => setClaimType('mileage')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition ${
              claimType === 'mileage'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <Car size={20} />
            Mileage
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Travel">Travel</option>
                <option value="Meals">Meals</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Equipment">Equipment</option>
                <option value="Training">Training</option>
                <option value="Mileage">Mileage</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Receipt-specific fields */}
            {claimType === 'receipt' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.receiptValue}
                    onChange={(e) => handleInputChange('receiptValue', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Value
                  </label>
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.currency} {calculateReceiptTotal().toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {/* Mileage-specific fields */}
            {claimType === 'mileage' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.mileage.distance}
                      onChange={(e) => handleMileageChange('distance', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <select
                      value={formData.mileage.unit}
                      onChange={(e) => handleMileageChange('unit', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="miles">Miles</option>
                      <option value="km">KM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate per {formData.mileage.unit === 'miles' ? 'Mile' : 'KM'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.mileage.ratePerUnit}
                    onChange={(e) => handleMileageChange('ratePerUnit', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Value
                  </label>
                  <div className="text-2xl font-bold text-gray-900">
                    {formData.currency} {calculateMileageTotal().toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Comma-separated tags"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional information about this expense"
              />
            </div>
          </div>
        </div>

        {/* Journey Planner (Mileage only) */}
        {claimType === 'mileage' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Journey Planner</h3>
            <div className="space-y-4">
              {formData.mileage.destinations.map((dest, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-2">
                    <MapPin size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={dest.address}
                      onChange={(e) => handleDestinationChange(index, 'address', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Destination ${index + 1}`}
                    />
                  </div>
                  {formData.mileage.destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDestination(index)}
                      className="flex-shrink-0 mt-2 text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              {formData.mileage.destinations.length < 10 && (
                <button
                  type="button"
                  onClick={addDestination}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  <Plus size={18} />
                  Add destination
                </button>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Map integration for route visualization and distance calculation will be available soon. 
                For now, please manually enter the total distance traveled.
              </p>
            </div>
          </div>
        )}

        {/* Attachments */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Attachments ({attachments.length}/5)
          </h3>
          
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {attachments.map((file, index) => (
                <div key={index} className="relative border border-gray-300 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <X size={14} />
                  </button>
                  <FileText size={32} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ))}
            </div>
          )}

          {attachments.length < 5 && (
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition">
              <Upload size={20} />
              <span>Attach file</span>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf"
                multiple
              />
            </label>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <DollarSign size={20} />
                Submit claim
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
