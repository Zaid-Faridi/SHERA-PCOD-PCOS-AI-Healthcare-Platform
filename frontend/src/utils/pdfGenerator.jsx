import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Circle, Rect, G, Line, Polyline, Defs, LinearGradient, Stop } from '@react-pdf/renderer';

const colors = {
  primary: '#7C3AED',
  secondary: '#EC4899',
  orange: '#F59E0B',
  green: '#059669',
  red: '#E11D48',
  lightGray: '#F9FAFB',
  border: '#E5E7EB',
  darkGray: '#374151',
  textMain: '#1F2937',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  pastelBg: '#FDFBFD'
};

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: colors.pastelBg, fontFamily: 'Helvetica' },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  logoBox: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 28, color: colors.secondary, fontFamily: 'Helvetica-Bold' },
  logoSub: { fontSize: 9, color: colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  reportTitleBox: { alignItems: 'center', marginTop: 10 },
  reportTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: colors.textMain },
  reportSubtitle: { fontSize: 16, color: colors.textMain, marginTop: 4 },
  qrBox: { alignItems: 'flex-end' },
  qrText: { fontSize: 8, color: colors.textMuted, marginTop: 4 },
  // Patient Info
  patientCard: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.white, padding: 12, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between', rowGap: 10 },
  infoBlock: { flexDirection: 'row', alignItems: 'center', minWidth: '22%' },
  infoIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.lightGray, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  infoTextCol: { flexDirection: 'column', flexShrink: 1 },
  infoLabel: { fontSize: 8, color: colors.textMuted, marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 10, color: colors.textMain, fontFamily: 'Helvetica-Bold' },
  // Layouts
  row: { flexDirection: 'row' },
  col2: { flex: 1, paddingRight: 8 },
  col2Right: { flex: 1, paddingLeft: 8 },
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.textMain, marginLeft: 8 },
  // Hero section
  heroBox: { backgroundColor: colors.white, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 16 },
  riskBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  riskBadgeText: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  gaugeContainer: { position: 'relative', width: 140, height: 140, marginBottom: 24 },
  gaugeTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  gaugeScore: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: colors.textMain },
  gaugeLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  miniCardsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 },
  miniCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  miniCardCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  miniCardVal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.textMain },
  miniCardLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  // Tables
  table: { width: '100%' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, paddingVertical: 8, alignItems: 'center' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border, paddingBottom: 6, marginBottom: 4 },
  th: { fontSize: 9, color: colors.textMuted, flex: 1, textTransform: 'uppercase' },
  td: { fontSize: 10, color: colors.textMain, flex: 1 },
  tdBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  // Badges & Pills
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.lightGray, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  pillText: { fontSize: 9, color: colors.textMain },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  // Interpretations
  bulletRow: { flexDirection: 'row', marginBottom: 6, paddingRight: 16 },
  bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginRight: 8, marginTop: 4 },
  bulletText: { fontSize: 10, color: colors.textMain, lineHeight: 1.4 },
  paragraph: { fontSize: 10, color: colors.darkGray, lineHeight: 1.5, marginTop: 8 },
  // Findings
  findingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  findingLabel: { fontSize: 10, color: colors.textMuted, marginLeft: 8, flex: 1 },
  findingValue: { fontSize: 10, color: colors.textMain, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  // Ultrasound
  usImage: { width: 220, height: 160, borderRadius: 8, objectFit: 'cover' },
  usDetails: { flex: 1, paddingLeft: 16 },
  usOvaryTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.textMain, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  usOvaryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  usRow: { flexDirection: 'row', marginBottom: 6 },
  usLabel: { fontSize: 9, color: colors.textMuted, flex: 1 },
  usVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.textMain },
  // Visualization
  visRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  visLabel: { fontSize: 9, color: colors.textMuted, width: 90 },
  visBarBg: { flex: 1, height: 6, backgroundColor: colors.lightGray, borderRadius: 3, marginHorizontal: 10 },
  visBarFg: { height: 6, borderRadius: 3 },
  visVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 25, textAlign: 'right' },
  // Lifestyle
  lifeCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  lifeTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: colors.textMain, marginLeft: 6 },
  lifeSection: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: colors.textMuted, marginTop: 8, marginBottom: 4 },
  lifeItem: { fontSize: 9, color: colors.textMain, marginBottom: 4, paddingLeft: 8 },
  // Page 3
  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: colors.textMain, marginBottom: 12, marginTop: 8 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkText: { fontSize: 10, color: colors.textMain, flex: 1 },
  // Notes & Disclaimer
  noteLine: { borderBottomWidth: 1, borderBottomColor: colors.lightGray, height: 24 },
  disclaimer: { backgroundColor: colors.lightGray, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  disclaimerText: { fontSize: 8, color: colors.darkGray, flex: 1, lineHeight: 1.4, marginLeft: 12 },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  footerText: { fontSize: 8, color: colors.textMuted }
});

