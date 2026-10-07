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
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

## Notes

- The images are freely licensed Wikimedia Commons radiographs, listed in `ATTRIBUTION.md`. Images are not committed to Git (see `.gitignore`); download them again from the links if you need them.
- The scenario 4 image was made by blurring, darkening, adding noise and rotating the scenario 2 image.
- Results from one run of a language model can vary. Repeat a scenario if a result looks borderline.
- This is a behaviour checklist, not a clinical validation.
