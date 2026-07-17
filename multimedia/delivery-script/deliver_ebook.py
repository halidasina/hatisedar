"""
Kesihatan Jiwa - Auto Delivery Script

Polls toyyibpay for paid transactions, watermarks the ebook PDF with the
buyer's name/email via pdf.co, and emails it to the buyer.

Run on a schedule (e.g. every 10 minutes) via Windows Task Scheduler.
"""

import json
import os
import smtplib
from email.message import EmailMessage

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
PROCESSED_PATH = os.path.join(SCRIPT_DIR, "processed.json")
LOG_PATH = os.path.join(SCRIPT_DIR, "delivery.log")


def log(message):
    print(message)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(message + "\n")


def load_config():
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def load_processed():
    if os.path.exists(PROCESSED_PATH):
        with open(PROCESSED_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_processed(data):
    with open(PROCESSED_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_paid_transactions(config):
    url = "https://toyyibpay.com/index.php/api/getBillTransactions"
    resp = requests.post(
        url,
        data={
            "userSecretKey": config["toyyibpay_secret_key"],
            "billCode": config["toyyibpay_bill_code"],
        },
        timeout=30,
    )
    resp.raise_for_status()
    transactions = resp.json()
    if not isinstance(transactions, list):
        raise RuntimeError(f"Unexpected toyyibpay response: {transactions}")
    return [t for t in transactions if t.get("billpaymentStatus") == "1"]


def download_ebook(config):
    url = f"https://drive.google.com/uc?export=download&id={config['drive_file_id']}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    if resp.headers.get("content-type", "").startswith("text/html"):
        raise RuntimeError(
            "Google Drive returned an HTML page instead of the PDF. "
            "Make sure the file is shared as 'Anyone with the link'."
        )
    return resp.content


def watermark_pdf(pdf_bytes, name, email, config):
    api_key = config["pdfco_api_key"]

    upload_resp = requests.post(
        "https://api.pdf.co/v1/file/upload",
        headers={"x-api-key": api_key},
        files={"file": ("ebook.pdf", pdf_bytes, "application/pdf")},
        timeout=60,
    )
    upload_resp.raise_for_status()
    upload_data = upload_resp.json()
    if upload_data.get("error"):
        raise RuntimeError(f"pdf.co upload error: {upload_data}")
    file_url = upload_data["url"]

    watermark_text = f"Pembeli: {name} | {email}"
    edit_resp = requests.post(
        "https://api.pdf.co/v1/pdf/edit/add",
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        json={
            "url": file_url,
            "name": "watermarked.pdf",
            "annotations": [
                {
                    "text": watermark_text,
                    "pages": "0-",
                    "x": 30,
                    "y": 15,
                    "size": 9,
                    "color": "#999999",
                }
            ],
            "async": False,
        },
        timeout=120,
    )
    edit_resp.raise_for_status()
    edit_data = edit_resp.json()
    if edit_data.get("error"):
        raise RuntimeError(f"pdf.co watermark error: {edit_data}")

    result_resp = requests.get(edit_data["url"], timeout=60)
    result_resp.raise_for_status()
    return result_resp.content


def send_email(name, email, pdf_bytes, config):
    msg = EmailMessage()
    msg["Subject"] = f"Buku anda sudah sedia — {config['ebook_title']}"
    msg["From"] = config["gmail_address"]
    msg["To"] = email
    msg.set_content(
        f"""Assalamualaikum {name},

Terima kasih atas pembelian anda.

Ebook "{config['ebook_title']}" disertakan dalam emel ini sebagai
lampiran PDF.

Salam sejahtera,
Molife Marketing
"""
    )
    msg.add_alternative(
        f"""\
<!DOCTYPE html>
<html lang="ms">
<body style="margin:0;padding:0;background:#faf6ef;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px;">
    <div style="background:#2d5a4e;border-radius:12px;padding:28px 20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:10px;letter-spacing:2px;color:#a0c4b8;margin-bottom:10px;">
        PANDUAN KESIHATAN JIWA BERLANDASKAN ISLAM
      </div>
      <div style="font-size:11px;letter-spacing:2px;color:#b8972a;margin-bottom:6px;">
        PEMBAYARAN BERJAYA
      </div>
      <h1 style="font-size:20px;font-weight:500;color:#faf6ef;margin:0;line-height:1.4;">
        Terima kasih, {name}!
      </h1>
    </div>

    <div style="background:#ffffff;border:1px solid #d4c4a0;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="font-size:14px;color:#5a5248;line-height:1.7;margin:0 0 12px;">
        Ebook anda <strong style="color:#2d5a4e;">"{config['ebook_title']}"</strong>
        disertakan dalam emel ini sebagai lampiran PDF.
      </p>
      <p style="font-size:14px;color:#5a5248;line-height:1.7;margin:0;">
        Salinan ini dicetak khusus untuk anda sebagai tanda hakmilik peribadi.
        Semoga ia menjadi permulaan kepada jalan pulih jiwa anda.
      </p>
    </div>

    <div style="background:#f0e8d8;border:1px solid #d4c4a0;border-radius:12px;padding:16px 20px;text-align:center;">
      <p style="font-size:12px;color:#9a8060;margin:0;line-height:1.6;">
        Sebarang pertanyaan, hubungi kami di
        <a href="mailto:molifemarketing@gmail.com" style="color:#2d5a4e;text-decoration:underline;">molifemarketing@gmail.com</a>
      </p>
    </div>

    <p style="font-size:13px;color:#9a8060;text-align:center;margin:20px 0 0;">
      Salam sejahtera,<br>Molife Marketing
    </p>
  </div>
</body>
</html>
""",
        subtype="html",
    )
    msg.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=config["ebook_filename"],
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(config["gmail_address"], config["gmail_app_password"])
        smtp.send_message(msg)


def main():
    config = load_config()
    processed = load_processed()

    transactions = get_paid_transactions(config)
    log(f"Checked toyyibpay: {len(transactions)} paid transaction(s) found.")

    new_count = 0
    for t in transactions:
        invoice = t.get("billpaymentInvoiceNo")
        if not invoice or invoice in processed:
            continue

        name = (t.get("billTo") or "Pembeli").strip()
        email = (t.get("billEmail") or "").strip()

        if not email:
            log(f"Skipping {invoice}: no email on transaction.")
            continue

        try:
            pdf_bytes = download_ebook(config)
            watermarked = watermark_pdf(pdf_bytes, name, email, config)
            send_email(name, email, watermarked, config)

            processed[invoice] = {"name": name, "email": email}
            save_processed(processed)
            new_count += 1
            log(f"Sent ebook to {email} (invoice {invoice}).")
        except Exception as exc:
            log(f"ERROR processing invoice {invoice} ({email}): {exc}")

    log(f"Done. {new_count} new ebook(s) sent.\n")


if __name__ == "__main__":
    main()