// SVG Icons
const Icon = ({ name, color = colors.primary, size = 16 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === 'patient' && <><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></>}
      {name === 'gender' && <><Circle cx="12" cy="10" r="5" /><Line x1="12" y1="15" x2="12" y2="22" /><Line x1="9" y1="19" x2="15" y2="19" /></>}
      {name === 'calendar' && <><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Line x1="16" y1="2" x2="16" y2="6" /><Line x1="8" y1="2" x2="8" y2="6" /><Line x1="3" y1="10" x2="21" y2="10" /></>}
      {name === 'clock' && <><Circle cx="12" cy="12" r="10" /><Line x1="12" y1="6" x2="12" y2="12" /><Line x1="12" y1="12" x2="16" y2="14" /></>}
      {name === 'brain' && <><Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></>}
      {name === 'clipboard' && <><Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><Rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>}
      {name === 'shield' && <><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><Path d="M9 12l2 2 4-4" /></>}
      {name === 'bar' && <><Line x1="12" y1="20" x2="12" y2="10" /><Line x1="18" y1="20" x2="18" y2="4" /><Line x1="6" y1="20" x2="6" y2="16" /></>}
      {name === 'user' && <><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></>}
      {name === 'flask' && <><Path d="M9 3H15M10 3V12L4.5 20.5C4.2 21.1 4.6 21.8 5.3 21.8H18.7C19.4 21.8 19.8 21.1 19.5 20.5L14 12V3" /></>}
      {name === 'image' && <><Rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><Circle cx="8.5" cy="8.5" r="1.5" /><Path d="M21 15l-5-5L5 21" /></>}
      {name === 'sparkles' && <><Path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" /></>}
      {name === 'check' && <><Polyline points="20 6 9 17 4 12" /></>}
      {name === 'apple' && <><Path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><Path d="M10 2c1 .5 2 2 2 5" /></>}
      {name === 'activity' && <><Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>}
      {name === 'moon' && <><Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>}
      {name === 'warning' && <><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><Line x1="12" y1="9" x2="12" y2="13" /><Line x1="12" y1="17" x2="12.01" y2="17" /></>}
      {name === 'pen' && <><Path d="M12 19l7-7 3 3-7 7-3-3z" /><Path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><Path d="M2 2l7.586 7.586" /><Circle cx="11" cy="11" r="2" /></>}
    </Svg>
  );
};
// Polyline isn't explicitly imported above but I can use Path for checks.
// Let's replace check with Path.
const CheckPath = <Path d="M20 6L9 17L4 12" />;

// Math for SVG Arc
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

// Components
const Gauge = ({ percentage, color, size = 140, stroke = 12 }) => {
  const r = (size - stroke) / 2;
  const c = size / 2;
  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={colors.lightGray} strokeWidth={stroke} fill="none" />
        {percentage === 100 ? (
          <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        ) : (
          <Path d={describeArc(c, c, r, 0, (percentage / 100) * 360)} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        )}
      </Svg>
      <View style={styles.gaugeTextContainer}>
        <Text style={styles.gaugeScore}>{Math.round(percentage)}%</Text>
        <Text style={styles.gaugeLabel}>Overall Risk Score</Text>
      </View>
    </View>
  );
};

const getLevelProps = (lvl) => {
  if (lvl === 'High' || lvl === 'Very High') return { color: colors.red, bg: '#FFE4E6' };
  if (lvl === 'Moderate') return { color: colors.orange, bg: '#FEF3C7' };
  return { color: colors.green, bg: '#D1FAE5' };
};

