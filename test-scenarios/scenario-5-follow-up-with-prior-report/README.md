# Scenario 5: follow-up scan with a prior report (comparison)

**Goal:** Run scenario 1 first for the same patient, then run this one with the same image as a follow-up. Tests the prior-report context and the rule against inventing comparisons.

## 1. Patient record
Create the patient first (Patients > Add patient) with the details below, then open New Analysis, pick that patient and fill the form.

| Field | Value |
|-------|-------|
| Name | Test Patient A (same patient as scenario 1) |
| Age | 52 |
| Gender | Male |
| Medical history | Smoker, no known lung disease |
| Allergies | None |
| Current medications | None |

## 2. Analysis form
| Field | Value |
|-------|-------|
| Image | `chest_xray_followup.jpg` |
| Imaging modality | Chest X-Ray |
| Clinical notes | contents of `clinical_notes.txt` (copy exactly) |
| Preliminary findings | leave empty |

**Prerequisite:** scenario 1 already run for the same patient, so a prior report exists.

## 3. Expected result
- The AI may mention the earlier report, but only to say what the **text summary** of that report listed.
- It does not claim a lesion grew, shrank or is "unchanged" unless the report text and the current image both support it. The identical image here means "no visible change" is the most it should say, with caution, because it cannot see the old image.
- Findings and boxes are consistent with scenario 1, and the assessment suggests clinical correlation.

## 4. Fails if
- Statements such as "increased in size by 2 cm" or "new lesion" with no basis.
- Measurements or sizes that appear in neither the prior report text nor the image.

## 5. Record your result
- Date run:
- Findings returned (count):
- Confidence values:
- Image quality rating:
- Pass / Fail:
- Notes:
