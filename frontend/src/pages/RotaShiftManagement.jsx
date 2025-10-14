import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ShiftTimeline from '../components/ShiftTimeline';
import { getAllRota, generateRota, initializeShifts } from '../utils/rotaApi';
import LoadingScreen from '../components/LoadingScreen';

/**
 * RotaShiftManagement Page
 * Manages employee shift schedules with timeline view
 * Features: Auto-generate rotas, view weekly/monthly schedules
 */

const RotaShiftManagement = () => {
  const [rotaData, setRotaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState('week');
  const [dateRange, setDateRange] = useState({
    startDate: getMonday(new Date()).toISOString().split('T')[0],
    endDate: getFriday(new Date()).toISOString().split('T')[0]
  });

  /**
   * Get Monday of current week
   */
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Get Friday of current week
   */
  function getFriday(date) {
    const monday = getMonday(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
  }

  /**
   * Fetch rota data on component mount and when date range changes
   */
  useEffect(() => {
    fetchRotaData();
  }, [dateRange]);

  /**
   * Fetch all rota entries
   */
  const fetchRotaData = async () => {
    setLoading(true);
    try {
      const response = await getAllRota(dateRange.startDate, dateRange.endDate);
      
      if (response.success) {
        setRotaData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch rota data');
      }
    } catch (error) {
      console.error('Fetch rota error:', error);
      toast.error(error.message || 'Failed to load shift schedules');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generate rota button click
   */
  const handleGenerateRota = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.warning('Please select start and end dates');
      return;
    }

    const confirmGenerate = window.confirm(
      'This will regenerate the rota for the selected date range. Any existing schedules will be replaced. Continue?'
    );

    if (!confirmGenerate) return;

    setGenerating(true);
    try {
      const response = await generateRota(dateRange.startDate, dateRange.endDate);
      
      if (response.success) {
        toast.success(response.message || 'Rota generated successfully!');
        fetchRotaData();
      } else {
        toast.error(response.message || 'Failed to generate rota');
      }
    } catch (error) {
      console.error('Generate rota error:', error);
      toast.error(error.message || 'Failed to generate shift schedules');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Handle initialize shifts (one-time setup)
   */
  const handleInitializeShifts = async () => {
    setGenerating(true);
    try {
      const response = await initializeShifts();
      
      if (response.success) {
        toast.success(response.message);
      }
    } catch (error) {
      console.error('Initialize shifts error:', error);
      toast.error(error.message || 'Failed to initialize shifts');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Handle view change (week/month)
   */
  const handleViewChange = (newView) => {
    setView(newView);
    
    if (newView === 'month') {
      const firstDay = new Date();
      firstDay.setDate(1);
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
      
      setDateRange({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      });
    } else {
      setDateRange({
        startDate: getMonday(new Date()).toISOString().split('T')[0],
        endDate: getFriday(new Date()).toISOString().split('T')[0]
      });
    }
  };

  /**
   * Handle event click on timeline
   */
  const handleEventClick = (eventData) => {
    toast.info(
      `${eventData.employeeName} - ${eventData.title}\n${eventData.shiftTime}`,
      { autoClose: 3000 }
    );
  };

  /**
   * Handle date range change
   */
  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && rotaData.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="rota-shift-management-page" style={{
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '8px'
        }}>
          Rota Shift Management
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Manage and view employee shift schedules
        </p>
      </div>

      {/* Control Panel */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          {/* Date Range Filters */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* View Toggle */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              View
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleViewChange('week')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: view === 'week' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  background: view === 'week' ? '#eff6ff' : '#ffffff',
                  color: view === 'week' ? '#3b82f6' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Week
              </button>
              <button
                onClick={() => handleViewChange('month')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: view === 'month' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                  background: view === 'month' ? '#eff6ff' : '#ffffff',
                  color: view === 'month' ? '#3b82f6' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Month
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginLeft: 'auto'
          }}>
            <button
              onClick={handleInitializeShifts}
              disabled={generating}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              Init Shifts
            </button>
            
            <button
              onClick={handleGenerateRota}
              disabled={generating}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: generating ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}
            >
              {generating ? 'Generating...' : 'Generate Rota'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          Loading shift schedules...
        </div>
      )}

      {/* Timeline View */}
      {!loading && (
        <ShiftTimeline
          rotaData={rotaData}
          view={view}
          onEventClick={handleEventClick}
        />
      )}

      {/* Stats Card */}
      {rotaData.length > 0 && (
        <div style={{
          marginTop: '24px',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Total Shifts
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {rotaData.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Employees
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {new Set(rotaData.map(r => r.employee._id)).size}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              Date Range
            </div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              {dateRange.startDate} to {dateRange.endDate}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default RotaShiftManagement;