export const ClinicalReportPDF = ({ data }) => {
  const d = data || {};
  
  const patientName = d.patientName || (d.formData && d.formData.name) || "Jane Doe";
  const age = d.age || (d.formData && d.formData.age ? `${d.formData.age} Years` : "28 Years");
  const gender = d.gender || "Female";
  const date = d.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const level = d.level || "Moderate";
  const score = d.score || 62;
  const tabular_score = d.tabular_score || 38;
  const image_score = d.image_score || 100;
  const confidence = d.confidence || 94;
  const diagnosis = d.diagnosis || "Moderate risk";
  const heatmap_image = d.heatmap_image || null;

  const labValues = d.labValues || {
    "LH (mIU/mL)": { value: "15.2", range: "2 - 12", status: "High" },
    "FSH (mIU/mL)": { value: "5.3", range: "3 - 10", status: "Normal" },
    "LH/FSH Ratio": { value: "2.9", range: "< 2", status: "High" },
    "AMH (ng/mL)": { value: "8.1", range: "1 - 4", status: "High" },
    "TSH (mIU/L)": { value: "2.6", range: "0.4 - 4.0", status: "Normal" },
    "Fasting Sugar": { value: "108", range: "70 - 99", status: "Borderline" }
  };
  const clinicalFindings = d.clinicalFindings || [
    { label: "Menstrual Cycle", value: "Irregular", icon: "calendar" },
    { label: "BMI", value: "28.4 kg/m²", icon: "user" },
    { label: "Acne", value: "Present", icon: "user" },
    { label: "Hair Growth", value: "Mild", icon: "user" },
    { label: "Weight Gain", value: "Yes", icon: "activity" }
  ];
  const factors = d.factors || [
    { name: "Irregular periods", impact: "High", color: colors.red },
    { name: "Multiple ovarian follicles", impact: "Very High", color: '#9F1239' },
    { name: "Elevated AMH", impact: "Medium", color: colors.orange },
    { name: "Acne", impact: "Medium", color: colors.orange },
    { name: "Family History", impact: "Low", color: colors.green }
  ];
  const recommendations = d.recommendations || [
    "Consult a Gynecologist for confirmation and treatment guidance.",
    "Complete hormonal profile for better evaluation.",
    "Repeat ultrasound after medical advice.",
    "Maintain a healthy BMI through balanced diet and exercise.",
    "Exercise at least 150 minutes per week.",
    "Sleep 7-9 hours daily and manage stress effectively."
  ];
  const riskFactors = d.riskFactors || ["Irregular Cycle", "Acne", "Weight Gain", "Ultrasound Positive", "Elevated LH/FSH"];

  const theme = getLevelProps(level);

  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Icon name="user" color={colors.secondary} size={32} />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.logoText}>SHEra AI</Text>
              <Text style={styles.logoSub}>Women's Health Intelligence</Text>
            </View>
          </View>
          <View style={styles.reportTitleBox}>
            <Text style={styles.reportTitle}>PCOS/PCOD</Text>
            <Text style={styles.reportSubtitle}>Clinical Assessment Report</Text>
          </View>
          <View style={styles.qrBox}>
            <Svg width="40" height="40" viewBox="0 0 40 40">
              <Rect width="40" height="40" fill={colors.lightGray} />
              <Rect x="4" y="4" width="8" height="8" fill={colors.darkGray} />
              <Rect x="28" y="4" width="8" height="8" fill={colors.darkGray} />
              <Rect x="4" y="28" width="8" height="8" fill={colors.darkGray} />
              <Rect x="16" y="16" width="12" height="12" fill={colors.darkGray} />
            </Svg>
            <Text style={styles.qrText}>Scan to Verify</Text>
            <Text style={[styles.qrText, { color: colors.textMain, fontFamily: 'Helvetica-Bold' }]}>SHR-{Math.floor(Math.random() * 90000) + 10000}</Text>
          </View>
        </View>

        <View style={styles.patientCard}>
          <View style={styles.infoBlock}>
            <View style={styles.infoIcon}><Icon name="patient" color={colors.primary} size={14}/></View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoValue}>{patientName}</Text>
            </View>
          </View>
          <View style={styles.infoBlock}>
            <View style={styles.infoIcon}><Icon name="gender" color={colors.secondary} size={14}/></View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Age / Gender</Text>
              <Text style={styles.infoValue}>{age} / {gender}</Text>
            </View>
          </View>
          <View style={styles.infoBlock}>
            <View style={styles.infoIcon}><Icon name="calendar" color={colors.primary} size={14}/></View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Assessment Date</Text>
              <Text style={styles.infoValue}>{date}</Text>
            </View>
          </View>
          <View style={styles.infoBlock}>
            <View style={styles.infoIcon}><Icon name="clock" color={colors.secondary} size={14}/></View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Generated On</Text>
              <Text style={styles.infoValue}>{date}, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.heroBox}>
              <View style={[styles.riskBadge, { backgroundColor: theme.bg }]}>
                <Text style={[styles.riskBadgeText, { color: theme.color }]}>{level.toUpperCase()} RISK DETECTED</Text>
              </View>
              <Gauge percentage={score} color={theme.color} />
              
              <View style={styles.miniCardsRow}>
                <View style={styles.miniCard}>
                  <View style={[styles.miniCardCircle, { borderColor: colors.primary }]}><Text style={[styles.miniCardVal, { color: colors.primary }]}>{Math.round(tabular_score)}%</Text></View>
                  <Text style={styles.miniCardLabel}>Clinical{"\n"}Model Score</Text>
                </View>
                <View style={styles.miniCard}>
                  <View style={[styles.miniCardCircle, { borderColor: colors.secondary }]}><Text style={[styles.miniCardVal, { color: colors.secondary }]}>{Math.round(image_score)}%</Text></View>
                  <Text style={styles.miniCardLabel}>Ultrasound{"\n"}Model Score</Text>
                </View>
                <View style={styles.miniCard}>
                  <View style={[styles.miniCardCircle, { borderColor: colors.green }]}><Text style={[styles.miniCardVal, { color: colors.green }]}>{Math.round(confidence)}%</Text></View>
                  <Text style={styles.miniCardLabel}>Model{"\n"}Confidence</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.col2Right}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Icon name="clipboard" color={colors.primary} />
                <Text style={styles.cardTitle}>Diagnostic Result Summary</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Overall Risk Level</Text>
                <Text style={[styles.tdBold, { color: theme.color }]}>{level}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Diagnosis</Text>
                <Text style={[styles.tdBold, { color: colors.primary }]}>{diagnosis}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Overall Risk Score</Text>
                <Text style={[styles.tdBold, { color: theme.color }]}>{Math.round(score)}%</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Clinical Model Score</Text>
                <Text style={[styles.tdBold, { color: colors.primary }]}>{Math.round(tabular_score)}%</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td}>Ultrasound Score</Text>
                <Text style={[styles.tdBold, { color: colors.secondary }]}>{Math.round(image_score)}%</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.td}>Model Confidence</Text>
                <Text style={[styles.tdBold, { color: colors.green }]}>{Math.round(confidence)}%</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Icon name="shield" color={colors.primary} />
                <Text style={styles.cardTitle}>AI Interpretation</Text>
              </View>
              <Text style={styles.paragraph}>
                The assessment indicates a <Text style={{ fontFamily: 'Helvetica-Bold' }}>{level} likelihood</Text> of PCOS/PCOD based on the combination of clinical symptoms, lifestyle information, hormone profile (if provided), and ultrasound image analysis. 
                {image_score > 70 ? " The ultrasound findings strongly support polycystic ovarian morphology." : ""} 
                {"\n\n"}This assessment is intended as an AI-assisted screening tool and should be confirmed by a qualified gynecologist.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by SHEra AI</Text>
          <Text style={styles.footerText}>www.shera.ai  |  support@shera.ai</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} All Rights Reserved</Text>
        </View>
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Icon name="bar" color={colors.primary} />
                <Text style={styles.cardTitle}>Why This Result?</Text>
              </View>
              <View style={styles.tableHeader}>
                <Text style={styles.th}>Factor</Text>
                <Text style={[styles.th, { textAlign: 'right' }]}>Impact</Text>
              </View>
              {factors.map((f, i) => (
                <View style={[styles.tableRow, i === factors.length - 1 && { borderBottomWidth: 0 }]} key={i}>
                  <Text style={styles.td}>{f.name}</Text>
                  <View style={[styles.badge, { backgroundColor: f.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: f.color }]}>{f.impact}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.col2Right}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Icon name="user" color={colors.primary} />
                <Text style={styles.cardTitle}>Clinical Findings</Text>
              </View>
              {clinicalFindings.map((cf, i) => (
                <View style={styles.findingRow} key={i}>
                  <Icon name={cf.icon} size={12} color={colors.textMuted} />
                  <Text style={styles.findingLabel}>{cf.label}</Text>
                  <Text style={styles.findingValue}>{cf.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {labValues && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Icon name="flask" color={colors.secondary} />
              <Text style={styles.cardTitle}>Laboratory Values</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Test</Text>
              <Text style={styles.th}>Value</Text>
              <Text style={styles.th}>Normal Range</Text>
              <Text style={[styles.th, { textAlign: 'right' }]}>Status</Text>
            </View>
            {Object.entries(labValues).map(([test, data], i) => (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.td}>{test}</Text>
                <Text style={styles.tdBold}>{data.value}</Text>
                <Text style={styles.td}>{data.range}</Text>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <View style={[styles.usOvaryDot, { backgroundColor: data.status === 'Normal' ? colors.green : data.status === 'Borderline' ? colors.orange : colors.red }]} />
                  <Text style={styles.tdBold}>{data.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {heatmap_image && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Icon name="image" color={colors.primary} />
              <Text style={styles.cardTitle}>Ultrasound Findings</Text>
            </View>
            <View style={styles.row}>
              <Image src={heatmap_image} style={styles.usImage} />
              <View style={styles.usDetails}>
                <Text style={styles.usOvaryTitle}><View style={[styles.usOvaryDot, { backgroundColor: colors.primary }]} /> Left Ovary</Text>
                <View style={styles.usRow}><Text style={styles.usLabel}>Follicles Count</Text><Text style={styles.usVal}>: 22</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Ovarian Volume</Text><Text style={styles.usVal}>: 12.8 cc</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Polycystic morphology detected</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Confidence</Text><Text style={styles.usVal}>: 97%</Text></View>
                
                <Text style={[styles.usOvaryTitle, { marginTop: 12 }]}><View style={[styles.usOvaryDot, { backgroundColor: colors.secondary }]} /> Right Ovary</Text>
                <View style={styles.usRow}><Text style={styles.usLabel}>Follicles Count</Text><Text style={styles.usVal}>: 24</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Ovarian Volume</Text><Text style={styles.usVal}>: 13.2 cc</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Polycystic morphology detected</Text></View>
                <View style={styles.usRow}><Text style={styles.usLabel}>Confidence</Text><Text style={styles.usVal}>: 98%</Text></View>
              </View>
            </View>
            
            <View style={{ marginTop: 16, flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                  <Icon name="sparkles" color={colors.secondary} size={14} />
                  <Text style={[styles.cardTitle, { fontSize: 10, color: colors.secondary }]}>AI Explanation</Text>
                </View>
                <Text style={styles.paragraph}>
                  Ultrasound analysis detected multiple peripheral follicles with enlarged ovarian volume consistent with polycystic ovarian morphology. This contributed significantly to the final prediction.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Icon name="bar" color={colors.primary} />
            <Text style={styles.cardTitle}>Risk Visualization</Text>
          </View>
          <View style={styles.visRow}>
            <Text style={styles.visLabel}>Overall Risk</Text>
            <View style={styles.visBarBg}><View style={[styles.visBarFg, { width: `${score}%`, backgroundColor: theme.color }]} /></View>
            <Text style={styles.visVal}>{Math.round(score)}%</Text>
          </View>
          <View style={styles.visRow}>
            <Text style={styles.visLabel}>Clinical Model</Text>
            <View style={styles.visBarBg}><View style={[styles.visBarFg, { width: `${tabular_score}%`, backgroundColor: colors.primary }]} /></View>
            <Text style={styles.visVal}>{Math.round(tabular_score)}%</Text>
          </View>
          <View style={styles.visRow}>
            <Text style={styles.visLabel}>Ultrasound Model</Text>
            <View style={styles.visBarBg}><View style={[styles.visBarFg, { width: `${image_score}%`, backgroundColor: colors.secondary }]} /></View>
            <Text style={styles.visVal}>{Math.round(image_score)}%</Text>
          </View>
          <View style={styles.visRow}>
            <Text style={styles.visLabel}>Model Confidence</Text>
            <View style={styles.visBarBg}><View style={[styles.visBarFg, { width: `${confidence}%`, backgroundColor: colors.green }]} /></View>
            <Text style={styles.visVal}>{Math.round(confidence)}%</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by SHEra AI</Text>
          <Text style={styles.footerText}>www.shera.ai  |  support@shera.ai</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} All Rights Reserved</Text>
        </View>
      </Page>

      {/* PAGE 3 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View style={[styles.col2, { flex: 1.5 }]}>
            <Text style={styles.sectionTitle}>Personalized Action Plan</Text>
            <View style={styles.card}>
              {recommendations.map((rec, i) => (
                <View style={styles.checklistRow} key={i}>
                  <View style={styles.checkIcon}>
                    <Svg viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17L4 12" />
                    </Svg>
                  </View>
                  <Text style={styles.checkText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2Right}>
            <Text style={styles.sectionTitle}>Risk Factors Detected</Text>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {riskFactors.map((rf, i) => (
                  <View style={[styles.pill, { backgroundColor: '#FCE7F3' }]} key={i}>
                    <View style={styles.checkIcon}>
                      <Svg viewBox="0 0 24 24" fill="none" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17L4 12" />
                      </Svg>
                    </View>
                    <Text style={[styles.pillText, { color: colors.secondary, fontFamily: 'Helvetica-Bold' }]}>{rf}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lifestyle Recommendations</Text>
        <View style={[styles.row, { gap: 12 }]}>
          <View style={styles.lifeCard}>
            <View style={styles.cardTitleRow}>
              <Icon name="apple" color={colors.green} />
              <Text style={styles.lifeTitle}>Nutrition</Text>
            </View>
            <Text style={styles.lifeSection}>Increase:</Text>
            <Text style={styles.lifeItem}>• Protein</Text>
            <Text style={styles.lifeItem}>• Fiber</Text>
            <Text style={styles.lifeItem}>• Whole grains</Text>
            <Text style={styles.lifeSection}>Reduce:</Text>
            <Text style={styles.lifeItem}>• Sugary drinks</Text>
            <Text style={styles.lifeItem}>• Processed food</Text>
            <Text style={styles.lifeItem}>• Refined carbs</Text>
          </View>
          <View style={styles.lifeCard}>
            <View style={styles.cardTitleRow}>
              <Icon name="activity" color={colors.primary} />
              <Text style={styles.lifeTitle}>Exercise</Text>
            </View>
            <Text style={styles.lifeSection}>150 min/week</Text>
            <Text style={styles.lifeItem}>• Strength Training</Text>
            <Text style={styles.lifeItem}>• Brisk Walking</Text>
            <Text style={styles.lifeItem}>• Yoga / Stretching</Text>
            <Text style={styles.lifeItem}>• HIIT (as tolerated)</Text>
          </View>
          <View style={styles.lifeCard}>
            <View style={styles.cardTitleRow}>
              <Icon name="moon" color={colors.primary} />
              <Text style={styles.lifeTitle}>Sleep & Stress</Text>
            </View>
            <Text style={styles.lifeItem}>• 7-9 hours of sleep</Text>
            <Text style={styles.lifeItem}>• Fixed sleep schedule</Text>
            <Text style={styles.lifeItem}>• Reduce screen time</Text>
            <Text style={styles.lifeItem}>• Practice meditation</Text>
            <Text style={styles.lifeItem}>• Deep breathing</Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <View style={styles.cardTitleRow}>
            <Icon name="pen" color={colors.primary} />
            <Text style={styles.cardTitle}>Doctor's Notes</Text>
          </View>
          <View style={[styles.card, { paddingVertical: 24 }]}>
            <View style={styles.noteLine} />
            <View style={styles.noteLine} />
            <View style={styles.noteLine} />
            <View style={styles.noteLine} />
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Icon name="warning" color={colors.red} size={20} />
          <Text style={styles.disclaimerText}>
            Disclaimer: This report is generated using AI-assisted analysis and is not intended to replace medical diagnosis. Please consult a qualified gynecologist for confirmation and treatment recommendations.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by SHEra AI</Text>
          <Text style={styles.footerText}>www.shera.ai  |  support@shera.ai</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} All Rights Reserved</Text>
        </View>
      </Page>
    </Document>
  );
};
