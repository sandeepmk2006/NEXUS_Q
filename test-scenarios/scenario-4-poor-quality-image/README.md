# Scenario 4: poor quality image

**Goal:** Image is blurred, low contrast, noisy and rotated. The system must warn and be less confident, not guess boldly.

## 1. Patient record
Create the patient first (Patients > Add patient) with the details below, then open New Analysis, pick that patient and fill the form.

| Field | Value |
|-------|-------|
| Name | Test Patient D |
| Age | 41 |
| Gender | Male |
| Medical history | Asthma |
| Allergies | None |
| Current medications | Salbutamol inhaler |

## 2. Analysis form
| Field | Value |
|-------|-------|
| Image | `chest_xray_poor_quality.jpg` |
| Imaging modality | Chest X-Ray |
| Clinical notes | contents of `clinical_notes.txt` (copy exactly) |
| Preliminary findings | leave empty |

## 3. Expected result
- Image quality rating is **poor** or **fair**.
- An amber quality warning banner appears on the report.
- Any finding has reduced confidence (poor quality scales confidence by 0.6, fair by 0.85).
- The assessment recommends repeating or re-acquiring the image.

## 4. Fails if
- Quality rated good or excellent and no warning shown.
- Several high-confidence findings (above 80%) on an unreadable image.

## 5. Record your result
- Date run:
- Findings returned (count):
- Confidence values:
- Image quality rating:
- Pass / Fail:
- Notes:
