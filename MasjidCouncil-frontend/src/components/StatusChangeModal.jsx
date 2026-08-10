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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className="relative mx-auto my-8 w-full max-w-md rounded-2xl bg-white border border-[#E5E7EB] max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <h2 className="text-xl font-semibold text-[#111827]">
            Change {formType} Status
          </h2>
          <button
            onClick={handleClose}
            className="text-[#6B7280] hover:text-[#374151] transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Display */}
        <div className="mx-6 mt-4 mb-2 flex items-center gap-3 rounded-xl bg-[#F7F9FB] border border-[#E5E7EB] px-4 py-3">
          <span className="text-sm text-[#6B7280]">Current Status:</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            currentStatus === 'approved'
              ? 'bg-[#EAF6EF] text-[#1F6B3A]'
              : currentStatus === 'rejected'
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {currentStatus === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> :
             currentStatus === 'rejected' ? <AlertCircle className="w-3.5 h-3.5" /> :
             <Clock className="w-3.5 h-3.5" />}
            {currentStatus === 'approved' ? 'Approved' :
             currentStatus === 'rejected' ? 'Rejected' :
             'Pending'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4">
          {/* Status Selection */}
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#374151] mb-2">
              Select New Status
            </label>
            <div className="space-y-2.5">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                return (
                  <label
                    key={status.value}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                      selectedStatus === status.value
                        ? 'border-[#1F6B3A] bg-[#EAF6EF]'
                        : 'border-[#E5E7EB] hover:border-gray-300'
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
                    <span className="font-medium text-[#111827] text-sm">{status.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rejection Reason Input */}
          {showRejectionInput && (
            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2E7D4F] focus:ring-2 focus:ring-[#2E7D4F]/15 transition-all resize-none"
                rows={3}
                required
              />
              <p className="text-xs text-[#6B7280] mt-1.5">
                This reason will be visible to the applicant
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 px-5 border border-[#E5E7EB] rounded-xl text-[#374151] hover:bg-gray-50 transition-colors text-sm font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (selectedStatus === 'rejected' && !rejectionReason.trim())}
              className="h-10 px-5 bg-[#1F6B3A] text-white rounded-xl hover:bg-[#2E7D4F] transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
