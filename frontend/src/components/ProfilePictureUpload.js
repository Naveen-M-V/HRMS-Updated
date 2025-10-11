import React, { useState } from 'react';
import { Avatar, Badge, IconButton, CircularProgress } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const UploadButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  width: 40,
  height: 40,
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: theme.palette.error.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  width: 32,
  height: 32,
}));

const ProfilePictureUpload = ({ 
  profilePicture, 
  onUpload, 
  onDelete,
  firstName = '',
  lastName = '',
  uploading = false,
  size = 120
}) => {
  const [previewUrl, setPreviewUrl] = useState(profilePicture);
  const fileInputRef = React.useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    if (onUpload) {
      await onUpload(file);
    }

    event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      setPreviewUrl(null);
      if (onDelete) {
        await onDelete();
      }
    }
  };

  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        {uploading ? (
          <div style={{ 
            width: size, 
            height: size, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0'
          }}>
            <CircularProgress size={size / 2} />
          </div>
        ) : (
          <Avatar
            alt={`${firstName} ${lastName}`}
            src={previewUrl}
            sx={{
              width: size,
              height: size,
              fontSize: size / 2.5,
              fontWeight: 600,
              bgcolor: previewUrl ? 'transparent' : '#1976d2',
            }}
          >
            {!previewUrl && getInitials()}
          </Avatar>
        )}
      </StyledBadge>

      {!uploading && (
        <>
          <UploadButton
            onClick={handleUploadClick}
            size="small"
            disabled={uploading}
          >
            <PhotoCamera sx={{ fontSize: 20 }} />
          </UploadButton>

          {previewUrl && (
            <DeleteButton
              onClick={handleDelete}
              size="small"
              disabled={uploading}
            >
              <Delete sx={{ fontSize: 16 }} />
            </DeleteButton>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/jpg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProfilePictureUpload;
