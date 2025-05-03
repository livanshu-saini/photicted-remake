import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import DownloadIcon from '@mui/icons-material/Download';
import 'swiper/css';
import 'swiper/css/pagination';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;


const slideshowImages = [
  '/slideshow/slide1.jpg',
  '/slideshow/slide2.jpg',
  '/slideshow/slide3.jpg',
  '/slideshow/slide4.jpg',
  '/slideshow/slide5.jpg',
];

function Home() {
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/photos`);
        setPhotos(response.data);
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    fetchPhotos();
  }, []);

  const handleDownload = async () => {
    if (!selectedCategory) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/photos/category/${selectedCategory}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/zip' });

      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedCategory}-photos.zip`);
      
    
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photos:', error);
      alert('Error downloading photos. Please try again.');
    }
  };

  const categories = [...new Set(photos.map(photo => photo.category))];

  return (
    <Box>
      {/* Full Screen Slideshow Section */}
      <Box sx={{ position: 'relative', height: '100vh', width: '100%' }}>
        <Swiper
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          modules={[Autoplay, Pagination]}
          className="mySwiper"
        >
          {slideshowImages.map((image, index) => (
            <SwiperSlide key={index}>
              <Box
                sx={{
                  height: '100vh',
                  width: '100%',
                  position: 'relative',
                  '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                <img src={image} alt={`Slide ${index + 1}`} />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Title Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 2,
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem', lg: '6rem' },
              fontWeight: 'bold',
              mb: 2,
              letterSpacing: '0.1em',
            }}
          >
            PHOTICTED
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              fontStyle: 'italic',
              letterSpacing: '0.2em',
            }}
          >
            photo addicted
          </Typography>
        </Box>
      </Box>

      {/* Photo Gallery Section */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{ 
            color: 'white',
            textAlign: 'center',
            mb: 4,
          }}
        >
          Photo Gallery
        </Typography>
        <Masonry
          breakpointCols={{
            default: 4,
            1400: 3,
            1100: 2,
            700: 1
          }}
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
              onClick={() => navigate(`/category/${photo.category}`)}
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
                  <Chip
                    label={photo.category}
                    size="small"
                    color="primary"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Masonry>
      </Container>

      {/* Download Section */}
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: 'white' }}>Select Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Select Category"
            sx={{
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
            }}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={!selectedCategory}
          sx={{
            backgroundColor: 'white',
            color: '#08203e',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Download All
        </Button>
      </Container>
    </Box>
  );
}

export default Home; 