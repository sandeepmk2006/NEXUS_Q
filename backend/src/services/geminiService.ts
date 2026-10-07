import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export const MODEL_NAME = 'gemini-flash-lite-latest';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface PriorAnalysis {
  date: string;
  imageType: string;
  summary: string;
  findings: string[];
}

interface AnalysisInput {
  imageBase64: string;
  imageMimeType: string;
  clinicalNotes: string;
  /** The referring doctor's own preliminary impression (unverified) */
  preliminaryFindings?: string;
  /** Text summaries of this patient's earlier reports, newest first */
  priorAnalyses?: PriorAnalysis[];
  imageType: string;
  patientInfo: {
    age: number;
    gender: string;
    medicalHistory: string;
    currentMedications: string[];
    allergies?: string[];
  };
}

export interface MedicalFinding {
  finding: string;
  location: string;
  /** Normalized [ymin, xmin, ymax, xmax] on a 0-1000 scale; null if the finding is supported by clinical notes only */
  boundingBox: [number, number, number, number] | null;
  evidenceSource: 'image' | 'clinical_notes' | 'both';
  confidence: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  /** Set when the box sits on the opposite side to the one the text names */
  lateralityWarning?: string | null;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  supportingEvidence: string;
  recommendation: string;
}

/** Every term behind a finding's confidence, so a reviewer can reconstruct the number. */
export interface ConfidenceBreakdown {
  modelConfidence: number;
  qualityPenalty: number;
  lateralityPenalty: number;
  ceiling: number;
  final: number;
  formula: string;
}

/** A claim the clinical notes raise that could not be tied to a region of the scan. */
export interface NotLocalizedClaim {
  condition: string;
  statement: string;
  notesEvidence: string;
}

