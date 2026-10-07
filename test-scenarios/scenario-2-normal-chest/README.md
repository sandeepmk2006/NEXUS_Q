# Scenario 2: normal chest X-ray (negative control)

**Goal:** Negative control. A healthy chest must not produce invented findings.

## 1. Patient record
Create the patient first (Patients > Add patient) with the details below, then open New Analysis, pick that patient and fill the form.

| Field | Value |
|-------|-------|
| Name | Test Patient B |
| Age | 28 |
| Gender | Female |
| Medical history | None |
| Allergies | None |
| Current medications | None |

## 2. Analysis form
| Field | Value |
|-------|-------|
| Image | `chest_xray_normal.jpg` |
| Imaging modality | Chest X-Ray |
| Clinical notes | contents of `clinical_notes.txt` (copy exactly) |
| Preliminary findings | leave empty |

## 3. Expected result
- 0 findings.
- The report says "No abnormalities identified".
- Summary says the lung fields are clear.
- Assessment is doctor-addressed and suggests clinical correlation for the cough.

## 4. Fails if
- Any finding with a box on this image (a false positive).
- The report claims the patient has an infection because of the cough.

## 5. Record your result
- Date run:
- Findings returned (count):
- Confidence values:
- Image quality rating:
- Pass / Fail:
- Notes:
