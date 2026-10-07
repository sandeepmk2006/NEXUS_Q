# Test scenarios

Five repeatable cases for checking TetrixAI end to end. Each folder has:

- the image to upload
- `clinical_notes.txt` and (when needed) `preliminary_findings.txt` to paste into the form
- a `README.md` with the patient record, the form values, the expected result, what counts as a failure, and a place to record your result

## Run order

| # | Scenario | What it checks | Image |
|---|----------|----------------|-------|
| 1 | Abnormal, lobar pneumonia | Detection, correct side, box, verbatim notes | abnormal |
| 2 | Normal chest | No false positives | normal |
| 3 | Misleading notes and wrong impression | Trusts the image over suggestions | normal |
| 4 | Poor quality image | Quality warning, lowered confidence | degraded |
| 5 | Follow-up with a prior report | Uses prior text without inventing comparisons | abnormal |

Run 1 before 5, and use the same patient for both.

## Results

| # | Date | Findings | Max confidence | Quality | Pass / Fail |
|---|------|----------|----------------|---------|-------------|
| 1 | 2026-10-07 | 1 boxed: right lower zone consolidation (correct side) | 88% | good | Pass |
| 2 | Not yet run with the scenario 2 image | | | | Pending |
| 3 | 2026-10-07 | 0 (lungs clear despite pneumonia notes) | n/a | good | Pass |
| 4 | 2026-10-07 | 0 (no invented findings), quality warning shown | n/a | fair | Pass |
| 5 | 2026-10-07 | 1 boxed: right lower zone opacity, no change claimed | 88% | good | Pass |

### What the runs showed and what was fixed

| Scenario | First run | Fix | Rerun |
|----------|-----------|-----|-------|
| 1 | Invented a "6 cm" size and ignored the penicillin allergy | Prompt forbids absolute measurements and requires allergy checks before treatment advice | Relative size; penicillin and sulfonamide allergies named |
| 3 | Reported "symptoms without radiographic correlate" as a boxed finding, with the box on the wrong side | Absence-type titles moved out of findings in code; left/right box check with a 30-point penalty | No boxed findings |
| 4 | Rated a blurred, noisy image "good" | Rating capped by problems the model's own description admits | Rated fair with a warning |
| 5 | Claimed "improvement" and "resolving pneumonia" from an identical image | Change-over-time wording forbidden; caveat shown if it appears anyway | Describes the current image only and cites the earlier report by date |

Earlier, before these scenario files existed, a normal chest X-ray of the user's own returned 0 findings. Scenario 2 still needs a run with its own image.

## Notes

- The images are freely licensed Wikimedia Commons radiographs, listed in `ATTRIBUTION.md`. Images are not committed to Git (see `.gitignore`); download them again from the links if you need them.
- The scenario 4 image was made by blurring, darkening, adding noise and rotating the scenario 2 image.
- Results from one run of a language model can vary. Repeat a scenario if a result looks borderline.
- This is a behaviour checklist, not a clinical validation.