export interface AnalysisResult {
  summary: string;
  findings: MedicalFinding[];
  overallAssessment: string;
  imageQuality: string;
  imageQualityRating: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  qualityWarning: string | null;
  droppedFindings: number;
  notLocalized: NotLocalizedClaim[];
  /** Set when the report compares with earlier reports, which the model only sees as text */
  comparisonCaveat: string | null;
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

const CHANGE_WORDS =
  /\b(improv\w*|resolv\w*|interval|clearing|cleared|progress\w*|worsen\w*|(increas|decreas|enlarg)\w* (in size|since|from)|unchanged|stable|new (lesion|finding|opacity))\b/i;

/** Flags reports that talk about change over time, since the model never sees earlier images. */
function comparisonCaveatFor(prior: PriorAnalysis[] | undefined, parsed: any, findings: MedicalFinding[]): string | null {
  if (!prior?.length) return null;
  const text = [
    parsed?.summary,
    parsed?.overallAssessment,
    ...findings.flatMap((f) => [f.finding, f.supportingEvidence, f.recommendation]),
  ].join(' ');
  return CHANGE_WORDS.test(text)
    ? 'This report refers to earlier reports. The AI only had their text summaries and could not see the earlier images, so any statement about change over time is unverified. Please compare the images directly.'
    : null;
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

const CONFIDENCE_CEILING = 95;
const QUALITY_PENALTY: Record<QualityRating, number> = { excellent: 0, good: 0, unknown: 5, fair: 10, poor: 25 };

const LATERALITY_PENALTY = 30;

function computeConfidence(modelConfidence: number, rating: QualityRating, sideMismatch: boolean): ConfidenceBreakdown {
  const model = Math.round(Math.min(100, Math.max(0, modelConfidence)));
  const qualityPenalty = QUALITY_PENALTY[rating];
  const lateralityPenalty = sideMismatch ? LATERALITY_PENALTY : 0;
  const raw = model - qualityPenalty - lateralityPenalty;
  const final = Math.round(Math.min(CONFIDENCE_CEILING, Math.max(0, raw)));
  return {
    modelConfidence: model,
    qualityPenalty,
    lateralityPenalty,
    ceiling: CONFIDENCE_CEILING,
    final,
    formula: `${model} (model) - ${qualityPenalty} (${rating} image quality) - ${lateralityPenalty} (side mismatch) = ${raw}, capped to [0, ${CONFIDENCE_CEILING}] = ${final}`,
  };
}

/** Titles that describe the absence of an abnormality rather than an abnormality. */
const NEGATIVE_FINDING =
  /^(no|normal|absent|unremarkable|clear)\b|without (a |any )?(radiographic|imaging|visible) correlate|no radiographic|not (seen|visible|identified|demonstrated) on/i;

/**
 * On a standard PA/AP chest film the patient's right is on the image's left.
 * Returns a warning when the text names one side and the box sits clearly on the other.
 */
function lateralityMismatch(text: string, box: [number, number, number, number]): string | null {
  const t = text.toLowerCase();
  const right = /\bright\b/.test(t);
  const left = /\bleft\b/.test(t);
  if (right === left) return null;
  const centre = (box[1] + box[3]) / 2;
  if (right && centre > 550) {
    return "The text says right, but the box is on the image's right, which is the patient's left on a standard chest film. Verify the side.";
  }
  if (left && centre < 450) {
    return "The text says left, but the box is on the image's left, which is the patient's right on a standard chest film. Verify the side.";
  }
  return null;
}

/**
 * Enforces the anti-hallucination rule in code. A finding is asserted only when it
 * has a valid image region and evidence. A claim that only the clinical notes support
 * is not asserted: it is rewritten as "notes suggest X, but it cannot be localized".
 * Anything else is dropped and counted.
 */
function sanitizeFindings(raw: unknown, rating: QualityRating, hasNotes: boolean) {
  const list = Array.isArray(raw) ? raw : [];
  const findings: MedicalFinding[] = [];
  const notLocalized: NotLocalizedClaim[] = [];
  let dropped = 0;

  for (const f of list) {
    const boundingBox = normalizeBox(f?.boundingBox);
    const evidence = typeof f?.supportingEvidence === 'string' ? f.supportingEvidence.trim() : '';
    const citesNotes = hasNotes && (f?.evidenceSource === 'clinical_notes' || f?.evidenceSource === 'both');
    const hasLocationText = typeof f?.location === 'string' && f.location.trim().length > 0;

    if (!f?.finding || !evidence) {
      dropped++;
      continue;
    }

    if (NEGATIVE_FINDING.test(String(f.finding))) {
      // "Symptoms without radiographic correlate" is not an abnormality; never box it.
      notLocalized.push({
        condition: String(f.finding),
        statement: `${String(f.finding).replace(/\.$/, '')}: the scan does not show a matching abnormality.`,
        notesEvidence: evidence,
      });
      continue;
    }

    if (!boundingBox) {
      if (citesNotes) {
        const condition = String(f.finding);
        notLocalized.push({
          condition,
          statement: `Clinical notes suggest ${condition.charAt(0).toLowerCase()}${condition.slice(1)}, but it cannot be localized on the provided scan.`,
          notesEvidence: evidence,
        });
      } else {
        dropped++;
      }
      continue;
    }

    const rawConf = Number(f.confidence);
    const lateralityWarning = lateralityMismatch(`${f.finding} ${f.location ?? ''}`, boundingBox);
    const breakdown = computeConfidence(Number.isFinite(rawConf) ? rawConf : 0, rating, !!lateralityWarning);
    const severity = ['low', 'moderate', 'high', 'critical'].includes(f.severity) ? f.severity : 'moderate';

    findings.push({
      finding: String(f.finding),
      location: hasLocationText ? String(f.location) : 'See highlighted region',
      boundingBox,
      evidenceSource: citesNotes ? 'both' : 'image',
      confidence: breakdown.final,
      confidenceBreakdown: breakdown,
      lateralityWarning,
      severity,
      supportingEvidence: evidence,
      recommendation: String(f.recommendation || ''),
    });
  }

  return { findings, notLocalized, dropped };
}

function formatPriorAnalyses(prior?: PriorAnalysis[]): string {
  if (!prior?.length) return '- Previous reports for this patient: none on file';
  const lines = prior.map(
    (p, i) =>
      `  ${i + 1}. ${p.date} (${p.imageType}): ${p.summary}${p.findings.length ? ` Findings: ${p.findings.join('; ')}.` : ' No findings reported.'}`
  );
  return `- Previous reports for this patient (TEXT SUMMARIES ONLY - you cannot see the earlier images). Mention a change over time ONLY if the current image shows it AND a report below supports the comparison; never invent a comparison:\n${lines.join('\n')}`;
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
8. If nothing abnormal is visible, return an empty findings array - do not invent findings. "findings" holds ONLY abnormalities you can see. When the notes suggest a condition that the image does not show, say so in summary/overallAssessment; never create a finding such as "symptoms without radiographic correlate"
9. Report ONE finding per distinct lesion or region, each with its own tight boundingBox. Never merge lesions from different areas or from both lungs/sides into a single finding or a single large box
10. Keep severity consistent with your recommendation: if you advise urgent work-up, severity must be "high" or "critical"
11. When you cite the clinical notes, quote the doctor's wording exactly. Never rephrase or reinterpret a symptom (for example, do not turn "blood vomiting" into "hemoptysis")
12. Use the full severity range: reserve "critical" for immediately life-threatening findings. Confidence is how certain you are of THIS finding on THIS image; stay below 90 unless the finding is unmistakable, and lower it when the box or the diagnosis is uncertain
13. supportingEvidence must describe what is visible - approximate size, shape, margins and density - not just restate the finding
14. Do not state absolute measurements (cm, mm) - the image has no scale. Describe size relatively (for example "occupies roughly a third of the lower zone")
15. Check the patient's allergies before recommending any treatment. Never suggest a drug or contrast agent the patient is allergic to, and when you suggest antibiotics or contrast imaging, state the relevant listed allergy and ask the doctor to choose an alternative
16. You CANNOT see earlier images, so you cannot judge change over time. Never use words such as improved, improving, resolving, resolved, clearing, interval change, worsened, progressed, increased, decreased, new, unchanged or stable. Do not infer change from the clinical notes either (for example from "fever settled"). Describe only what THIS image shows, you may state what an earlier report listed (quoting its date), and you must tell the doctor to compare the images directly
17. Laterality: on a standard PA chest radiograph the patient's RIGHT side is on the LEFT of the image (check for an L/R marker). A finding described as right-sided must have its boundingBox on the left half of the image, and vice versa

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

  const priorSection = formatPriorAnalyses(input.priorAnalyses);

  const userPrompt = `Please analyze this ${input.imageType} medical image for a ${input.patientInfo.age}-year-old ${input.patientInfo.gender} patient.

Clinical Context:
- Medical History: ${input.patientInfo.medicalHistory || 'Not provided'}
- Current Medications: ${input.patientInfo.currentMedications?.join(', ') || 'None listed'}
- Allergies: ${input.patientInfo.allergies?.join(', ') || 'None listed'}
- Clinical Notes/Symptoms: ${input.clinicalNotes || 'Not provided'}
- Referring doctor's preliminary impression (UNVERIFIED - do not repeat it unless the image supports it): ${input.preliminaryFindings?.trim() || 'Not provided'}
${priorSection}

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
    const { findings, notLocalized, dropped } = sanitizeFindings(parsedResult.findings, rating, !!input.clinicalNotes?.trim());
    return {
      summary: parsedResult.summary || 'Analysis complete',
      findings,
      overallAssessment: parsedResult.overallAssessment || '',
      imageQuality: parsedResult.imageQuality || 'Unknown',
      imageQualityRating: rating,
      qualityWarning: qualityWarningFor(rating),
      comparisonCaveat: comparisonCaveatFor(input.priorAnalyses, parsedResult, findings),
      droppedFindings: dropped,
      notLocalized,
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
    comparisonCaveat: null,
    droppedFindings: 0,
    notLocalized: [],
    disclaimer: DEFAULT_DISCLAIMER,
    rawResponse: rawText,
    modelUsed: MODEL_NAME,
    processingTime,
  };
}
