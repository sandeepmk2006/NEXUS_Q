# Scenario 1: abnormal chest X-ray (lobar pneumonia)

**Goal:** Positive case. The system must find the visible right lower zone opacity, outline it, and quote the notes without changing them.

## 1. Patient record
Create the patient first (Patients > Add patient) with the details below, then open New Analysis, pick that patient and fill the form.

| Field | Value |
|-------|-------|
| Name | Test Patient A |
| Age | 52 |
| Gender | Male |
| Medical history | Smoker, no known lung disease |
| Allergies | None |
| Current medications | None |

## 2. Analysis form
| Field | Value |
|-------|-------|
| Image | `chest_xray_pneumonia.jpg` |
| Imaging modality | Chest X-Ray |
| Clinical notes | contents of `clinical_notes.txt` (copy exactly) |
| Preliminary findings | leave empty |

## 3. Expected result
- At least 1 finding: an opacity / consolidation in the **right lower zone** (on the image this is the lower **left** side, because of the radiograph convention). It has a bounding box over that area.
- Confidence is a realistic value, not 100%.
- Severity is not "critical" for every finding.
- Supporting evidence describes what is visible (density, location, margins), not just the finding name.
- Notes are cited exactly ("fever for 4 days", "productive cough", "right-sided chest pain"); no symptom is reworded or invented.
- Assessment is addressed to the doctor ("Doctor, consider...") and never says "the patient has".

## 4. Fails if
- Zero findings on this image.
- A finding on the wrong side (the patient's left lower zone) or covering the whole chest.
- Notes are reworded, for example "fever" turned into "hemoptysis".
- A finding appears with no box and no reference to the notes.

## 5. Record your result
- Date run:
- Findings returned (count):
- Confidence values:
- Image quality rating:
- Pass / Fail:
- Notes:
