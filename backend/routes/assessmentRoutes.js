const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const HealthData = require('../models/HealthData');
const { optionalAuth } = require('../middleware/auth');

// Multer in-memory storage, 10 MB limit, JPEG and PNG only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      const err = new Error('Only JPEG and PNG images are allowed');
      err.code = 'LIMIT_FILE_TYPE';
      cb(err, false);
    }
  }
});

// Middleware to handle both multipart/form-data and JSON payloads
const handleUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 10 MB limit' });
        }
        if (err.code === 'LIMIT_FILE_TYPE' || (err.message && err.message.includes('Only JPEG and PNG'))) {
          return res.status(400).json({ message: 'Only JPEG and PNG images are allowed' });
        }
        return res.status(400).json({ message: err.message || 'File upload error' });
      }
      next();
    });
  } else {
    next();
  }
};

// Helper to determine model_version from environment or metrics file
function getModelVersion() {
  if (process.env.MODEL_VERSION) {
    return process.env.MODEL_VERSION;
  }
  try {
    const candidates = [
      path.resolve(__dirname, '../../pcos-pcod-ai-project/models/tabular_metrics.json'),
      path.resolve(__dirname, '../models/tabular_metrics.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (data.model_version) return data.model_version;
        if (data.test_accuracy) {
          return `v1-rf-acc-${(data.test_accuracy * 100).toFixed(1)}%`;
        }
      }
    }
  } catch (e) {
    // Fall back to default
  }
  return '1.0.0';
}

