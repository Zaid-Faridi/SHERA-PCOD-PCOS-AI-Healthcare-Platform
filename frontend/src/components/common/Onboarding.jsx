import React, { useState, useRef } from 'react';
import { apiRequest } from '../../api';

/* ─────────────────────────────────────────────────
   ICON SYSTEM
   ───────────────────────────────────────────────── */
const Ic = ({ n, s = 18, c = 'currentColor' }) => {
  const p = {
    user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    weight:   <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    ruler:    <><path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/></>,
    heart:    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" stroke="none"/>,
    heartOut: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    lock:     <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    check:    <polyline points="20 6 9 11 4 16"/>,
    checkC:   <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    arrowR:   <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>,</>,
    arrowL:   <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>,</>,
    dna:      <><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/></>,
    steth:    <><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></>,
    leaf:     <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>,
    sparkle:  <><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    moon:     <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
    sun:      <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
    flower:   <><circle cx="12" cy="12" r="3"/><path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4-4z"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    brain:    <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></>,
    zap:      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    x:        <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>,
    award:    <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    blood:    <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    image:    <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24"
      fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {p[n]}
    </svg>
  );
};

/* ─────────────────────────────────────────────────
   PREMIUM INPUT COMPONENT
   ───────────────────────────────────────────────── */
const PInput = ({ icon, label, type = 'text', name, value, onChange, placeholder, min, max, required, hint }) => {
  const [focused, setFocused] = useState(false);
  const filled = value !== '' && value !== undefined;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: '0.72rem', fontWeight: 800,
        color: focused ? '#E11D48' : '#6B2A5F',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        marginBottom: 8, transition: 'color 0.2s ease',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            transition: 'color 0.2s ease',
          }}>
            <Ic n={icon} s={16} c={focused ? '#E11D48' : '#9B6B8A'}/>
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          min={min}
          max={max}
          required={required}
          style={{
            width: '100%',
            padding: icon ? '13px 44px 13px 42px' : '13px 44px 13px 16px',
            borderRadius: 14,
            border: `1.5px solid ${focused ? 'rgba(225,29,72,0.55)' : filled ? 'rgba(236,72,153,0.28)' : 'rgba(236,72,153,0.16)'}`,
            background: focused ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.925rem', color: '#1A0A2E', outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(225,29,72,0.10)' : 'none',
            transition: 'all 0.25s ease',
          }}
        />
        {filled && !focused && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <Ic n="checkC" s={15} c="#059669"/>
          </div>
        )}
      </div>
      {hint && (
        <p style={{ fontSize: '0.72rem', color: '#9B6B8A', marginTop: 5, marginLeft: 2 }}>{hint}</p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────
   CHIP SELECT (for radio buttons)
   ───────────────────────────────────────────────── */
const ChipRadio = ({ name, value, checked, onChange, label, sub, accent = '#E11D48' }) => (
  <label style={{
    flex: '1 1 100px', padding: '16px 14px', borderRadius: 16, cursor: 'pointer',
    border: `2px solid ${checked ? accent : 'rgba(236,72,153,0.14)'}`,
    background: checked
      ? `linear-gradient(135deg,${accent}10,${accent}06)`
      : 'rgba(255,255,255,0.70)',
    textAlign: 'center', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    transform: checked ? 'scale(1.03)' : 'scale(1)',
    boxShadow: checked ? `0 4px 16px ${accent}20` : 'none',
  }}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ display: 'none' }}/>
    <div style={{ fontWeight: 800, fontSize: '1rem', color: checked ? accent : '#1A0A2E', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: checked ? accent : '#9B6B8A' }}>{sub}</div>
  </label>
);

/* ─────────────────────────────────────────────────
   TOGGLE CHIP (for checkboxes)
   ───────────────────────────────────────────────── */
const ToggleChip = ({ name, value, checked, onChange, label, accent = '#E11D48' }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
    border: `1.5px solid ${checked ? accent : 'rgba(236,72,153,0.14)'}`,
    background: checked ? `${accent}0D` : 'rgba(255,255,255,0.70)',
    transition: 'all 0.22s ease',
  }}>
    <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} style={{ display: 'none' }}/>
    <div style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
      border: `2px solid ${checked ? accent : 'rgba(236,72,153,0.25)'}`,
      background: checked ? accent : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease',
    }}>
      {checked && <Ic n="check" s={11} c="white"/>}
    </div>
    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: checked ? '#1A0A2E' : '#6B2A5F' }}>{label}</span>
  </label>
);

