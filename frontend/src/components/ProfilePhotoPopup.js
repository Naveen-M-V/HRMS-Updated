import React, { useRef } from 'react';
import { TrashIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ProfilePhotoPopup = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  hasProfilePicture = false,
  uploading = false 
}) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleUpdateClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpdate(file);
      event.target.value = ''; // Reset input
    }
    onClose();
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      onDelete();
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Update Photo Button */}
            <button
              onClick={handleUpdateClick}
              disabled={uploading}
              className="w-full flex items-center gap-3 px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-shrink-0">
                <CameraIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-blue-900">
                  {hasProfilePicture ? 'Update Photo' : 'Upload Photo'}
                </div>
                <div className="text-sm text-blue-700">
                  {uploading ? 'Uploading...' : 'Choose a new profile picture'}
                </div>
              </div>
            </button>

            {/* Delete Photo Button - Only show if user has a profile picture */}
            {hasProfilePicture && (
              <button
                onClick={handleDeleteClick}
                disabled={uploading}
                className="w-full flex items-center gap-3 px-4 py-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-red-900">Delete Photo</div>
                  <div className="text-sm text-red-700">Remove your current profile picture</div>
                </div>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>
      </div>
    </>
  );
};

export default ProfilePhotoPopup;
