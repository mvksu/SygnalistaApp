# Page snapshot

```yaml
- heading "Submit a Report" [level=1]
- heading "Report an issue" [level=1]
- paragraph: Please provide a detailed description of the issue you are experiencing.
- text: Subject
- textbox "Short summary of your report": Automated Test 1756137412486
- text: Choose how you would like to report
- button "Report Confidentially Provide optional contact so handlers can reach you."
- button "Report Anonymously Do not share identifying information; you will receive a receipt and passphrase."
- text: Select categories associated with the case
- combobox:
  - option "Select a category"
  - option "Safety" [selected]
  - option "Fraud"
  - option "Harassment"
- text: Description
- textbox "Describe the issue...": This is an E2E test message that exceeds 20 characters.
- text: Files
- button "Choose files"
- paragraph: Attach any relevant documents or images. (Optional)
- text: Voice message Record up to 15 minutes and attach it to your report. 0:00
- button "Start recording"
- checkbox "Submit anonymously" [checked]
- text: Submit anonymously
- paragraph: Please complete the CAPTCHA
- button "Submit report"
- text: All communications are encrypted.
- paragraph: You can submit anonymously. Your identity will not be stored unless you choose to provide contact information.
- text: xl
- region "Notifications alt+T"
- alert
```