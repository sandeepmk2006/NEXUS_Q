import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export const MODEL_NAME = 'gemini-flash-lite-latest';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AnalysisInput {
  imageBase64: string;
  imageMimeType: string;
  clinicalNotes: string;
  imageType: string;
  patientInfo: {
    age: number;
    gender: string;
    medicalHistory: string;
    currentMedications: string[];
  };
}

export interface MedicalFinding {
  finding: string;
  location: string;
  /** Normalized [ymin, xmin, ymax, xmax] on a 0-1000 scale; null if the finding is supported by clinical notes only */
  boundingBox: [number, number, number, number] | null;
  evidenceSource: 'image' | 'clinical_notes' | 'both';
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  supportingEvidence: string;
  recommendation: string;
}

export interface AnalysisResult {
  summary: string;
  findings: MedicalFinding[];
  overallAssessment: string;
  imageQuality: string;
  imageQualityRating: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  qualityWarning: string | null;
  droppedFindings: number;
  disclaimer: string;
  rawResponse: string;
  modelUsed: string;
  processingTime: number;
}

const DEFAULT_DISCLAIMER =
  'This analysis is provided by TetrixAI as a second opinion tool to assist physicians. It is not a definitive diagnosis and must be interpreted within the full clinical context.';

type QualityRating = AnalysisResult['imageQualityRating'];

function normalizeQuality(rating: unknown, description: unknown): QualityRating {
  const text = `${rating ?? ''} ${description ?? ''}`.toLowerCase();
  for (const r of ['poor', 'fair', 'excellent', 'good'] as const) {
    if (text.includes(r)) return r;
  }
  return 'unknown';
}

function qualityWarningFor(rating: QualityRating): string | null {
  if (rating === 'poor') {
    return 'Poor image quality: findings are unreliable and confidence scores were reduced. Consider re-acquiring the image.';
  }
  if (rating === 'fair') {
    return 'Fair image quality: interpret findings with caution; confidence scores were slightly reduced.';
  }
  return null;
}

function normalizeBox(box: unknown): [number, number, number, number] | null {
  if (!Array.isArray(box) || box.length !== 4) return null;
  const n = box.map((v) => Number(v));
  if (n.some((v) => !Number.isFinite(v))) return null;
  const c = n.map((v) => Math.min(1000, Math.max(0, Math.round(v))));
  const [ymin, xmin, ymax, xmax] = c;
  if (ymax <= ymin || xmax <= xmin) return null;
  return [ymin, xmin, ymax, xmax];
}

/**
 * Enforces the anti-hallucination rule in code: a finding survives only if it has a
 * valid image region, or cites the clinical notes as its evidence.
 */
function sanitizeFindings(raw: unknown, rating: QualityRating, hasNotes: boolean) {
  const list = Array.isArray(raw) ? raw : [];
  const penalty = rating === 'poor' ? 0.6 : rating === 'fair' ? 0.85 : 1;
  const findings: MedicalFinding[] = [];
  let dropped = 0;

  for (const f of list) {
    const boundingBox = normalizeBox(f?.boundingBox);
    const evidence = typeof f?.supportingEvidence === 'string' ? f.supportingEvidence.trim() : '';
    const citesNotes = hasNotes && (f?.evidenceSource === 'clinical_notes' || f?.evidenceSource === 'both');
    const hasLocationText = typeof f?.location === 'string' && f.location.trim().length > 0;

    const supported = (boundingBox !== null && !!evidence) || (citesNotes && !!evidence && hasLocationText);
    if (!f?.finding || !supported) {
      dropped++;
      continue;
    }

    const rawConf = Number(f.confidence);
    const confidence = Number.isFinite(rawConf) ? Math.min(100, Math.max(0, rawConf)) : 0;
    const severity = ['low', 'moderate', 'high', 'critical'].includes(f.severity) ? f.severity : 'moderate';

    findings.push({
      finding: String(f.finding),
      location: hasLocationText ? String(f.location) : 'Not specified (clinical notes only)',
      boundingBox,
      evidenceSource: boundingBox ? (citesNotes ? 'both' : 'image') : 'clinical_notes',
      confidence: Math.round(confidence * penalty),
      severity,
      supportingEvidence: evidence,
      recommendation: String(f.recommendation || ''),
    });
  }

  return { findings, dropped };
}

