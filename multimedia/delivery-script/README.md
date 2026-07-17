# Kesihatan Jiwa — Auto Delivery Script

Polls toyyibpay for paid orders, watermarks the ebook PDF with the buyer's
name/email via pdf.co, and emails it to the buyer. Runs on a schedule
(every 10 minutes) via Windows Task Scheduler — no Make.com needed.

## 1. Install requirements

```
python -m pip install requests
```

## 2. Create your config

Copy `config.example.json` to `config.json` and fill in the real values:

```
copy config.example.json config.json
```

Fields:
- `toyyibpay_secret_key` / `toyyibpay_bill_code` — already filled in from your setup
- `drive_file_id` — the ebook PDF's Google Drive file ID (already filled in).
  Make sure this file is shared as **"Anyone with the link" → Viewer**.
- `pdfco_api_key` — from your pdf.co dashboard → API Keys
- `gmail_address` — `molifemarketing@gmail.com`
- `gmail_app_password` — a 16-character **App Password** (not your normal
  Gmail password). To create one:
  1. Enable 2-Step Verification on the Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Create an app password for "Mail" and paste the 16-char code here

`config.json` is in `.gitignore` so it won't be committed.

## 3. Test it manually

```
python deliver_ebook.py
```

Check `delivery.log` for output. On first run, it will email every
already-paid transaction it finds (since `processed.json` starts empty) —
so test with a real or sandbox transaction, or pre-populate
`processed.json` with existing invoice numbers you don't want to re-send.

## 4. Schedule it (Windows Task Scheduler)

1. Open **Task Scheduler** → **Create Task**
2. **General** tab: name it "Kesihatan Jiwa Delivery"
3. **Triggers** tab: New → Daily, repeat task every **10 minutes**, for a
   duration of **1 day** (so it loops indefinitely)
4. **Actions** tab: New → Start a program
   - Program/script: full path to `python.exe`
   - Add arguments: `deliver_ebook.py`
   - Start in: `C:\Users\HP\Desktop\molife\multimedia\delivery-script`
5. Save. The task will now run every 10 minutes, even if no one is logged
   in (check "Run whether user is logged on or not").

## How it tracks "already sent"

`processed.json` stores each `billpaymentInvoiceNo` that's been emailed.
On every run, only new paid invoices not in this file get processed. Keep
this file — deleting it will cause re-sends to everyone who ever paid.

## Troubleshooting

- **"Google Drive returned an HTML page"**: the PDF's sharing setting isn't
  public. Set it to "Anyone with the link".
- **pdf.co errors**: check your API key and that you have credits left.
- **Email not sending**: double-check the Gmail App Password (spaces are
  fine to include or remove, Google ignores them).
