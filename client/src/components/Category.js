import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import {
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const CATEGORIES = [
  'landscape',
  'portrait',
  'nature',
  'sky',
  'monochrome',
  'other'
];

function Category() {
  const { category } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/photos/category/${category}`);
        setPhotos(response.data);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setError('Failed to load photos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [category]);

  const handleCategoryChange = async (photoId, newCategory) => {
    try {
      const response = await axios.put(`${API_URL}/api/photos/${photoId}/category`, {
        category: newCategory
      });
      
      setPhotos(photos.map(photo => 
        photo._id === photoId ? response.data : photo
      ));
      
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category. Please try again.');
    }
  };

  const handleDownload = async (photoId, filename) => {
    try {
      const response = await axios.get(`${API_URL}/api/photos/${photoId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
      setError('Failed to download photo. Please try again.');
    }
  };

  const breakpointColumns = {
    default: 4,
    1400: 3,
    1100: 2,
    700: 1
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6, mt: 8 }}>
      <Typography 
        variant="h4" 
        component="h2" 
        gutterBottom
        sx={{ 
          color: 'white',
          textAlign: 'center',
          mb: 4,
          textTransform: 'capitalize',
        }}
      >
        {category} Photos
      </Typography>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
        columnAttrs={{
          className: 'should-be-overridden',
          'data-test': 'masonry-grid-column',
        }}
      >
        {photos.map((photo) => (
          <Card
            key={photo._id}
            sx={{
              marginBottom: 3,
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease-in-out',
              },
            }}
          >
            <CardMedia
              component="img"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
              image={`${API_URL}/${photo.path}`}
              alt={photo.filename}
            />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(photo.uploadDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {editingId === photo._id ? (
                    <FormControl size="small">
                      <Select
                        value={photo.category}
                        onChange={(e) => handleCategoryChange(photo._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                      >
                        {CATEGORIES.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <>
                      <Chip
                        label={photo.category}
                        size="small"
                        color="primary"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Tooltip title="Change category">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(photo._id);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download photo">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo._id, photo.filename);
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Masonry>
    </Container>
  );
}

export default Category; 