export async function analyzemedicalImage(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({ model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
  });

  const systemPrompt = `You are TetrixAI, an advanced AI medical imaging assistant. You are a SECOND OPINION TOOL — never a replacement for clinical judgment. Your role is to assist physicians by identifying and localizing potential abnormalities in medical images.

CRITICAL RULES:
1. Every finding MUST be backed by specific image evidence (location) AND/OR clinical notes
2. NEVER present a finding without pointing to its exact location in the image
3. ALWAYS include confidence levels (0-100%) — do not state everything with certainty
4. ALWAYS frame responses as suggestions to the doctor: "Doctor, consider examining..." not "The patient has..."
5. A finding with no image location AND no clinical evidence = hallucination — do not include it
6. Flag image quality issues that may affect analysis reliability; if quality is poor, lower your confidence values accordingly
7. "boundingBox" is the tight box around the abnormality as integers normalized to 0-1000 in the order [ymin, xmin, ymax, xmax] (0,0 = top-left of the image). Use null ONLY when evidenceSource is "clinical_notes"
8. If nothing abnormal is visible, return an empty findings array - do not invent findings
9. Report ONE finding per distinct lesion or region, each with its own tight boundingBox. Never merge lesions from different areas or from both lungs/sides into a single finding or a single large box
10. Keep severity consistent with your recommendation: if you advise urgent work-up, severity must be "high" or "critical"

RESPONSE FORMAT (JSON):
{
  "summary": "Brief clinical summary of key findings",
  "imageQualityRating": "excellent | good | fair | poor",
  "imageQuality": "Short description of image quality and any issues (blur, noise, rotation, low contrast, cropped anatomy)",
  "findings": [
    {
      "finding": "Specific finding description",
      "location": "Precise anatomical location in the image (e.g., 'upper-right quadrant', 'left lower lobe', 'periventricular region')",
      "boundingBox": [ymin, xmin, ymax, xmax],
      "evidenceSource": "image | clinical_notes | both",
      "confidence": 85,
      "severity": "moderate",
      "supportingEvidence": "What in the image OR clinical notes supports this finding",
      "recommendation": "Suggested clinical action for the physician"
    }
  ],
  "overallAssessment": "Doctor-addressed overall assessment with appropriate clinical caution"
}`;

  const userPrompt = `Please analyze this ${input.imageType} medical image for a ${input.patientInfo.age}-year-old ${input.patientInfo.gender} patient.

Clinical Context:
- Medical History: ${input.patientInfo.medicalHistory || 'Not provided'}
- Current Medications: ${input.patientInfo.currentMedications?.join(', ') || 'None listed'}
- Clinical Notes/Symptoms: ${input.clinicalNotes || 'Not provided'}

Analyze the image systematically:
1. Assess image quality and modality
2. Identify anatomical structures visible
3. Note any abnormalities with EXACT locations
4. Cross-reference with clinical notes
5. Provide confidence levels for each finding
6. Suggest clinical follow-up actions

Remember: Point to specific regions. Unsupported findings are hallucinations.`;

  const imagePart = {
    inlineData: {
      data: input.imageBase64,
      mimeType: input.imageMimeType,
    },
  };

  const result = await model.generateContent([systemPrompt, userPrompt, imagePart]);
  const response = result.response;
  const rawText = response.text();

  // Parse JSON response (JSON mode normally returns clean JSON; regex is a safety net)
  let parsedResult: any = null;
  try {
    parsedResult = JSON.parse(rawText);
  } catch (_e) {
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedResult = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse JSON response, using raw text');
    }
  }

  const processingTime = Date.now() - startTime;

  if (parsedResult) {
    const rating = normalizeQuality(parsedResult.imageQualityRating, parsedResult.imageQuality);
    const { findings, dropped } = sanitizeFindings(parsedResult.findings, rating, !!input.clinicalNotes?.trim());
    return {
      summary: parsedResult.summary || 'Analysis complete',
      findings,
      overallAssessment: parsedResult.overallAssessment || '',
      imageQuality: parsedResult.imageQuality || 'Unknown',
      imageQualityRating: rating,
      qualityWarning: qualityWarningFor(rating),
      droppedFindings: dropped,
      disclaimer: DEFAULT_DISCLAIMER,
      rawResponse: rawText,
      modelUsed: MODEL_NAME,
      processingTime,
    };
  }

  // Fallback if JSON parsing fails
  return {
    summary: 'The AI response could not be parsed into structured findings. This is NOT a clean result - please review the raw response or retry.',
    findings: [],
    overallAssessment: rawText,
    imageQuality: 'Unknown',
    imageQualityRating: 'unknown',
    qualityWarning: 'Structured parsing failed; no findings could be verified.',
    droppedFindings: 0,
    disclaimer: DEFAULT_DISCLAIMER,
    rawResponse: rawText,
    modelUsed: MODEL_NAME,
    processingTime,
  };
}