// @route   POST /api/assess
// @desc    Unified AI diagnostic assessment proxying to Flask with server-side BMI & MongoDB persistence
// @access  Public / Optional Auth
router.post('/', handleUpload, optionalAuth, async (req, res) => {
  try {
    // 1. Extract clinical data dictionary
    let clinicalData = {};
    if (req.body && req.body.clinical_data) {
      try {
        clinicalData = typeof req.body.clinical_data === 'string'
          ? JSON.parse(req.body.clinical_data)
          : req.body.clinical_data;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid clinical_data JSON' });
      }
    } else if (req.body && typeof req.body === 'object') {
      clinicalData = { ...req.body };
      delete clinicalData.clinical_data;
    }

    if (typeof clinicalData !== 'object' || clinicalData === null || Array.isArray(clinicalData)) {
      clinicalData = {};
    }

    // 2. Compute BMI server-side from height (cm) and weight (kg) when both are valid.
    // Send bmi only if computed; never send fake defaults for missing fields.
    const rawHeight = clinicalData.height !== undefined ? clinicalData.height : clinicalData['Height (cm)'];
    const rawWeight = clinicalData.weight !== undefined ? clinicalData.weight : (
      clinicalData['Weight (Kg)'] !== undefined ? clinicalData['Weight (Kg)'] : clinicalData['Weight (kg)']
    );

    const h = parseFloat(rawHeight);
    const w = parseFloat(rawWeight);

    if (!isNaN(h) && h > 0 && !isNaN(w) && w > 0) {
      const heightMeters = h / 100;
      const computedBmi = parseFloat((w / (heightMeters * heightMeters)).toFixed(2));
      clinicalData.bmi = computedBmi;
      clinicalData['BMI'] = computedBmi;
    } else {
      // If height and weight are not both valid, remove any uncomputed/client-passed bmi
      delete clinicalData.bmi;
      delete clinicalData['BMI'];
    }

    // Compute input_completeness: fraction of the supplied fields that were non-empty
    const suppliedKeys = Object.keys(clinicalData);
    let inputCompleteness = 0.0;
    if (suppliedKeys.length > 0) {
      const nonEmptyCount = suppliedKeys.filter(k => {
        const val = clinicalData[k];
        return val !== null && val !== undefined && val !== '' && !Number.isNaN(val);
      }).length;
      inputCompleteness = Number((nonEmptyCount / suppliedKeys.length).toFixed(2));
    }

    // 3. Prepare request to Flask AI service
    const uploadedFile = req.file || (req.files && (req.files.file?.[0] || req.files.image?.[0]));
    const aiBaseUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';
    const targetUrl = `${aiBaseUrl.replace(/\/$/, '')}/api/predict/combined`;

    const fetchHeaders = {};
    if (process.env.AI_SERVICE_KEY) {
      fetchHeaders['X-Service-Key'] = process.env.AI_SERVICE_KEY;
    }

    let fetchBody;
    if (uploadedFile) {
      const formData = new FormData();
      const fileBlob = new Blob([uploadedFile.buffer], { type: uploadedFile.mimetype });
      formData.append('file', fileBlob, uploadedFile.originalname || 'ultrasound.jpg');
      formData.append('clinical_data', JSON.stringify(clinicalData));
      fetchBody = formData;
    } else {
      fetchHeaders['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(clinicalData);
    }

    // Forward to Flask with a 30-second timeout
    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: fetchBody,
        signal: AbortSignal.timeout(30000)
      });
    } catch (netErr) {
      console.error('Flask connection error or timeout:', netErr.message);
      return res.status(503).json({ message: 'Assessment service unavailable' });
    }

    const flaskData = await response.json().catch(() => null);

    if (!response.ok) {
      // Map Flask 400 invalid_image to 400 with the same message
      if (response.status === 400 && flaskData && flaskData.error === 'invalid_image') {
        return res.status(400).json({
          error: 'invalid_image',
          message: flaskData.message || 'Invalid ultrasound image uploaded.',
          suggestion: flaskData.suggestion
        });
      }

      if (response.status === 400 && flaskData && flaskData.error) {
        return res.status(400).json({
          error: flaskData.error,
          message: flaskData.message || flaskData.error
        });
      }

      console.error(`Flask service responded with HTTP ${response.status}:`, flaskData);
      return res.status(503).json({ message: 'Assessment service unavailable' });
    }

    if (!flaskData || typeof flaskData !== 'object') {
      return res.status(503).json({ message: 'Assessment service unavailable' });
    }

    // 4. If req.userId exists, save result into diagnosticHistory and riskAssessment
    if (req.userId) {
      try {
        await HealthData.getOrCreate(req.userId);

        const rawSeverity = String(flaskData.severity || 'low').toLowerCase();
        const validLevels = ['minimal', 'low', 'moderate', 'high'];
        const normalizedLevel = validLevels.includes(rawSeverity) ? rawSeverity : 'low';

        const diagnosticEntry = {
          score: Math.round(flaskData.risk_score || 0),
          level: normalizedLevel,
          diagnosis: flaskData.diagnosis || 'PCOS Risk Assessment',
          severity: flaskData.severity || 'Low',
          tabular_score: flaskData.tabular_risk != null ? Math.round(flaskData.tabular_risk) : undefined,
          image_score: flaskData.image_risk != null ? Math.round(flaskData.image_risk) : undefined,
          date: new Date()
        };

        await HealthData.findOneAndUpdate(
          { user: req.userId },
          {
            $push: {
              diagnosticHistory: {
                $each: [diagnosticEntry],
                $slice: -100
              }
            },
            $set: {
              riskAssessment: {
                score: Math.round(flaskData.risk_score || 0),
                level: normalizedLevel,
                factors: [flaskData.diagnosis, `Severity: ${flaskData.severity}`].filter(Boolean),
                lastUpdated: new Date()
              }
            }
          },
          { new: true }
        );
      } catch (dbErr) {
        console.error('Error persisting assessment to MongoDB HealthData:', dbErr);
      }
    }

    // 5. Return Flask JSON unchanged plus input_completeness and model_version
    const modelVersion = getModelVersion();

    return res.json({
      ...flaskData,
      input_completeness: inputCompleteness,
      model_version: modelVersion
    });

  } catch (error) {
    console.error('Unhandled assessment proxy error:', error);
    return res.status(503).json({ message: 'Assessment service unavailable' });
  }
});

module.exports = router;