/* ─────────────────────────────────────────────────
   STEP DEFINITIONS
   ───────────────────────────────────────────────── */
const STEPS = [
  { num: 1, label: 'About You',      icon: 'user',      short: 'About You' },
  { num: 2, label: 'Medical History', icon: 'steth',   short: 'Medical' },
  { num: 3, label: 'Lifestyle',     icon: 'leaf',       short: 'Lifestyle' },
  { num: 4, label: 'Symptoms',      icon: 'flower',     short: 'Symptoms' },
  { num: 5, label: 'AI Review',     icon: 'brain',      short: 'Review' },
];

/* ─────────────────────────────────────────────────
   MAIN ONBOARDING COMPONENT
   All original state and logic preserved exactly.
   ───────────────────────────────────────────────── */
const Onboarding = ({ setActiveTab, setUserData, imageFile, setImageFile, setRiskAssessment }) => {

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  /* ══ ORIGINAL STATE — UNTOUCHED ══ */
  const [step, setStep]         = useState(1);
  const [formData, setFormData] = useState({
    name:              '',
    age:               '',
    weight:            '',
    height:            '',
    condition:         'unknown',
    familyHistory:     false,
    lifestyleFactors:  [],
    symptoms:          []
  });

  /* ══ ORIGINAL OPTIONS — UNTOUCHED ══ */
  const lifestyleOptions = [
    'Sedentary lifestyle','High sugar diet','Stressful job/life',
    'Irregular sleep','Smoking','Alcohol consumption',
    'Regular exercise','Balanced diet'
  ];

  const symptomOptions = [
    'Irregular periods','Heavy bleeding','Acne','Weight gain',
    'Hair loss','Excess hair growth','Fatigue','Mood swings',
    'Pelvic pain','Headaches','None of the above'
  ];

  /* ══ ORIGINAL HANDLERS — UNTOUCHED ══ */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'lifestyleFactors' || name === 'symptoms') {
        setFormData(prev => {
          const updatedArray = checked
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value);
          return { ...prev, [name]: updatedArray };
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.age || !formData.weight || !formData.height) {
        alert("Please fill out all About You details before proceeding.");
        return;
      }
    } else if (step === 2) {
      if (!formData.condition) {
        alert("Please select a condition before proceeding.");
        return;
      }
    } else if (step === 3) {
      if (formData.lifestyleFactors.length === 0) {
        alert("Please select at least one lifestyle factor before proceeding.");
        return;
      }
    } else if (step === 4) {
      if (formData.symptoms.length === 0) {
        alert("Please select at least one symptom before proceeding.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserData(formData);
    setIsAnalyzing(true);
    
    try {
      const payload = {
        " Age (yrs)": formData.age,
        "Weight (Kg)": formData.weight,
        "Height(Cm) ": formData.height,
        "BMI": formData.weight / ((formData.height/100) * (formData.height/100)),
        "Blood Group": 11,
        "Cycle(R/I)": formData.symptoms?.includes('Irregular periods') ? 4 : 2,
        "Weight gain(Y/N)": formData.symptoms?.includes('Weight gain') ? 1 : 0,
        "hair growth(Y/N)": formData.symptoms?.includes('Excess hair growth') ? 1 : 0,
        "Hair loss(Y/N)": formData.symptoms?.includes('Hair loss') ? 1 : 0,
        "Pimples(Y/N)": formData.symptoms?.includes('Acne') ? 1 : 0,
        "Fast food (Y/N)": formData.lifestyleFactors?.includes('High sugar diet') ? 1 : 0,
        "Reg.Exercise(Y/N)": formData.lifestyleFactors?.includes('Regular exercise') ? 1 : 0
      };
      
      const payloadData = new FormData();
      if (imageFile) {
        payloadData.append('file', imageFile);
      }
      payloadData.append('clinical_data', JSON.stringify(payload));

      const data = await apiRequest('/api/assess', {
        method: 'POST',
        body: payloadData
      });

      let riskLevel = "Low";
      if (data.risk_score > 70) riskLevel = "High";
      else if (data.risk_score > 30) riskLevel = "Moderate";

      const finalResult = {
        score: Math.round(data.risk_score),
        tabular_score: Math.round(data.tabular_risk),
        image_score: Math.round(data.image_risk),
        level: riskLevel,
        diagnosis: data.diagnosis,
        severity: data.severity,
        confidence: data.confidence,
        image_provided: data.image_provided,
        limited_input: data.limited_input,
        recommendation: data.message,
        formData: formData
      };
      
      setRiskAssessment(finalResult);
      setActiveTab('results');
    } catch (err) {
      console.error(err);
      alert("Failed to reach AI Backend. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return null;
  };
  /* ══ END ORIGINAL LOGIC ══ */

  const bmi = calculateBMI();
  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#0EA5E9' }
    : bmi < 25   ? { label: 'Healthy',     color: '#059669' }
    : bmi < 30   ? { label: 'Overweight',  color: '#D97706' }
    :              { label: 'Obese',        color: '#E11D48' }
    : null;

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  /* AI Readiness score for step 5 */
  const readinessItems = [
    { key: 'name', val: formData.name },
    { key: 'age', val: formData.age },
    { key: 'weight', val: formData.weight },
    { key: 'height', val: formData.height },
    { key: 'condition', val: formData.condition !== 'unknown' },
    { key: 'lifestyle', val: formData.lifestyleFactors.length > 0 },
    { key: 'symptoms', val: formData.symptoms.length > 0 },
  ];
  const filledCount   = readinessItems.filter(i => i.val).length;
  const readinessPct  = Math.round((filledCount / readinessItems.length) * 100);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ══════════════════════════════════
          AMBIENT BACKGROUND ORBS
          ══════════════════════════════════ */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.07),transparent 70%)', filter: 'blur(40px)' }}/>
        <div style={{ position: 'absolute', bottom: '5%', right: '-8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.06),transparent 70%)', filter: 'blur(40px)' }}/>
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,207,232,0.12),transparent 70%)', filter: 'blur(30px)' }}/>
      </div>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)',
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.4fr) 320px',
        gap: 28, alignItems: 'start',
      }} className="onboarding-grid">

        {/* ════════════════════
            LEFT — MAIN FORM
            ════════════════════ */}
        <div>
          {/* ── TOP HERO ── */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(225,29,72,0.92),rgba(168,85,247,0.88))',
            borderRadius: '28px 28px 0 0',
            padding: 'clamp(28px,4vw,44px)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
            <div style={{ position: 'absolute', bottom: -30, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>

            {/* Floating AI clipboard illustration */}
            <div style={{
              position: 'absolute', right: 'clamp(20px,5%,60px)', top: '50%', transform: 'translateY(-50%)',
              animation: 'floatY 5s ease-in-out infinite',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {/* Clipboard */}
              <div style={{
                width: 80, height: 90, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.30)',
                backdropFilter: 'blur(10px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                <Ic n="clipboard" s={28} c="rgba(255,255,255,0.9)"/>
                <div style={{ width: 44, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.40)' }}/>
                <div style={{ width: 36, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.25)' }}/>
              </div>
              {/* Floating hearts */}
              {[[20, -15, '1.5s'], [-10, 20, '2.5s'], [35, 30, '0.8s']].map(([x, y, delay], i) => (
                <div key={i} style={{
                  position: 'absolute', left: x, top: y,
                  animation: `floatY 3s ${delay} ease-in-out infinite`,
                  opacity: 0.7,
                }}>
                  <Ic n="heart" s={12} c="rgba(255,255,255,0.8)"/>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', maxWidth: '65%' }}>
              {/* Security badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999, marginBottom: 16,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: '0.7rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em',
              }}>
                <Ic n="lock" s={11} c="white"/> End-to-End Encrypted
              </div>

              <h1 style={{
                fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2.2rem)',
                color: 'white', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.15,
              }}>
                Create Clinical Profile
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.82)', fontSize: '0.9rem',
                lineHeight: 1.65, maxWidth: 380,
              }}>
                Help us understand your health better. Your information is encrypted
                and used only for personalized AI-powered insights.
              </p>
            </div>
          </div>

          {/* ── STEP PROGRESS BAR ── */}
          <div style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(236,72,153,0.12)',
            borderRight: '1px solid rgba(236,72,153,0.12)',
            padding: '24px clamp(20px,4vw,40px)',
            borderBottom: '1px solid rgba(236,72,153,0.08)',
          }}>
            {/* Step labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 4 }}>
              {STEPS.map(s => (
                <div key={s.num} style={{
                  flex: 1, textAlign: 'center',
                  opacity: step < s.num ? 0.4 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, margin: '0 auto 6px',
                    background: step > s.num
                      ? 'linear-gradient(135deg,#059669,#34D399)'
                      : step === s.num
                        ? 'linear-gradient(135deg,#E11D48,#EC4899)'
                        : 'rgba(236,72,153,0.10)',
                    border: step === s.num ? 'none' : step > s.num ? 'none' : '1.5px solid rgba(236,72,153,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: step === s.num ? '0 4px 14px rgba(225,29,72,0.30)' : 'none',
                    transition: 'all 0.4s ease',
                  }}>
                    {step > s.num
                      ? <Ic n="check" s={14} c="white"/>
                      : <Ic n={s.icon} s={14} c={step === s.num ? 'white' : '#9B6B8A'}/>
                    }
                  </div>
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em',
                    color: step === s.num ? '#E11D48' : step > s.num ? '#059669' : '#9B6B8A',
                    transition: 'color 0.3s ease', lineHeight: 1.3,
                    display: 'none',
                  }} className="step-label">
                    {s.short}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress track */}
            <div style={{ height: 5, borderRadius: 999, background: 'rgba(236,72,153,0.10)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg,#E11D48,#EC4899,#A855F7)',
                width: `${progressPct}%`,
                transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: '0 0 10px rgba(225,29,72,0.35)',
              }}/>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#9B6B8A', fontWeight: 600 }}>
                Step {step} of {STEPS.length}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#E11D48', fontWeight: 700 }}>
                {STEPS[step - 1].label}
              </span>
            </div>
          </div>

          {/* ── MAIN FORM CARD ── */}
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236,72,153,0.12)',
            borderTop: 'none',
            borderRadius: '0 0 28px 28px',
            padding: 'clamp(24px,4vw,40px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
          }}>
            <form onSubmit={handleSubmit}>

              {/* ══════════ STEP 1: DEMOGRAPHICS ══════════ */}
              {step === 1 && (
                <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#E11D48,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic n="user" s={16} c="white"/>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A0A2E' }}>About You</h3>
                  </div>

                  <PInput icon="user" label="Full Name" name="name" value={formData.name}
                    onChange={handleChange} placeholder="Enter your full name" required
                    hint="This name will appear on your health reports"/>

                  <PInput icon="calendar" label="Age" type="number" name="age" value={formData.age}
                    onChange={handleChange} placeholder="Enter your age" min="12" max="80" required
                    hint="Age helps calibrate hormonal reference ranges"/>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <PInput icon="weight" label="Weight (kg)" type="number" name="weight" value={formData.weight}
                      onChange={handleChange} placeholder="e.g. 62" min="30" max="200" required/>
                    <PInput icon="ruler" label="Height (cm)" type="number" name="height" value={formData.height}
                      onChange={handleChange} placeholder="e.g. 163" min="120" max="220" required/>
                  </div>

                  {/* BMI card — preserves original calculateBMI() */}
                  {bmi && (
                    <div style={{
                      marginTop: 8, padding: '20px 22px', borderRadius: 18,
                      background: `linear-gradient(135deg,${bmiCategory.color}10,${bmiCategory.color}06)`,
                      border: `1px solid ${bmiCategory.color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      animation: 'fadeInUp 0.3s ease both',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: bmiCategory.color, marginBottom: 4 }}>
                          Calculated BMI
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '2.2rem', color: bmiCategory.color, lineHeight: 1 }}>{bmi}</div>
                      </div>
                      <div style={{
                        padding: '6px 16px', borderRadius: 999,
                        background: `${bmiCategory.color}14`,
                        border: `1px solid ${bmiCategory.color}30`,
                        fontWeight: 800, fontSize: '0.82rem', color: bmiCategory.color,
                      }}>
                        {bmiCategory.label}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════ STEP 2: MEDICAL HISTORY ══════════ */}
              {step === 2 && (
                <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic n="steth" s={16} c="white"/>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A0A2E' }}>Medical History</h3>
                  </div>

                  {/* Condition selector — preserves original radio logic */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#6B2A5F', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                      Do you have an existing diagnosis?
                    </label>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <ChipRadio name="condition" value="pcos" checked={formData.condition === 'pcos'} onChange={handleChange} label="PCOS" sub="Diagnosed" accent="#E11D48"/>
                      <ChipRadio name="condition" value="pcod" checked={formData.condition === 'pcod'} onChange={handleChange} label="PCOD" sub="Diagnosed" accent="#7C3AED"/>
                      <ChipRadio name="condition" value="unknown" checked={formData.condition === 'unknown'} onChange={handleChange} label="None" sub="Undiagnosed" accent="#6B7280"/>
                    </div>
                  </div>

                  {/* Family history — preserves original checkbox logic */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#6B2A5F', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                      Family History
                    </label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                      border: `2px solid ${formData.familyHistory ? 'rgba(225,29,72,0.35)' : 'rgba(236,72,153,0.14)'}`,
                      background: formData.familyHistory ? 'rgba(225,29,72,0.06)' : 'rgba(255,255,255,0.70)',
                      transition: 'all 0.25s ease',
                    }}>
                      <input type="checkbox" name="familyHistory" checked={formData.familyHistory} onChange={handleChange} style={{ display: 'none' }}/>
                      <div style={{
                        width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                        border: `2px solid ${formData.familyHistory ? '#E11D48' : 'rgba(236,72,153,0.25)'}`,
                        background: formData.familyHistory ? '#E11D48' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}>
                        {formData.familyHistory && <Ic n="check" s={13} c="white"/>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1A0A2E' }}>Family history of PCOS/PCOD</div>
                        <div style={{ fontSize: '0.75rem', color: '#9B6B8A', marginTop: 2 }}>
                          Having a first-degree relative with PCOS increases your risk by 50%
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Info box */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 14,
                    background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.14)',
                    display: 'flex', gap: 12,
                  }}>
                    <Ic n="info" s={16} c="#7C3AED"/>
                    <p style={{ fontSize: '0.8rem', color: '#6B2A5F', lineHeight: 1.65, margin: 0 }}>
                      Genetic predisposition is one of the strongest predictors of PCOS. Our AI uses this
                      data to calibrate your risk assessment more precisely.
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════ STEP 3: LIFESTYLE ══════════ */}
              {step === 3 && (
                <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#059669,#34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic n="leaf" s={16} c="white"/>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A0A2E' }}>Lifestyle & Habits</h3>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#6B2A5F', lineHeight: 1.7, marginBottom: 24 }}>
                    Select all lifestyle factors that apply to you. This helps our AI understand
                    the environmental contributors to your hormonal health.
                  </p>

                  {/* Lifestyle checkboxes — preserves original name="lifestyleFactors" logic */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                    {lifestyleOptions.map(option => (
                      <ToggleChip key={option}
                        name="lifestyleFactors" value={option}
                        checked={formData.lifestyleFactors.includes(option)}
                        onChange={handleChange} label={option}
                        accent={['Regular exercise','Balanced diet'].includes(option) ? '#059669' : '#E11D48'}
                      />
                    ))}
                  </div>

                  {formData.lifestyleFactors.length > 0 && (
                    <div style={{
                      marginTop: 20, padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)',
                      fontSize: '0.8rem', color: '#059669', fontWeight: 600,
                    }}>
                      {formData.lifestyleFactors.length} factor{formData.lifestyleFactors.length > 1 ? 's' : ''} selected ✓
                    </div>
                  )}
                </div>
              )}

              {/* ══════════ STEP 4: SYMPTOMS ══════════ */}
              {step === 4 && (
                <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#EC4899,#DB2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic n="flower" s={16} c="white"/>
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A0A2E' }}>Symptoms & Menstrual Health</h3>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#6B2A5F', lineHeight: 1.7, marginBottom: 24 }}>
                    Select all symptoms you are currently experiencing or have experienced
                    regularly. Be as accurate as possible — this directly influences your AI prediction.
                  </p>

                  {/* Symptom checkboxes — preserves original name="symptoms" logic */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                    {symptomOptions.map(option => (
                      <ToggleChip key={option}
                        name="symptoms" value={option}
                        checked={formData.symptoms.includes(option)}
                        onChange={handleChange} label={option}
                        accent={option === 'None of the above' ? '#6B7280' : '#EC4899'}
                      />
                    ))}
                  </div>

                  {formData.symptoms.length > 0 && (
                    <div style={{
                      marginTop: 20, padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.18)',
                      fontSize: '0.8rem', color: '#E11D48', fontWeight: 600,
                    }}>
                      {formData.symptoms.length} symptom{formData.symptoms.length > 1 ? 's' : ''} selected ✓
                    </div>
                  )}
                </div>
              )}

              {/* ══════════ STEP 5: REVIEW ══════════ */}
              {step === 5 && (
                <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
                  {isAnalyzing ? (
                    /* ── AI LOADING STATE ── */
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: '56px 24px', gap: 24, textAlign: 'center'
                    }}>
                      <div style={{ position: 'relative', width: 80, height: 80 }}>
                        <div style={{
                          width: 80, height: 80, borderRadius: '50%',
                          border: '4px solid transparent',
                          borderTopColor: '#E11D48',
                          borderRightColor: '#7C3AED',
                          borderBottomColor: '#EC4899',
                          borderLeftColor: '#A855F7',
                          animation: 'spin 0.9s linear infinite',
                        }}/>
                        <div style={{
                          position: 'absolute', inset: 12, borderRadius: '50%',
                          border: '2px solid rgba(236,72,153,0.15)',
                        }}/>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ic n="brain" s={24} c="#E11D48"/>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1A0A2E', marginBottom: 6 }}>
                          AI is analyzing your profile...
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#9B6B8A' }}>
                          Evaluating clinical symptoms {imageFile && "and ultrasound image "}with dual models.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                        {['Parsing Data', 'Running AI Models', 'Generating Results'].map((s, i) => (
                           <div key={i} style={{
                             display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#9B6B8A',
                             animation: `fadeInUp 0.5s ${i * 0.4}s ease both`
                           }}>
                             <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#E11D48,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <Ic n="check" s={10} c="white"/>
                             </div>
                             {s}
                           </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ic n="brain" s={16} c="white"/>
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A0A2E' }}>Review & AI Ready</h3>
                      </div>

                      {/* AI Readiness gauge */}
                      <div style={{
                        padding: '24px', borderRadius: 20,
                        background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(236,72,153,0.06))',
                        border: '1px solid rgba(124,58,237,0.20)',
                        marginBottom: 24, textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C3AED', marginBottom: 12 }}>
                          AI Readiness Score
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '3rem', color: '#7C3AED', lineHeight: 1, marginBottom: 8 }}>
                          {readinessPct}%
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: 'rgba(124,58,237,0.12)', overflow: 'hidden', maxWidth: 280, margin: '0 auto 12px' }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            background: 'linear-gradient(90deg,#7C3AED,#EC4899)',
                            width: `${readinessPct}%`,
                            transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
                            boxShadow: '0 0 10px rgba(124,58,237,0.40)',
                          }}/>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6B2A5F' }}>
                          {readinessPct === 100 ? '✨ Your profile is complete and ready for AI analysis!' : 'Complete more fields for better AI accuracy.'}
                        </p>
                      </div>

                      {/* OPTIONAL ULTRASOUND UPLOAD */}
                      <div style={{
                        padding: '20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.7)',
                        border: '1px dashed rgba(236,72,153,0.3)',
                        marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                      }}>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={e => {
                          if (e.target.files[0]) setImageFile(e.target.files[0]);
                        }} style={{ display: 'none' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ic n="image" s={20} c="#E11D48"/>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1A0A2E' }}>Optional: Ultrasound Image</div>
                            <div style={{ fontSize: '0.75rem', color: '#9B6B8A' }}>Increase accuracy with dual-model analysis</div>
                          </div>
                        </div>

                        {imageFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(5,150,105,0.1)', color: '#059669', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700 }}>
                              ✓ {imageFile.name} attached
                            </div>
                            <button type="button" onClick={() => setImageFile(null)} style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Remove</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => fileInputRef.current.click()} style={{
                            padding: '8px 24px', borderRadius: 12, border: '1px solid #EC4899', background: 'transparent', color: '#E11D48', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: 8
                          }}>
                            Select Image
                          </button>
                        )}
                      </div>

                      {/* Summary grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
                        {[
                          { label: 'Name',      val: formData.name || '—',      icon: 'user',     col: '#E11D48' },
                          { label: 'Age',       val: formData.age ? `${formData.age} years` : '—', icon: 'calendar', col: '#7C3AED' },
                          { label: 'BMI',       val: bmi ? `${bmi} (${bmiCategory.label})` : '—', icon: 'activity', col: bmi ? bmiCategory.color : '#9B6B8A' },
                          { label: 'Condition', val: formData.condition === 'unknown' ? 'Undiagnosed' : formData.condition.toUpperCase(), icon: 'steth', col: '#059669' },
                          { label: 'Lifestyle', val: formData.lifestyleFactors.length > 0 ? `${formData.lifestyleFactors.length} selected` : 'None', icon: 'leaf', col: '#059669' },
                          { label: 'Symptoms',  val: formData.symptoms.length > 0 ? `${formData.symptoms.length} selected` : 'None', icon: 'flower', col: '#EC4899' },
                        ].map((s, i) => (
                          <div key={i} style={{
                            padding: '16px', borderRadius: 16,
                            background: 'rgba(255,255,255,0.85)',
                            border: '1px solid rgba(236,72,153,0.10)',
                            display: 'flex', flexDirection: 'column', gap: 6,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <Ic n={s.icon} s={13} c={s.col}/>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9B6B8A' }}>{s.label}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A0A2E' }}>{s.val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Confirm note */}
                      <div style={{
                        padding: '16px 18px', borderRadius: 14,
                        background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.18)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                      }}>
                        <Ic n="checkC" s={18} c="#059669"/>
                        <p style={{ fontSize: '0.8rem', color: '#065F46', lineHeight: 1.65, margin: 0 }}>
                          By submitting, you confirm this information is accurate. Your data is processed
                          securely and used exclusively to generate your personalized PCOS/PCOD risk assessment.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── NAVIGATION BUTTONS — EXACT ORIGINAL LOGIC ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, paddingTop: 24, borderTop: '1px solid rgba(236,72,153,0.10)' }}>
                {/* Left: Cancel or Back */}
                {step > 1 ? (
                  <button type="button" onClick={prevStep}
                    style={{
                      padding: '12px 24px', borderRadius: 14,
                      border: '1.5px solid rgba(236,72,153,0.22)',
                      background: 'transparent', color: '#6B2A5F',
                      fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    ← Back
                  </button>
                ) : (
                  /* Cancel → setActiveTab('home') preserved */
                  <button type="button" onClick={() => setActiveTab('home')}
                    style={{
                      padding: '12px 24px', borderRadius: 14,
                      border: '1.5px solid rgba(107,114,128,0.20)',
                      background: 'transparent', color: '#9B6B8A',
                      fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(107,114,128,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    Cancel
                  </button>
                )}

                {/* Right: Proceed or Initialize Profile (submit) */}
                {step < 5 ? (
                  /* Proceed → nextStep() preserved */
                  <button type="button" onClick={nextStep}
                    style={{
                      padding: '13px 32px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#E11D48,#EC4899)',
                      color: 'white', fontWeight: 800, fontSize: '0.95rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                      boxShadow: '0 6px 20px rgba(225,29,72,0.30)',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(225,29,72,0.38)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(225,29,72,0.30)'; }}>
                    Proceed <Ic n="arrowR" s={16} c="white"/>
                  </button>
                ) : (
                  /* Submit → handleSubmit() → setUserData + setActiveTab('assessment') */
                  <button type="submit"
                    style={{
                      padding: '13px 36px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#7C3AED,#E11D48)',
                      color: 'white', fontWeight: 800, fontSize: '0.95rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                      boxShadow: '0 6px 24px rgba(124,58,237,0.35)',
                      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.35)'; }}>
                    <Ic n="sparkle" s={16} c="white"/> Initialize Profile
                  </button>
                )}
              </div>
            </form>

            {/* Why we ask */}
            <div style={{
              marginTop: 28, padding: '20px 22px', borderRadius: 18,
              background: 'linear-gradient(135deg,rgba(251,207,232,0.30),rgba(237,233,254,0.20))',
              border: '1px solid rgba(236,72,153,0.12)',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg,#FB7185,#E11D48)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n="info" s={17} c="white"/>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1A0A2E', marginBottom: 6 }}>Why do we ask for this information?</div>
                <p style={{ fontSize: '0.8rem', color: '#6B2A5F', lineHeight: 1.7, margin: 0 }}>
                  Your health profile allows our dual AI models to generate more accurate PCOS/PCOD predictions
                  and personalized recommendations tailored specifically to your clinical picture.
                </p>
              </div>
            </div>

            {/* Trust row */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                <Ic n="lock" s={14} c="#9B6B8A"/>
                <span style={{ fontSize: '0.78rem', color: '#9B6B8A', fontWeight: 600 }}>
                  Your health information is encrypted and securely stored
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['HIPAA Compliant', 'Privacy First', 'AES-256 Encrypted'].map((t, i) => (
                  <span key={i} style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                    background: 'rgba(236,72,153,0.06)',
                    border: '1px solid rgba(236,72,153,0.14)',
                    color: '#9B6B8A',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════
            RIGHT SIDEBAR
            ════════════════════ */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

          {/* Card 1: Progress Timeline */}
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(236,72,153,0.12)',
            borderRadius: 24, padding: '24px 22px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1A0A2E', marginBottom: 22 }}>Your Progress</div>
            {STEPS.map((s, i) => {
              const done    = step > s.num;
              const current = step === s.num;
              const future  = step < s.num;
              return (
                <div key={s.num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? 6 : 0 }}>
                  {/* Icon + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                      background: done
                        ? 'linear-gradient(135deg,#34D399,#059669)'
                        : current
                          ? 'linear-gradient(135deg,#E11D48,#EC4899)'
                          : 'rgba(236,72,153,0.08)',
                      border: future ? '1.5px solid rgba(236,72,153,0.18)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? '0 4px 12px rgba(225,29,72,0.28)' : 'none',
                      transition: 'all 0.4s ease',
                    }}>
                      {done
                        ? <Ic n="check" s={13} c="white"/>
                        : <Ic n={s.icon} s={13} c={current ? 'white' : '#9B6B8A'}/>
                      }
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{
                        width: 2, height: 24, margin: '4px 0',
                        background: done ? 'linear-gradient(180deg,#059669,#34D399)' : 'rgba(236,72,153,0.12)',
                        borderRadius: 999, transition: 'background 0.4s ease',
                      }}/>
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ paddingTop: 4, paddingBottom: i < STEPS.length - 1 ? 24 : 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.84rem',
                      color: done ? '#059669' : current ? '#E11D48' : '#9B6B8A',
                      transition: 'color 0.3s ease',
                    }}>{s.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#C4A4C0', fontWeight: 500, marginTop: 1 }}>{s.short}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card 2: Data Protection */}
          <div style={{
            background: 'linear-gradient(145deg,rgba(124,58,237,0.07),rgba(236,72,153,0.05))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(124,58,237,0.18)',
            borderRadius: 24, padding: '24px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n="shield" s={18} c="white"/>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1A0A2E' }}>Your Data is Protected</div>
            </div>

            {[
              'End-to-End Encryption',
              'HIPAA Compliant',
              'No data shared with third parties',
              'You control your information',
              'Right to deletion on request',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0',
                borderBottom: i < 4 ? '1px solid rgba(124,58,237,0.08)' : 'none',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: 'rgba(5,150,105,0.10)',
                  border: '1px solid rgba(5,150,105,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Ic n="check" s={10} c="#059669"/>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1A0A2E' }}>{item}</span>
              </div>
            ))}

            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 12,
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)',
              fontSize: '0.72rem', color: '#B45309', lineHeight: 1.55, fontWeight: 500,
            }}>
              ⚕️ This platform is for educational AI screening only — not a medical diagnosis.
            </div>
          </div>

          {/* Card 3: Quick tips */}
          <div style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(236,72,153,0.10)',
            borderRadius: 24, padding: '22px',
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1A0A2E', marginBottom: 14 }}>
              💡 For Accurate Results
            </div>
            {[
              'Use your most recent medical measurements',
              'Select symptoms from the last 3 months',
              'Include all lifestyle factors, even minor ones',
            ].map((tip, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                marginBottom: i < 2 ? 10 : 0,
                fontSize: '0.78rem', color: '#6B2A5F', lineHeight: 1.55,
              }}>
                <span style={{ color: '#E11D48', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>→</span>
                {tip}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 920px) {
          .onboarding-grid { grid-template-columns: 1fr !important; }
          .onboarding-grid aside { position: static !important; }
        }
        @media (min-width: 640px) {
          .step-label { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;