import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

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
  disclaimer: string;
  rawResponse: string;
  modelUsed: string;
  processingTime: number;
}

export async function analyzemedicalImage(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

  const systemPrompt = `You are NEXUS-Q, an advanced AI medical imaging assistant. You are a SECOND OPINION TOOL — never a replacement for clinical judgment. Your role is to assist physicians by identifying and localizing potential abnormalities in medical images.

CRITICAL RULES:
1. Every finding MUST be backed by specific image evidence (location) AND/OR clinical notes
2. NEVER present a finding without pointing to its exact location in the image
3. ALWAYS include confidence levels (0-100%) — do not state everything with certainty
4. ALWAYS frame responses as suggestions to the doctor: "Doctor, consider examining..." not "The patient has..."
5. A finding with no image location AND no clinical evidence = hallucination — do not include it
6. Flag image quality issues that may affect analysis reliability

RESPONSE FORMAT (JSON):
{
  "summary": "Brief clinical summary of key findings",
  "imageQuality": "Assessment of image quality (excellent/good/fair/poor) and any quality issues",
  "findings": [
    {
      "finding": "Specific finding description",
      "location": "Precise anatomical location in the image (e.g., 'upper-right quadrant', 'left lower lobe', 'periventricular region')",
      "confidence": 85,
      "severity": "moderate",
      "supportingEvidence": "What in the image OR clinical notes supports this finding",
      "recommendation": "Suggested clinical action for the physician"
    }
  ],
  "overallAssessment": "Doctor-addressed overall assessment with appropriate clinical caution",
  "disclaimer": "Standard medical AI disclaimer"
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

  // Parse JSON response
  let parsedResult: any = null;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON response, using raw text');
  }

  const processingTime = Date.now() - startTime;

  if (parsedResult) {
    return {
      summary: parsedResult.summary || 'Analysis complete',
      findings: parsedResult.findings || [],
      overallAssessment: parsedResult.overallAssessment || '',
      imageQuality: parsedResult.imageQuality || 'Unknown',
      disclaimer: parsedResult.disclaimer || 'This AI analysis is intended as a decision support tool only and should not replace clinical judgment.',
      rawResponse: rawText,
      modelUsed: 'gemini-3.8-flash',
      processingTime,
    };
  }

  // Fallback if JSON parsing fails
  return {
    summary: 'Analysis completed. Please review raw response.',
    findings: [],
    overallAssessment: rawText,
    imageQuality: 'Unknown',
    disclaimer: 'This AI analysis is intended as a decision support tool only and should not replace clinical judgment.',
    rawResponse: rawText,
    modelUsed: 'gemini-3.8-flash',
    processingTime,
  };
}
