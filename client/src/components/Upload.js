import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploading(true);
      setError(null);
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6, mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 2,
          }}
        >
          Upload Photo
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%',
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              width: '100%',
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white',
              },
            }}
          >
            Photo uploaded successfully!
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 3,
            border: '2px dashed rgba(255,255,255,0.2)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="photo-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ 
                mb: 2,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Select Photo
            </Button>
            {file && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                p: 1,
                borderRadius: '8px',
                width: '100%',
              }}>
                <Typography variant="body2" sx={{ color: 'white', flex: 1 }}>
                  {file.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleClearFile}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </label>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{ 
              mt: 2,
              backgroundColor: 'white',
              color: '#08203e',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,255,255,0.3)',
              },
            }}
          >
            {uploading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: '#08203e' }} />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Upload; 