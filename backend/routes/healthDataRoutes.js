const express = require('express');
const router = express.Router();
const HealthData = require('../models/HealthData');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const {
  validateCycle,
  validateSymptoms,
  validateLifestyle,
  validateRiskAssessment
} = require('../middleware/validation');

// @route   GET /api/health/data
// @desc    Get user's health data
// @access  Private
router.get('/data', verifyToken, async (req, res) => {
  try {
    const healthData = await HealthData.getOrCreate(req.userId);
    res.json(healthData);
  } catch (error) {
    console.error('Get health data error:', error);
    res.status(500).json({ message: 'Server error fetching health data' });
  }
});

// @route   POST /api/health/cycle
// @desc    Add new cycle data
// @access  Private
router.post('/cycle', verifyToken, validateCycle, async (req, res) => {
  try {
    const { startDate, endDate, symptoms, mood, notes } = req.body;
    const healthData = await HealthData.getOrCreate(req.userId);

    healthData.cycleData.push({
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      symptoms: symptoms || [],
      mood,
      notes
    });

    if (symptoms && Array.isArray(symptoms)) {
      symptoms.forEach(symptom => {
        const existingSymptom = healthData.symptoms.find(s => s.name === symptom);
        if (!existingSymptom) {
          healthData.symptoms.push({
            name: symptom,
            severity: 5,
            date: new Date()
          });
        }
      });
    }

    await healthData.save();
    res.status(201).json(healthData);
  } catch (error) {
    console.error('Add cycle data error:', error);
    res.status(500).json({ message: 'Server error saving cycle data' });
  }
});

// @route   PUT /api/health/lifestyle
// @desc    Update lifestyle factors
// @access  Private
router.put('/lifestyle', verifyToken, validateLifestyle, async (req, res) => {
  try {
    const { exercise, diet, stress, sleep } = req.body;
    await HealthData.getOrCreate(req.userId);

    const updateFields = {};
    if (exercise !== undefined) updateFields['lifestyleFactors.exercise'] = exercise;
    if (diet !== undefined) updateFields['lifestyleFactors.diet'] = diet;
    if (stress !== undefined) updateFields['lifestyleFactors.stress'] = stress;
    if (sleep !== undefined) updateFields['lifestyleFactors.sleep'] = sleep;

    const healthData = await HealthData.findOneAndUpdate(
      { user: req.userId },
      { $set: updateFields },
      { new: true }
    );

    res.json(healthData);
  } catch (error) {
    console.error('Update lifestyle error:', error);
    res.status(500).json({ message: 'Server error updating lifestyle factors' });
  }
});

// @route   POST /api/health/symptoms
// @desc    Add new symptom
// @access  Private
router.post('/symptoms', verifyToken, validateSymptoms, async (req, res) => {
  try {
    const { name, severity } = req.body;
    await HealthData.getOrCreate(req.userId);

    const healthData = await HealthData.findOneAndUpdate(
      { user: req.userId },
      {
        $push: {
          symptoms: {
            name,
            severity,
            date: new Date()
          }
        }
      },
      { new: true }
    );

    res.status(201).json(healthData);
  } catch (error) {
    console.error('Add symptom error:', error);
    res.status(500).json({ message: 'Server error saving symptom' });
  }
});

// @route   POST /api/health/risk-assessment
// @desc    Calculate and save risk assessment
// @access  Private
router.post('/risk-assessment', verifyToken, validateRiskAssessment, async (req, res) => {
  try {
    const { age, bmi, symptoms, lifestyleFactors, familyHistory, diagnosedWithPCOS } = req.body;

    let score = 0;
    const riskFactors = [];

    // Age factor (higher risk between 15-35)
    if (age && age >= 15 && age <= 35) {
      score += 10;
      riskFactors.push('Age between 15-35');
    }

    // BMI factor
    if (bmi && bmi >= 25) {
      score += 15;
      riskFactors.push('BMI above 25');
    }

    // Family history
    if (familyHistory) {
      score += 20;
      riskFactors.push('Family history of PCOS/PCOD');
    }

    // Already diagnosed
    if (diagnosedWithPCOS) {
      score += 30;
      riskFactors.push('Previous PCOS/PCOD diagnosis');
    }

    // Symptoms
    const highRiskSymptoms = ['Irregular periods', 'Excessive hair growth', 'Weight gain', 'Acne', 'Hair loss'];
    let symptomCount = 0;

    if (symptoms && Array.isArray(symptoms)) {
      symptoms.forEach(symptom => {
        if (highRiskSymptoms.includes(symptom)) {
          symptomCount++;
        }
      });

      score += symptomCount * 5;
      if (symptomCount > 0) {
        riskFactors.push(`${symptomCount} PCOS-related symptoms`);
      }
    }

    // Lifestyle factors
    if (lifestyleFactors) {
      if (!lifestyleFactors.exercise) {
        score += 5;
        riskFactors.push('Sedentary lifestyle');
      }

      if (lifestyleFactors.stress && lifestyleFactors.stress > 7) {
        score += 5;
        riskFactors.push('High stress levels');
      }

      if (lifestyleFactors.sleep && lifestyleFactors.sleep < 6) {
        score += 5;
        riskFactors.push('Poor sleep habits');
      }
    }

    score = Math.min(score, 100);

    let level;
    if (score < 30) {
      level = 'low';
    } else if (score < 60) {
      level = 'moderate';
    } else {
      level = 'high';
    }

    await HealthData.getOrCreate(req.userId);

    await HealthData.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
          riskAssessment: {
            score,
            level,
            factors: riskFactors,
            lastUpdated: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({
      score,
      level,
      factors: riskFactors
    });
  } catch (error) {
    console.error('Calculate risk assessment error:', error);
    res.status(500).json({ message: 'Server error processing risk assessment' });
  }
});

// @route   POST /api/health/save-diagnostic
// @desc    Save AI combined diagnostic assessment run (atomic push with slice to latest 100)
// @access  Private
router.post('/save-diagnostic', verifyToken, async (req, res) => {
  try {
    const { score, level, diagnosis, severity, tabular_score, image_score } = req.body;
    await HealthData.getOrCreate(req.userId);

    const diagnosticEntry = {
      score,
      level,
      diagnosis,
      severity,
      tabular_score,
      image_score,
      date: new Date()
    };

    const healthData = await HealthData.findOneAndUpdate(
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
            score,
            level: level ? String(level).toLowerCase() : 'low',
            factors: [diagnosis, `Severity: ${severity}`].filter(Boolean),
            lastUpdated: new Date()
          }
        }
      },
      { new: true }
    );

    res.json(healthData);
  } catch (error) {
    console.error('Save diagnostic error:', error);
    res.status(500).json({ message: 'Server error saving diagnostic assessment' });
  }
});

// @route   GET /api/health/export
// @desc    Export user's own profile and health records as JSON
// @access  Private
router.get('/export', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const healthData = await HealthData.findOne({ user: req.userId });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shera-health-export-${req.userId}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      user,
      healthData: healthData || null
    });
  } catch (error) {
    console.error('Export health data error:', error);
    res.status(500).json({ message: 'Server error exporting health data' });
  }
});

module.exports = router;