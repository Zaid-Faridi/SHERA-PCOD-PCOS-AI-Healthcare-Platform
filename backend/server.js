require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');
const { rateLimit } = require('express-rate-limit');

const userRoutes = require('./routes/userRoutes');
const healthDataRoutes = require('./routes/healthDataRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const communityRoutes = require('./routes/communityRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');

// Validate critical environment variables at startup
function validateEnv() {
  const missing = [];
  if (!process.env.MONGODB_URI) {
    missing.push('MONGODB_URI is required');
  }
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET is required');
  } else if (process.env.JWT_SECRET.length < 32) {
    missing.push('JWT_SECRET must be at least 32 characters long');
  }

  if (missing.length > 0) {
    console.error('FATAL Environment Configuration Error:\n' + missing.map(m => ` - ${m}`).join('\n'));
    process.exit(1);
  }
}

validateEnv();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// 1. Security Headers
app.use(helmet());

// 2. CORS Allow-list
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 3. Body Parsing with Size Limit
app.use(express.json({ limit: '100kb' }));

// 4. NoSQL Query Injection Sanitization
app.use(mongoSanitize());

// 5. Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts from this IP, please try again after 15 minutes' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later' }
});

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api', generalLimiter);

// 6. Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 7. Application Routes
app.use('/api/users', userRoutes);
app.use('/api/health', healthDataRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/assess', assessmentRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('PCOS/PCOD API is running');
});

// 8. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// 9. Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Central Server Error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large' });
  }
  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Malformed JSON payload' });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected server error occurred' : (err.message || 'Error processing request')
  });
});

// Database connection helper
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Start server only when run directly and after MongoDB connects
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Attach helpers and export app for testing
app.validateEnv = validateEnv;
app.connectDB = connectDB;

module.exports = app;