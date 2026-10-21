import React, { useState } from 'react';
import { apiRequest } from '../../api';

const Assessment = ({ userData = {}, setUserData, symptomOptions = [], lifestyleOptions = [], calculateBMI }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = value;
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
      if (Number.isNaN(parsedValue)) parsedValue = '';
    }
    if (setUserData) {
      setUserData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const ageNum = Number(userData.age);
    const heightNum = Number(userData.height);
    const weightNum = Number(userData.weight);
    const cycleNum = Number(userData.cycle || (userData.cycleRegularity === 'regular' ? 28 : 35));
    const ratioNum = Number(userData.ratio || 0.85);

    const formData = {};
    if (Number.isFinite(ageNum) && ageNum >= 10 && ageNum <= 60) formData.age = ageNum;
    if (Number.isFinite(heightNum) && heightNum >= 120 && heightNum <= 220) formData.height = heightNum;
    if (Number.isFinite(weightNum) && weightNum >= 25 && weightNum <= 200) formData.weight = weightNum;
    if (Number.isFinite(cycleNum) && cycleNum >= 15 && cycleNum <= 90) formData.cycle = cycleNum;
    if (Number.isFinite(ratioNum) && ratioNum >= 0.5 && ratioNum <= 1.5) formData.ratio = ratioNum;

    try {
      const data = await apiRequest('/api/assess', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setResult(data);

      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch (err) {
      console.error('Assessment submission error:', err);
      setError(err.message || 'Failed to complete risk assessment. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomChange = (symptom) => {
    if (!setUserData) return;
    setUserData(prev => {
      const current = prev.symptoms || [];
      const exists = current.includes(symptom);
      const updated = exists ? current.filter(s => s !== symptom) : [...current, symptom];
      return { ...prev, symptoms: updated };
    });
  };

  const handleLifestyleChange = (factor) => {
    if (!setUserData) return;
    setUserData(prev => {
      const current = prev.lifestyleFactors || [];
      const exists = current.includes(factor);
      const updated = exists ? current.filter(f => f !== factor) : [...current, factor];
      return { ...prev, lifestyleFactors: updated };
    });
  };

  const getSeverityColor = (severity) => {
    switch (String(severity || '').toLowerCase()) {
      case 'high':
        return 'text-rose-400';
      case 'moderate':
        return 'text-amber-400';
      case 'low':
      case 'minimal':
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-teal-400 mb-6">PCOS Risk Assessment</h2>
      
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Age (10–60 yrs)</label>
          <input
            type="number"
            name="age"
            min="10"
            max="60"
            step="1"
            value={userData.age ?? ''}
            onChange={handleInputChange}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
            placeholder="e.g. 25"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Weight (25–200 kg)</label>
            <input
              type="number"
              name="weight"
              min="25"
              max="200"
              step="0.1"
              value={userData.weight ?? ''}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
              placeholder="e.g. 62"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Height (120–220 cm)</label>
            <input
              type="number"
              name="height"
              min="120"
              max="220"
              step="0.5"
              value={userData.height ?? ''}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
              placeholder="e.g. 165"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Cycle Length (15–90 days)</label>
            <input
              type="number"
              name="cycle"
              min="15"
              max="90"
              step="1"
              value={userData.cycle ?? ''}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
              placeholder="e.g. 28"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Waist:Hip Ratio (0.5–1.5)</label>
            <input
              type="number"
              name="ratio"
              min="0.5"
              max="1.5"
              step="0.01"
              value={userData.ratio ?? ''}
              onChange={handleInputChange}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
              placeholder="e.g. 0.85"
            />
          </div>
        </div>

        {userData.weight && userData.height && calculateBMI && (
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg text-sm text-slate-300">
            Calculated BMI: <span className="font-semibold text-teal-300">{calculateBMI()}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Menstrual Cycle Regularity</label>
          <select
            name="cycleRegularity"
            value={userData.cycleRegularity || ''}
            onChange={(e) => setUserData && setUserData(prev => ({ ...prev, cycleRegularity: e.target.value }))}
            className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400"
          >
            <option value="">Select regularity</option>
            <option value="regular">Regular (21–35 days)</option>
            <option value="irregular">Irregular (&gt;35 days)</option>
            <option value="absent">Absent (amenorrhea)</option>
          </select>
        </div>

        {symptomOptions && symptomOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-200">Reported Symptoms</label>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map(symptom => (
                <label key={symptom} className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/60 text-slate-300 text-sm cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={(userData.symptoms || []).includes(symptom)}
                    onChange={() => handleSymptomChange(symptom)}
                    className="rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                  />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {lifestyleOptions && lifestyleOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-200">Lifestyle Habits</label>
            <div className="grid grid-cols-2 gap-2">
              {lifestyleOptions.map(factor => (
                <label key={factor} className="flex items-center gap-2 p-2 rounded bg-slate-800/50 border border-slate-700/60 text-slate-300 text-sm cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={(userData.lifestyleFactors || []).includes(factor)}
                    onChange={() => handleLifestyleChange(factor)}
                    className="rounded border-slate-600 text-teal-500 focus:ring-teal-400"
                  />
                  <span>{factor}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex flex-col gap-2">
            <span>{error}</span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="self-start text-xs font-semibold px-3 py-1 bg-rose-700 text-white rounded hover:bg-rose-600 transition"
            >
              Retry
            </button>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-300 shadow-md ${
            loading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-teal-500 text-slate-950 hover:bg-teal-400 hover:shadow-teal-500/25'
          }`}
        >
          {loading ? 'Evaluating Risk Profile...' : 'Assess My Risk'}
        </button>

        {result && (
          <div className="mt-4 p-6 rounded-xl bg-slate-800/90 shadow-xl border border-slate-700 flex flex-col gap-3">
            <h3 className="text-xl font-bold text-white">Assessment Result</h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Diagnosis / Summary:</span>
              <span className="text-white font-medium">{result.diagnosis || 'Analysis completed'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Severity:</span>
              <span className={`font-bold ${getSeverityColor(result.severity)}`}>
                {result.severity || 'Undetermined'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">Risk score:</span>
              <span className="text-white font-semibold">{result.risk_score ?? result.confidence ?? 0}%</span>
            </div>
            {result.message && (
              <p className="text-xs text-slate-300 mt-2 p-2.5 bg-slate-900/60 rounded border border-slate-700/60">
                {result.message}
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed text-center mt-2 border-t border-slate-800 pt-4">
          ⚠️ <strong>Medical Disclaimer:</strong> This tool is for educational and screening purposes only and is not a clinical medical diagnosis. Always consult a licensed healthcare professional for medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
};

export default Assessment;