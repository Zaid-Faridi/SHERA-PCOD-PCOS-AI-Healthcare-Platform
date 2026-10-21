import React, { useState, useEffect, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ClinicalReportPDF } from '../../utils/pdfGenerator';

const Ic = ({ n, s = 24, c = 'currentColor' }) => {
  const p = {
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    brain: <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></>,
    arrowR: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
    steth: <><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" stroke="none"/>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24"
      fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {p[n]}
    </svg>
  );
};

const Results = ({ riskAssessment, setActiveTab }) => {
  const [animate, setAnimate] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
    window.scrollTo(0, 0);
  }, []);

  if (!riskAssessment) return null;

  const { score, level, tabular_score, image_score, diagnosis, confidence, recommendation, heatmap_image } = riskAssessment;
  const imageProvided = riskAssessment.image_provided !== false && riskAssessment.image_score !== null && riskAssessment.image_score !== undefined;
  const isMostlyMissing = Boolean(
    riskAssessment.limited_input ||
    (riskAssessment.formData && Object.values(riskAssessment.formData).filter(v => v !== null && v !== undefined && v !== '' && v !== false).length < 4)
  );

  // Determine colors based on risk level
  let themeColor = '#059669'; // Low (Emerald)
  let bgGradients = ['rgba(5,150,105,0.1)', 'rgba(5,150,105,0.02)'];
  
  if (level === 'High') {
    themeColor = '#E11D48'; // Rose
    bgGradients = ['rgba(225,29,72,0.12)', 'rgba(236,72,153,0.03)'];
  } else if (level === 'Moderate') {
    themeColor = '#F59E0B'; // Amber
    bgGradients = ['rgba(245,158,11,0.12)', 'rgba(251,191,36,0.03)'];
  }

  // The custom PDF generation is now handled by PDFDownloadLink and ClinicalReportPDF

  const CircleProgress = ({ val, size = 160, stroke = 12, color, delay = 0 }) => {
    const radius = (size - stroke) / 2;
    const circ = 2 * Math.PI * radius;
    const dashoffset = animate ? circ - (val / 100) * circ : circ;

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth={stroke} fill="none" />
          <circle 
            cx={size/2} cy={size/2} r={radius} 
            stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none"
            strokeDasharray={circ} strokeDashoffset={dashoffset}
            style={{ transition: `stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.25, fontWeight: 900, color: '#1A0A2E', lineHeight: 1 }}>{val}<span style={{ fontSize: '0.4em', color: '#9B6B8A' }}>%</span></span>
        </div>
      </div>
    );
  };

  return (
    <div ref={reportRef} style={{
      maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px',
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      color: '#1A0A2E'
    }}>
      
      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40,
        opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${themeColor}, #1A0A2E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Ic n="brain" s={28} c="white"/>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Your Health Analysis
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#6B2A5F', maxWidth: 600, lineHeight: 1.6 }}>
          Based on our dual-model AI evaluation of your clinical profile and ultrasound data.
        </p>
      </div>

      {/* ── MAIN SCORE CARD ── */}
      <div style={{
        padding: '40px', borderRadius: 32,
        background: `linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${bgGradients[0]}`,
        boxShadow: `0 24px 48px -12px ${bgGradients[0]}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
        marginBottom: 32,
        opacity: animate ? 1 : 0, transform: animate ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
      }}>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: bgGradients[0], borderRadius: 999, marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: themeColor }}>
              {level} Risk Detected
            </span>
          </div>
          
          <CircleProgress val={score || 0} size={220} stroke={16} color={themeColor} delay={0.2} />
          
          <div style={{ marginTop: 24, fontSize: '0.9rem', color: '#6B2A5F', fontWeight: 600 }}>
            Overall Risk Score
          </div>
        </div>

        {/* Detailed Scores Split */}
        <div style={{ display: 'flex', width: '100%', gap: 24, marginTop: 16 }}>
          <div style={{ flex: 1, padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <CircleProgress val={tabular_score || 0} size={70} stroke={6} color="#7C3AED" delay={0.4} />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1A0A2E' }}>Clinical Score</div>
              <div style={{ fontSize: '0.8rem', color: '#9B6B8A', marginTop: 4 }}>Based on symptoms & lifestyle</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 20 }}>
            {imageProvided ? (
              <>
                <CircleProgress val={image_score || 0} size={70} stroke={6} color="#EC4899" delay={0.6} />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1A0A2E' }}>Ultrasound Score</div>
                  <div style={{ fontSize: '0.8rem', color: '#9B6B8A', marginTop: 4 }}>Based on image analysis</div>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6B7280' }}>Ultrasound Scan</div>
                <div style={{ fontSize: '0.85rem', color: '#9B6B8A', marginTop: 4 }}>Based on clinical data only</div>
              </div>
            )}
          </div>
        </div>

        {/* Limited Input Notice */}
        {isMostlyMissing && (
          <div style={{
            width: '100%', padding: '14px 20px', borderRadius: 16,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Ic n="alert" s={20} c="#D97706" />
            <span style={{ fontSize: '0.88rem', color: '#92400E', fontWeight: 600, lineHeight: 1.5 }}>
              Limited input, low reliability notice: Clinical input was mostly missing.
            </span>
          </div>
        )}
      </div>

      {/* ── GRAD-CAM EXPLAINABLE AI HEATMAP CARD ── */}
      {heatmap_image && (
        <div style={{
          padding: '28px', borderRadius: 24, background: 'white',
          border: '1px solid rgba(124,58,237,0.15)', boxShadow: '0 12px 24px -12px rgba(124,58,237,0.08)',
          marginBottom: 32, opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic n="eye" s={20} c="#7C3AED"/>
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Explainable AI Vision Heatmap</h3>
              <p style={{ fontSize: '0.8rem', color: '#9B6B8A', margin: 0 }}>Grad-CAM gradient visual overlay of detected ovarian features</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(124,58,237,0.2)', width: 220, height: 220, flexShrink: 0 }}>
              <img src={heatmap_image} alt="Grad-CAM Ovarian Heatmap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(236,72,153,0.1)', borderRadius: 999, marginBottom: 10 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EC4899', textTransform: 'uppercase' }}>Red / Yellow Regions</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#4A1D4E', lineHeight: 1.6, margin: 0 }}>
                The highlighted warm areas indicate where the Convolutional Neural Network identified characteristic ovarian tissue textures and cyst patterns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DIAGNOSIS & CONFIDENCE ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32,
        opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
      }}>
        <div style={{
          padding: '28px', borderRadius: 24, background: 'white',
          border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 12px 24px -12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic n="steth" s={20} c="#7C3AED"/>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>AI Diagnosis</h3>
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A0A2E', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            {diagnosis || "Assessment complete. Please refer to your doctor."}
          </p>
          {riskAssessment.severity && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: riskAssessment.severity === 'High' ? 'rgba(225,29,72,0.1)' :
                          riskAssessment.severity === 'Moderate' ? 'rgba(245,158,11,0.1)' :
                          riskAssessment.severity === 'Low' ? 'rgba(234,179,8,0.1)' :
                          'rgba(5,150,105,0.1)',
              color: riskAssessment.severity === 'High' ? '#E11D48' :
                     riskAssessment.severity === 'Moderate' ? '#D97706' :
                     riskAssessment.severity === 'Low' ? '#CA8A04' :
                     '#059669'
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: riskAssessment.severity === 'High' ? '#E11D48' :
                             riskAssessment.severity === 'Moderate' ? '#D97706' :
                             riskAssessment.severity === 'Low' ? '#CA8A04' :
                             '#059669'
              }} />
              {riskAssessment.severity} Risk
            </span>
          )}
        </div>

        <div style={{
          padding: '28px', borderRadius: 24, background: 'white',
          border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 12px 24px -12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic n="check" s={20} c="#059669"/>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Model Confidence</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#059669', lineHeight: 1 }}>{confidence ? Math.round(confidence) : score}%</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9B6B8A', margin: 0 }}>
            {imageProvided
              ? "Weighted heuristic fusion of clinical data (60%) and ultrasound imaging (40%)."
              : "Based on clinical data only"}
          </p>
        </div>
      </div>

      {/* ── IMAGE CONFIDENCE WARNING ── */}
      {riskAssessment.image_confidence_note && (
        <div style={{
          padding: '20px 24px', borderRadius: 16, marginBottom: 32,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s'
        }}>
          <Ic n="alert" s={20} c="#D97706" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400E', marginBottom: 4 }}>Ultrasound Analysis Note</div>
            <p style={{ fontSize: '0.85rem', color: '#78350F', margin: 0, lineHeight: 1.6 }}>
              {riskAssessment.image_confidence_note}
            </p>
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      <div style={{
        padding: '32px', borderRadius: 24, background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(236,72,153,0.15)', marginBottom: 40,
        opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #E11D48, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic n="heart" s={22} c="white"/>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A0A2E', margin: 0 }}>Action Plan</h3>
            <p style={{ fontSize: '0.85rem', color: '#9B6B8A', margin: '4px 0 0 0' }}>Next steps based on your results</p>
          </div>
        </div>
        
        <div style={{ padding: '24px', background: 'rgba(225,29,72,0.03)', borderRadius: 16, borderLeft: '4px solid #E11D48', color: '#4c1d32', fontSize: '1rem', lineHeight: 1.7, fontWeight: 500, whiteSpace: 'pre-line' }}>
          {recommendation || "Maintain a healthy lifestyle and schedule regular checkups with your healthcare provider."}
        </div>
        
        <div style={{ marginTop: 20, padding: '16px', background: 'rgba(5,150,105,0.05)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Ic n="alert" s={20} c="#059669" />
          <p style={{ fontSize: '0.8rem', color: '#064e3b', margin: 0, lineHeight: 1.5 }}>
            <strong>Medical Disclaimer:</strong> SHEra is an AI assistive tool and does not provide medical diagnosis or treatment. Always consult a qualified healthcare professional before making any medical decisions.
          </p>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
        opacity: animate ? 1 : 0,
        transition: 'opacity 0.6s ease 0.5s'
      }}>
        <PDFDownloadLink
          document={<ClinicalReportPDF data={riskAssessment} />}
          fileName={`${(riskAssessment.patientName || (riskAssessment.formData && riskAssessment.formData.name)) ? (riskAssessment.patientName || riskAssessment.formData.name).split(' ').join('_') : 'Patient'}-Clinical_report.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <div style={{
              padding: '16px 36px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: 'white',
              fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.3)'; }}>
              <Ic n="download" s={18} c="white"/> {loading ? 'Generating Report...' : 'Download Clinical PDF Report'}
            </div>
          )}
        </PDFDownloadLink>

        <button onClick={() => setActiveTab('tracker')} style={{
          padding: '16px 36px', borderRadius: 999, border: 'none',
          background: 'linear-gradient(135deg, #1A0A2E, #4A1D4E)', color: 'white',
          fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(26,10,46,0.25)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,10,46,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,10,46,0.25)'; }}>
          Start Tracking <Ic n="activity" s={18} c="white"/>
        </button>

        <button onClick={() => setActiveTab('home')} style={{
          padding: '16px 36px', borderRadius: 999, border: '2px solid rgba(155,107,138,0.2)',
          background: 'white', color: '#6B2A5F',
          fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(155,107,138,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
          Back to Dashboard
        </button>
      </div>

    </div>
  );
};

export default Results;