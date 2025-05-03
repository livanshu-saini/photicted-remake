const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = require('image-size');
const archiver = require('archiver');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/photicted', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if MongoDB connection fails
});

// Photo Schema
const photoSchema = new mongoose.Schema({
  filename: String,
  path: String,
  category: String,
  metadata: {
    width: Number,
    height: Number,
    format: String,
    aspectRatio: Number,
    dominantColors: [{
      r: Number,
      g: Number,
      b: Number,
      percentage: Number
    }]
  },
  uploadDate: { type: Date, default: Date.now }
});

const Photo = mongoose.model('Photo', photoSchema);


const categories = {
  landscape: {
    aspectRatio: { min: 1.3, max: 3.0 }, 
    resolution: { min: 1920 }, 
    description: 'Wide, scenic views of nature or cityscapes'
  },
  portrait: {
    aspectRatio: { min: 0.5, max: 1.2 }, 
    resolution: { min: 1080 }, 
    description: 'People, faces, or vertical compositions'
  },
  nature: {
    aspectRatio: { min: 0.8, max: 2.0 }, 
    resolution: { min: 1920 }, 
    description: 'Photos with significant green content'
  },
  sky: {
    aspectRatio: { min: 0.8, max: 2.0 }, // Flexible aspect ratio
    resolution: { min: 1920 }, // Full HD or higher
    description: 'Photos with significant blue content'
  },
  monochrome: {
    aspectRatio: { min: 0.5, max: 3.0 }, // Any aspect ratio
    resolution: { min: 1920 }, // Full HD or higher
    description: 'Black and white or grayscale photos'
  },
  other: {
    aspectRatio: { min: 0.5, max: 3.0 }, // Any aspect ratio
    resolution: { min: 0 }, // Any resolution
    description: 'Photos that don\'t fit other categories'
  }
};

// Helper function to analyze image colors
async function analyzeColors(imagePath) {
  try {
    const image = sharp(imagePath);
    const stats = await image.stats();
    const metadata = await image.metadata();

    const red = stats.channels[0].mean;
    const green = stats.channels[1].mean;
    const blue = stats.channels[2].mean;

    const grayscale = (red + green + blue) / 3;

    const threshold = 5;
    const isMonochrome = 
      Math.abs(red - grayscale) < threshold && 
      Math.abs(green - grayscale) < threshold && 
      Math.abs(blue - grayscale) < threshold;

    const total = red + green + blue;
    const redProportion = red / total;
    const greenProportion = green / total;
    const blueProportion = blue / total;

    console.log('Detailed Color Analysis:', {
      raw: { red, green, blue },
      proportions: { redProportion, greenProportion, blueProportion },
      grayscale,
      isMonochrome,
      threshold,
      differences: {
        redDiff: Math.abs(red - grayscale),
        greenDiff: Math.abs(green - grayscale),
        blueDiff: Math.abs(blue - grayscale)
      }
    });

    return {
      redProportion,
      greenProportion,
      blueProportion,
      isMonochrome,
      metadata
    };
  } catch (error) {
    console.error('Error in color analysis:', error);
    return null;
  }
}

// Helper function to categorize image
async function categorizeImage(imagePath) {
  try {
    console.log('Analyzing image at path:', imagePath);
    // Get image dimensions
    const dimensions = sizeOf(imagePath);
    const aspectRatio = dimensions.width / dimensions.height;
    
    // Analyze colors
    const analysis = await analyzeColors(imagePath);
    
    if (!analysis) {
      console.error('Color analysis failed');
      return { category: 'other', metadata: { width: dimensions.width, height: dimensions.height } };
    }

    const { redProportion, greenProportion, blueProportion, isMonochrome, metadata } = analysis;

    // Store metadata
    const imageMetadata = {
      width: dimensions.width,
      height: dimensions.height,
      format: metadata.format,
      aspectRatio,
      dominantColors: [{
        r: redProportion * 255,
        g: greenProportion * 255,
        b: blueProportion * 255,
        percentage: 100
      }]
    };

    console.log('Categorization Process:', {
      dimensions,
      aspectRatio,
      colorProportions: {
        red: redProportion,
        green: greenProportion,
        blue: blueProportion
      },
      isMonochrome
    });


    if (isMonochrome) {
      console.log('✓ Categorized as: monochrome');
      return { category: 'monochrome', metadata: imageMetadata };
    }

    if (blueProportion > 0.38 && blueProportion > greenProportion && blueProportion > redProportion) {
      console.log('✓ Categorized as: sky');
      return { category: 'sky', metadata: imageMetadata };
    }

    if (greenProportion > 0.35 && greenProportion > blueProportion && greenProportion > redProportion) {
      console.log('✓ Categorized as: nature');
      return { category: 'nature', metadata: imageMetadata };
    }

    if (aspectRatio > 1.3) {
      console.log('✓ Categorized as: landscape');
      return { category: 'landscape', metadata: imageMetadata };
    }

    if (aspectRatio < 1.2) {
      console.log('✓ Categorized as: portrait');
      return { category: 'portrait', metadata: imageMetadata };
    }

    console.log('✓ Categorized as: other');
    return { category: 'other', metadata: imageMetadata };
  } catch (error) {
    console.error('Error in categorization:', error);
    return { category: 'other', metadata: {} };
  }
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    console.log('\n--- Processing New Image ---');
    console.log('Image path:', imagePath);
    console.log('Original filename:', req.file.originalname);

    const { category, metadata } = await categorizeImage(imagePath);
    console.log('Final category:', category);
    console.log('------------------------\n');

    const photo = new Photo({
      filename: req.file.originalname,
      path: path.relative(__dirname, imagePath), 
      category,
      metadata
    });

    await photo.save();
    res.status(201).json(photo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ uploadDate: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Error fetching photos' });
  }
});

app.get('/api/photos/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const photos = await Photo.find({ category }).sort({ uploadDate: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos by category:', error);
    res.status(500).json({ error: 'Error fetching photos by category' });
  }
});

app.get('/api/photos/category/:category/download', async (req, res) => {
  try {
    const { category } = req.params;
    const photos = await Photo.find({ category });
    
    if (!photos.length) {
      return res.status(404).json({ message: 'No photos found in this category' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment(`${category}-photos.zip`);
    archive.pipe(res);

    for (const photo of photos) {
      const filePath = path.join(__dirname, photo.path);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: photo.filename });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    res.status(500).json({ message: 'Error creating ZIP file' });
  }
});

// Get available categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Photo.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update photo category
app.put('/api/photos/:id/category', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    
    if (!Object.keys(categories).includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const updatedPhoto = await Photo.findByIdAndUpdate(
      id,
      { category },
      { new: true }
    );

    if (!updatedPhoto) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(updatedPhoto);
  } catch (error) {
    console.error('Error updating photo category:', error);
    res.status(500).json({ error: 'Error updating photo category' });
  }
});

// Download photo
app.get('/api/photos/:id/download', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, photo.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, photo.filename);
  } catch (error) {
    console.error('Error downloading photo:', error);
    res.status(500).json({ error: 'Error downloading photo' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 