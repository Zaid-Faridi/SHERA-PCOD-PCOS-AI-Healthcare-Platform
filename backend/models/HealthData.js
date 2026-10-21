const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  cycleData: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    symptoms: [{
      type: String
    }],
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'poor', 'very-poor']
    },
    notes: {
      type: String
    }
  }],
  symptoms: [{
    name: {
      type: String,
      required: true
    },
    severity: {
      type: Number,
      min: 1,
      max: 10
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lifestyleFactors: {
    exercise: {
      type: Boolean,
      default: false
    },
    diet: {
      type: String,
      enum: ['balanced', 'vegetarian', 'vegan', 'keto', 'other']
    },
    stress: {
      type: Number,
      min: 1,
      max: 10
    },
    sleep: {
      type: Number,
      min: 0,
      max: 24
    }
  },
  riskAssessment: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    level: {
      type: String,
      enum: ['minimal', 'low', 'moderate', 'high']
    },
    factors: [{
      type: String
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  diagnosticHistory: [{
    score: Number,
    level: String,
    diagnosis: String,
    severity: String,
    tabular_score: Number,
    image_score: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

/**
 * Static method to atomically fetch or create a user's HealthData record.
 * Uses findOneAndUpdate with upsert to prevent duplicate record race conditions.
 * @param {string|mongoose.Types.ObjectId} userId
 */
HealthDataSchema.statics.getOrCreate = async function (userId) {
  return await this.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
        cycleData: [],
        symptoms: [],
        lifestyleFactors: {},
        riskAssessment: {},
        diagnosticHistory: []
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

module.exports = mongoose.model('HealthData', HealthDataSchema);