import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

const StatusChangeModal = ({ 
  isOpen, 
  onClose, 
  currentStatus, 
  onStatusChange, 
  loading = false,
  formType = 'form'
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  // Handle status selection
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setShowRejectionInput(status === 'rejected');
    if (status !== 'rejected') {
      setRejectionReason('');
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedStatus === 'rejected' && !rejectionReason.trim()) {
      return;
    }

    onStatusChange(selectedStatus, rejectionReason);
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setRejectionReason('');
    setShowRejectionInput(false);
    onClose();
  };

  // Get status options (exclude current status)
  const getStatusOptions = () => {
    const allStatuses = [
      { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
      { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
      { value: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'text-red-600' }
    ];
    
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const statusOptions = getStatusOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Change {formType} Status
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Status Display */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">Current Status:</div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentStatus === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : currentStatus === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {currentStatus === 'approved' ? '✅ Approved' : 
               currentStatus === 'rejected' ? '❌ Rejected' : 
               '⏳ Pending'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Status
            </label>
            <div className="space-y-3">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <label
                    key={status.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStatus === status.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={selectedStatus === status.value}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 mr-3 ${status.color}`} />
                    <span className="font-medium text-gray-900">{status.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rejection Reason Input */}
          {showRejectionInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be visible to the applicant
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (selectedStatus === 'rejected' && !rejectionReason.trim())}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusChangeModal;
