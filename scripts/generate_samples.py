#!/usr/bin/env python3
"""
Fictional Sample Document Generator for VisaVault Hackathon Demo.

Creates clearly FAKE, fully watermarked sample documents for 4 fictional travelers:
1. Aarav Example    - Visa fully covers trip (Good to go)
2. Meera Sample    - Visa valid but problems (Passport expires soon, 90/180 limit exceeded)
3. Rohan Demo      - No visa, missing insurance & NOC, stale bank statement (New application)
4. Sana Testcase   - Inconsistencies (Name mismatch, hotel shorter than flight, low coverage, low balance)

Hard Rules Enforced:
- Every document carries a diagonal, semi-transparent watermark: "SAMPLE - NOT A REAL DOCUMENT"
- Every document carries a footer line: "Fictional demo data for software testing"
- Watermarks are rendered LAST, on top of all layers.
- All numbers, names, addresses, and organizations are fictitious.
- No real emblems, seals, holograms, or security features. Generic placeholder emblems used.
- Photos are neutral placeholder silhouettes (no real or AI faces).
- Dates calculated dynamically relative to BASE_DATE (default 2026-10-11, overridable via --base-date).
"""

import os
import sys
import math
import random
import json
import argparse
from datetime import datetime, date, timedelta
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# -----------------------------------------------------------------------------
# Configuration & Typography
# -----------------------------------------------------------------------------

DEFAULT_BASE_DATE = "2026-10-11"

def get_fonts():
    """Load Windows standard TTF fonts or fall back gracefully to default PIL font."""
    font_paths = {
        "regular": "C:/Windows/Fonts/arial.ttf",
        "bold": "C:/Windows/Fonts/arialbd.ttf",
        "mono": "C:/Windows/Fonts/cour.ttf",
        "mono_bold": "C:/Windows/Fonts/courbd.ttf",
        "condensed": "C:/Windows/Fonts/calibri.ttf",
    }
    
    loaded = {}
    for name, path in font_paths.items():
        if os.path.exists(path):
            loaded[name] = path
        else:
            loaded[name] = None
    return loaded

FONTS = get_fonts()

def font(style="regular", size=20):
    path = FONTS.get(style)
    if path:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

# -----------------------------------------------------------------------------
# Watermarking & Footer (MANDATORY & RENDERED LAST)
# -----------------------------------------------------------------------------

def apply_watermark_and_footer(image: Image.Image, watermark_text="SAMPLE - NOT A REAL DOCUMENT", footer_text="Fictional demo data for software testing") -> Image.Image:
    """
    Renders a prominent diagonal semi-transparent watermark across the center of the image,
    and a clear footer notice at the bottom edge.
    Always executed LAST on top of all graphics and text.
    """
    # Ensure image is RGBA for blending
    if image.mode != "RGBA":
        base = image.convert("RGBA")
    else:
        base = image.copy()
        
    w, h = base.size
    
    # Create overlay for transparent drawing
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # 1. Diagonal Watermark Text
    # Calculate appropriate font size based on page dimensions
    font_size = max(32, int(min(w, h) * 0.055))
    wm_font = font("bold", font_size)
    
    # Create a separate transparent canvas for the text
    # Measure text bounding box
    dummy_draw = ImageDraw.Draw(overlay)
    bbox = dummy_draw.textbbox((0, 0), watermark_text, font=wm_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    pad = 40
    txt_img = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    
    # Draw text with high-visibility crimson tint and semi-transparency (alpha = 85 / 255)
    txt_draw.text((pad, pad), watermark_text, fill=(220, 38, 38, 85), font=wm_font)
    
    # Draw double bounding border around watermark banner
    txt_draw.rectangle([pad - 10, pad - 8, pad + tw + 10, pad + th + 8], outline=(220, 38, 38, 70), width=4)
    
    # Rotate text at -32 degrees
    rotated_txt = txt_img.rotate(32, expand=True, resample=Image.BICUBIC)
    rw, rh = rotated_txt.size
    
    # Paste centered on overlay
    pos_x = (w - rw) // 2
    pos_y = (h - rh) // 2
    overlay.paste(rotated_txt, (pos_x, pos_y), rotated_txt)
    
    # 2. Small Footer Line at bottom
    footer_draw = ImageDraw.Draw(overlay)
    footer_font = font("bold", max(13, int(min(w, h) * 0.016)))
    f_bbox = footer_draw.textbbox((0, 0), footer_text, font=footer_font)
    fw = f_bbox[2] - f_bbox[0]
    fh = f_bbox[3] - f_bbox[1]
    
    # Bottom banner bar
    footer_bar_h = fh + 16
    footer_draw.rectangle([0, h - footer_bar_h, w, h], fill=(244, 244, 245, 230))
    footer_draw.line([(0, h - footer_bar_h), (w, h - footer_bar_h)], fill=(212, 212, 216, 255), width=2)
    
    # Centered footer text
    footer_draw.text(((w - fw) // 2, h - footer_bar_h + 8), footer_text, fill=(82, 82, 91, 240), font=footer_font)
    
    # Alpha composite over base image
    combined = Image.alpha_composite(base, overlay)
    return combined

# -----------------------------------------------------------------------------
# Phone Scan Effect (Light Rotation, Soft Shadow, Sensor Noise)
# -----------------------------------------------------------------------------

def apply_phone_scan_effect(img: Image.Image, angle_deg=1.3, noise_level=5) -> Image.Image:
    """
    Applies a realistic mobile scan effect:
    - Slight page rotation (1-2 degrees)
    - Realistic soft drop shadow against an off-white background
    - Subtle paper lighting gradient and sensor noise
    Keeps all text 100% legible for OCR and Vision models.
    """
    w, h = img.size
    
    # Convert input to RGB
    img_rgb = img.convert("RGB")
    
    # 1. Subtle lighting gradient (top-left slightly brighter, bottom-right slightly dimmer)
    gradient = Image.new("L", (w, h))
    g_draw = ImageDraw.Draw(gradient)
    for y in range(h):
        val = int(255 - (y / h) * 16)
        g_draw.line([(0, y), (w, y)], fill=val)
    # Blend gently
    img_rgb = Image.composite(img_rgb, Image.new("RGB", (w, h), (230, 230, 230)), gradient)
    
    # 2. Add very fine digital sensor noise
    random.seed(42)
    pixels = img_rgb.load()
    for _ in range(w * h // 30):
        rx = random.randint(0, w - 1)
        ry = random.randint(0, h - 1)
        r, g, b = pixels[rx, ry]
        delta = random.randint(-noise_level, noise_level)
        pixels[rx, ry] = (
            max(0, min(255, r + delta)),
            max(0, min(255, g + delta)),
            max(0, min(255, b + delta))
        )
        
    # 3. Create canvas for rotation with background desk texture
    pad = 80
    bg_w = w + pad * 2
    bg_h = h + pad * 2
    
    # Desk background: soft cream/light wood desk color
    desk = Image.new("RGBA", (bg_w, bg_h), (241, 239, 235, 255))
    
    # 4. Soft drop shadow
    shadow_mask = Image.new("RGBA", (w, h), (40, 40, 40, 90))
    rot_shadow = shadow_mask.rotate(angle_deg, expand=True, resample=Image.BICUBIC)
    rot_shadow = rot_shadow.filter(ImageFilter.GaussianBlur(radius=10))
    
    # Paste shadow slightly offset (+12, +16)
    sw, sh = rot_shadow.size
    shadow_x = (bg_w - sw) // 2 + 10
    shadow_y = (bg_h - sh) // 2 + 14
    desk.paste(rot_shadow, (shadow_x, shadow_y), rot_shadow)
    
    # 5. Rotate the document and paste
    doc_rgba = img_rgb.convert("RGBA")
    rot_doc = doc_rgba.rotate(angle_deg, expand=True, resample=Image.BICUBIC)
    dw, dh = rot_doc.size
    doc_x = (bg_w - dw) // 2
    doc_y = (bg_h - dh) // 2
    desk.paste(rot_doc, (doc_x, doc_y), rot_doc)
    
    return desk.convert("RGB")

# -----------------------------------------------------------------------------
# Drawing Helpers: Placeholder Crest, Silhouette, QR/Barcode
# -----------------------------------------------------------------------------

def draw_placeholder_crest(draw: ImageDraw.ImageDraw, center_x: int, center_y: int, radius=36, label="SAMPLE"):
    """Draws a clean, non-governmental placeholder emblem (circle with SAMPLE and stars)."""
    # Outer circle
    draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], outline=(71, 85, 105), width=3)
    # Inner circle
    draw.ellipse([center_x - radius + 6, center_y - radius + 6, center_x + radius - 6, center_y + radius - 6], outline=(148, 163, 184), width=1)
    
    # Center text
    c_font = font("bold", max(11, radius // 3))
    bbox = draw.textbbox((0, 0), label, font=c_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((center_x - tw // 2, center_y - th // 2), label, fill=(51, 65, 85), font=c_font)
    
    # Stars above and below
    s_font = font("regular", max(9, radius // 4))
    draw.text((center_x - 14, center_y - radius + 9), "★ ★ ★", fill=(100, 116, 139), font=s_font)
    draw.text((center_x - 14, center_y + radius - 19), "★ ★ ★", fill=(100, 116, 139), font=s_font)

def create_neutral_silhouette(w=260, h=340) -> Image.Image:
    """Creates a neutral vector placeholder silhouette (no real or AI faces)."""
    img = Image.new("RGBA", (w, h), (241, 245, 249, 255))
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([0, 0, w - 1, h - 1], outline=(203, 213, 225), width=2)
    
    # Head (ellipse)
    head_w = int(w * 0.42)
    head_h = int(h * 0.40)
    head_cx = w // 2
    head_cy = int(h * 0.36)
    draw.ellipse([head_cx - head_w // 2, head_cy - head_h // 2, head_cx + head_w // 2, head_cy + head_h // 2], fill=(148, 163, 184))
    
    # Shoulders / Torso (smooth arch)
    shoulders_top = int(h * 0.58)
    draw.pieslice([int(w * 0.12), shoulders_top, int(w * 0.88), int(h * 1.25)], 180, 360, fill=(148, 163, 184))
    
    # Label at bottom
    lbl_font = font("bold", 12)
    lbl = "SPECIMEN PHOTO"
    bbox = draw.textbbox((0, 0), lbl, font=lbl_font)
    lw = bbox[2] - bbox[0]
    draw.rectangle([0, h - 26, w, h], fill=(226, 232, 240))
    draw.text(((w - lw) // 2, h - 20), lbl, fill=(71, 85, 105), font=lbl_font)
    
    return img

def draw_fake_barcode(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int, code_str: str):
    """Draws a clean fake linear barcode for realistic ticket/voucher styling."""
    draw.rectangle([x, y, x + width, y + height], fill=(255, 255, 255))
    random.seed(abs(hash(code_str)))
    curr_x = x + 6
    end_x = x + width - 6
    while curr_x < end_x:
        bar_w = random.choice([2, 3, 4, 6])
        if curr_x + bar_w > end_x:
            break
        draw.rectangle([curr_x, y + 4, curr_x + bar_w, y + height - 16], fill=(0, 0, 0))
        gap = random.choice([2, 3, 4, 5])
        curr_x += bar_w + gap
    
    # Code label
    b_font = font("mono", 11)
    bbox = draw.textbbox((0, 0), code_str, font=b_font)
    cw = bbox[2] - bbox[0]
    draw.text((x + (width - cw) // 2, y + height - 14), code_str, fill=(0, 0, 0), font=b_font)

# -----------------------------------------------------------------------------
# Document Generators (Pillow Pixel-Perfect High-Resolution Rendering)
# -----------------------------------------------------------------------------

def render_passport(data: dict) -> Image.Image:
    """Renders a standard international passport biodata page."""
    W, H = 1240, 850
    img = Image.new("RGBA", (W, H), (250, 250, 250, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer security border
    draw.rectangle([16, 16, W - 17, H - 17], outline=(203, 213, 225), width=2)
    draw.rectangle([24, 24, W - 25, H - 25], outline=(226, 232, 240), width=1)
    
    # Top header bar
    draw.rectangle([24, 24, W - 25, 115], fill=(30, 41, 59))
    draw_placeholder_crest(draw, 80, 70, radius=32, label="SMP")
    
    draw.text((135, 42), f"FICTIONAL STATE OF {data['issuingCountry'].upper()}", fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 74), "PASSPORT / PASSEPORT • FICTIONAL SPECIMEN", fill=(148, 163, 184), font=font("bold", 15))
    
    draw.text((W - 270, 52), f"PASSPORT NO: {data['passportNumber']}", fill=(248, 250, 252), font=font("bold", 16))
    
    # Main content layout
    # Left: Photo
    photo_img = create_neutral_silhouette(270, 360)
    img.paste(photo_img, (50, 140))
    
    # Right: Key-Value fields
    col1_x = 360
    col2_x = 780
    
    fields = [
        ("Type / Type", "P", "Country Code / Code", "SMP"),
        ("Passport No. / N° du passeport", data["passportNumber"], "National ID / N° d'identification", f"ID-{data['passportNumber']}"),
        ("Surname / Nom", data["fullName"].split()[-1].upper(), "", ""),
        ("Given Names / Prénoms", " ".join(data["fullName"].split()[:-1]).upper(), "", ""),
        ("Nationality / Nationalité", data["nationality"].upper(), "Sex / Sexe", "M" if "AARAV" in data["fullName"] or "ROHAN" in data["fullName"] else "F"),
        ("Date of birth / Date de naissance", data["dateOfBirth"], "Place of birth / Lieu de naissance", "SAMPLE METROPOLIS"),
        ("Date of issue / Date de délivrance", data["issueDate"], "Date of expiry / Date d'expiration", data["expiryDate"]),
        ("Issuing Authority / Autorité", "SAMPLELAND PASSPORT SERVICE", "Endorsements", "DEMO / TEST SPECIMEN"),
    ]
    
    cur_y = 135
    for row in fields:
        # Col 1
        draw.text((col1_x, cur_y), row[0].upper(), fill=(100, 116, 139), font=font("regular", 11))
        draw.text((col1_x, cur_y + 16), str(row[1]), fill=(15, 23, 42), font=font("bold", 17))
        
        # Col 2
        if row[2]:
            draw.text((col2_x, cur_y), row[2].upper(), fill=(100, 116, 139), font=font("regular", 11))
            draw.text((col2_x, cur_y + 16), str(row[3]), fill=(15, 23, 42), font=font("bold", 17))
            
        cur_y += 46
        
    # Machine Readable Zone (MRZ) box at the bottom
    mrz_box_y = H - 185
    draw.rectangle([40, mrz_box_y, W - 41, H - 45], fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    
    draw.text((55, mrz_box_y + 8), "SAMPLE MRZ • NOT A REAL MACHINE READABLE CODE • FOR TESTING ONLY", fill=(100, 116, 139), font=font("bold", 11))
    
    # Generate 2 lines of MRZ
    surname = data["fullName"].split()[-1].upper()
    given = " ".join(data["fullName"].split()[:-1]).upper().replace(" ", "<")
    mrz_line1 = f"P<SMP{surname}<<{given}".ljust(44, "<")[:44]
    
    # Line 2: passport number, nationality, dob YYMMDD, sex, expiry YYMMDD
    dob_fmt = data["dateOfBirth"].replace("-", "")[2:]
    exp_fmt = data["expiryDate"].replace("-", "")[2:]
    sex = "M" if "AARAV" in data["fullName"] or "ROHAN" in data["fullName"] else "F"
    mrz_line2 = f"{data['passportNumber']}0SMP{dob_fmt}4{sex}{exp_fmt}5<<<<<<<<<<<<<<<00"[:44]
    
    mrz_font = font("mono_bold", 23)
    draw.text((55, mrz_box_y + 36), mrz_line1, fill=(15, 23, 42), font=mrz_font)
    draw.text((55, mrz_box_y + 76), mrz_line2, fill=(15, 23, 42), font=mrz_font)
    
    return apply_watermark_and_footer(img)

def render_visa(data: dict) -> Image.Image:
    """Renders a standard Schengen short-stay visa vignette."""
    W, H = 1100, 720
    img = Image.new("RGBA", (W, H), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    
    # Intricate outer frame
    draw.rectangle([18, 18, W - 19, H - 19], outline=(51, 65, 85), width=2)
    draw.rectangle([24, 24, W - 25, H - 25], outline=(203, 213, 225), width=1)
    
    # Top header banner
    draw.rectangle([25, 25, W - 26, 110], fill=(15, 23, 42))
    draw_placeholder_crest(draw, 75, 68, radius=30, label="VISA")
    
    draw.text((125, 38), f"SCHENGEN VISA / VISA SCHENGEN ({data['country'].upper()})", fill=(255, 255, 255), font=font("bold", 20))
    draw.text((125, 68), "SHORT STAY / COURT SÉJOUR • FICTIONAL SPECIMEN", fill=(148, 163, 184), font=font("bold", 14))
    
    draw.text((W - 280, 52), f"REF: {data['referenceNumber']}", fill=(241, 245, 249), font=font("bold", 16))
    
    # Grid of fields
    rows = [
        ("VALID FOR / VALABLE POUR", data["region"].upper(), "NUMBER OF ENTRIES / NOMBRE D'ENTRÉES", data["entries"]),
        ("FROM / DU", data["validFrom"], "UNTIL / AU", data["validUntil"]),
        ("DURATION OF STAY / DURÉE DE SÉJOUR", f"{data['maxStayDays']} DAYS / JOURS (PER 180-DAY PERIOD)", "TYPE OF VISA / TYPE DE VISA", data["visaType"]),
        ("ISSUED IN / DÉLIVRÉ À", f"SAMPLELAND CONSULATE ({data['country']})", "ON / LE", data["validFrom"]),
        ("PASSPORT NUMBER / N° PASSEPORT", data["passportNumber"], "HOLDER / TITULAIRE", data["holderName"].upper()),
        ("REMARKS / REMARQUES", "SAMPLE VISA • FOR DEMO SOFTWARE TESTING PURPOSES ONLY", "DOC REF", data["referenceNumber"]),
    ]
    
    cur_y = 135
    for r in rows:
        draw.text((50, cur_y), r[0], fill=(100, 116, 139), font=font("regular", 11))
        draw.text((50, cur_y + 17), str(r[1]), fill=(15, 23, 42), font=font("bold", 17))
        
        draw.text((580, cur_y), r[2], fill=(100, 116, 139), font=font("regular", 11))
        draw.text((580, cur_y + 17), str(r[3]), fill=(15, 23, 42), font=font("bold", 17))
        cur_y += 56
        
    # Bottom MRZ Strip
    mrz_y = H - 170
    draw.rectangle([35, mrz_y, W - 36, H - 45], fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    draw.text((50, mrz_y + 6), "SAMPLE MRZ • FICTIONAL VISA CHECKSUM STRIP", fill=(100, 116, 139), font=font("bold", 10))
    
    surname = data["holderName"].split()[-1].upper()
    given = " ".join(data["holderName"].split()[:-1]).upper().replace(" ", "<")
    mrz1 = f"V<SMP{surname}<<{given}".ljust(44, "<")[:44]
    mrz2 = f"{data['referenceNumber']}0SMP<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"[:44]
    
    mrz_font = font("mono_bold", 22)
    draw.text((50, mrz_y + 30), mrz1, fill=(15, 23, 42), font=mrz_font)
    draw.text((50, mrz_y + 68), mrz2, fill=(15, 23, 42), font=mrz_font)
    
    return apply_watermark_and_footer(img)

def render_residence_permit(data: dict) -> Image.Image:
    """Renders a standard national residence identity card (Emirates ID placeholder style)."""
    W, H = 1000, 630
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Card Border
    draw.rectangle([14, 14, W - 15, H - 15], outline=(148, 163, 184), width=2)
    
    # Header Band
    draw.rectangle([16, 16, W - 17, 95], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 65, 55, radius=26, label="ID")
    
    draw.text((110, 32), f"{data['issuingCountry'].upper()} • RESIDENCE IDENTITY CARD", fill=(255, 255, 255), font=font("bold", 18))
    draw.text((110, 60), "UNITED ARAB EMIRATES RESIDENCY PERMIT • SAMPLE DEMO SPECIMEN", fill=(161, 161, 170), font=font("bold", 12))
    
    # Photo on left
    photo = create_neutral_silhouette(220, 290)
    img.paste(photo, (40, 120))
    
    # Fields on right
    col_x = 300
    rows = [
        ("Identity Number / رقم الهوية", data["idNumber"]),
        ("Card Holder / اسم حامل البطاقة", data["holderName"].upper()),
        ("Issuing Country / جهة الإصدار", data["issuingCountry"].upper()),
        ("Sponsor or Employer / الكفيل أو صاحب العمل", data["sponsorOrEmployer"]),
        ("Expiry Date / تاريخ الانتهاء", data["expiryDate"]),
        ("Card Serial / رقم البطاقة", f"RES-SMP-{abs(hash(data['idNumber'])) % 10000000:07d}"),
    ]
    
    cur_y = 120
    for title, val in rows:
        draw.text((col_x, cur_y), title, fill=(113, 113, 122), font=font("regular", 11))
        draw.text((col_x, cur_y + 16), str(val), fill=(9, 9, 11), font=font("bold", 17))
        cur_y += 48
        
    # Card Micro-stripe
    draw.rectangle([35, H - 90, W - 36, H - 42], fill=(244, 244, 245), outline=(228, 228, 231), width=1)
    draw.text((50, H - 76), f"I<ARE{data['idNumber'].replace('-', '')}<<<<<<<<<<0", fill=(39, 39, 42), font=font("mono_bold", 17))
    
    return apply_watermark_and_footer(img)

def render_bank_statement(data: dict) -> Image.Image:
    """Renders a standard formal bank account statement covering 3 months."""
    W, H = 1240, 1754
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Page Border
    draw.rectangle([25, 25, W - 26, H - 26], outline=(228, 228, 231), width=1)
    
    # Header Band
    draw.rectangle([26, 26, W - 27, 130], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 80, 78, radius=32, label="BANK")
    
    draw.text((135, 46), "SAMPLE INTERNATIONAL BANK (DUBAI)", fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 78), "RETAIL BANKING DIVISION • OFFICIAL FINANCIAL STATEMENT", fill=(161, 161, 170), font=font("bold", 14))
    
    draw.text((W - 270, 60), "CURRENCY: " + data["currency"], fill=(255, 255, 255), font=font("bold", 16))
    
    # Account Summary Box
    box_y = 155
    draw.rectangle([50, box_y, W - 51, box_y + 165], fill=(250, 250, 250), outline=(228, 228, 231), width=1)
    
    draw.text((70, box_y + 18), "ACCOUNT HOLDER NAME:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((70, box_y + 36), data["accountHolderName"].upper(), fill=(9, 9, 11), font=font("bold", 18))
    
    draw.text((70, box_y + 75), "ACCOUNT NUMBER / IBAN:", fill=(113, 113, 122), font=font("regular", 12))
    iban = f"AE00 9990 {abs(hash(data['accountHolderName'])) % 1000000000000:012d}"
    draw.text((70, box_y + 93), iban, fill=(9, 9, 11), font=font("bold", 16))
    
    draw.text((580, box_y + 18), "STATEMENT PERIOD:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((580, box_y + 36), f"{data['periodStart']} to {data['periodEnd']}", fill=(9, 9, 11), font=font("bold", 17))
    
    draw.text((580, box_y + 75), "CLOSING BALANCE:", fill=(113, 113, 122), font=font("regular", 12))
    bal_str = f"{data['closingBalance']:,.2f} {data['currency']}"
    draw.text((580, box_y + 93), bal_str, fill=(9, 9, 11), font=font("bold", 22))
    
    draw.text((70, box_y + 130), f"BRANCH: DUBAI DOWNTOWN   •   ACCOUNT TYPE: SALARY CURRENT ACCOUNT   •   STATUS: ACTIVE", fill=(82, 82, 91), font=font("regular", 12))
    
    # Transactions Table Header
    tbl_y = 350
    draw.rectangle([50, tbl_y, W - 51, tbl_y + 40], fill=(244, 244, 245))
    draw.line([(50, tbl_y + 40), (W - 51, tbl_y + 40)], fill=(212, 212, 216), width=2)
    
    headers = [("DATE", 70), ("DESCRIPTION", 210), ("REFERENCE", 620), ("DEBIT", 800), ("CREDIT", 950), ("BALANCE", 1080)]
    for title, x in headers:
        draw.text((x, tbl_y + 12), title, fill=(39, 39, 42), font=font("bold", 12))
        
    # Generate realistic transaction rows based on start and end dates
    p_start = datetime.strptime(data["periodStart"], "%Y-%m-%d").date()
    p_end = datetime.strptime(data["periodEnd"], "%Y-%m-%d").date()
    
    tx_rows = [
        (p_start + timedelta(days=5), "Monthly Salary Credit", "REF-SAL-01", "", "+22,500.00", "28,400.00"),
        (p_start + timedelta(days=12), "Supermarket & Groceries", "POS-7781", "-840.50", "", "27,559.50"),
        (p_start + timedelta(days=22), "Utility & Telecom Payment", "AUTOPAY-11", "-450.00", "", "27,109.50"),
        (p_start + timedelta(days=35), "Monthly Salary Credit", "REF-SAL-02", "", "+22,500.00", "49,609.50"),
        (p_start + timedelta(days=44), "Retail Purchase Mall of Emirates", "POS-9902", "-1,250.00", "", "48,359.50"),
        (p_start + timedelta(days=55), "Dining & Coffee Outlets", "POS-3321", "-310.00", "", "48,049.50"),
        (p_start + timedelta(days=65), "Monthly Salary Credit", "REF-SAL-03", "", "+22,500.00", "70,549.50"),
        (p_start + timedelta(days=74), "Annual Rent Installment Cheque", "CHQ-0042", "-24,000.00", "", "46,549.50"),
        (p_end - timedelta(days=4), "Airline Ticket Reservation", "FLY-SMP-11", "-3,500.00", "", "43,049.50"),
        (p_end, "Monthly Account Management Fee", "SYS-FEE-01", "-549.50", "", f"{data['closingBalance']:,.2f}"),
    ]
    
    # Adjust for Sana's low balance
    if data["closingBalance"] < 1000:
        tx_rows = [
            (p_start + timedelta(days=5), "Monthly Remittance Outward", "SWIFT-OUT-01", "-12,000.00", "", "1,850.00"),
            (p_start + timedelta(days=25), "Supermarket Spending", "POS-0012", "-420.00", "", "1,430.00"),
            (p_start + timedelta(days=45), "Emergency Medical Bill", "CLINIC-99", "-680.00", "", "750.00"),
            (p_end - timedelta(days=2), "Grocery Store Payment", "POS-4411", "-300.00", "", f"{data['closingBalance']:,.2f}"),
        ]
        
    cur_row_y = tbl_y + 50
    for r in tx_rows:
        draw.line([(50, cur_row_y + 35), (W - 51, cur_row_y + 35)], fill=(244, 244, 245), width=1)
        draw.text((70, cur_row_y + 8), str(r[0]), fill=(71, 85, 105), font=font("regular", 13))
        draw.text((210, cur_row_y + 8), str(r[1]), fill=(15, 23, 42), font=font("bold", 13))
        draw.text((620, cur_row_y + 8), str(r[2]), fill=(100, 116, 139), font=font("regular", 12))
        draw.text((800, cur_row_y + 8), str(r[3]), fill=(185, 28, 28) if r[3] else (0, 0, 0), font=font("regular", 13))
        draw.text((950, cur_row_y + 8), str(r[4]), fill=(21, 128, 61) if r[4] else (0, 0, 0), font=font("regular", 13))
        draw.text((1080, cur_row_y + 8), str(r[5]), fill=(15, 23, 42), font=font("bold", 13))
        cur_row_y += 42
        
    # Official Bank Seal Box
    seal_y = cur_row_y + 60
    draw.rectangle([70, seal_y, 450, seal_y + 110], outline=(148, 163, 184), width=1)
    draw.text((90, seal_y + 15), "OFFICIAL VERIFICATION EMBOSSMENT", fill=(100, 116, 139), font=font("bold", 11))
    draw.text((90, seal_y + 35), "SAMPLE INTERNATIONAL BANK • STAMPED", fill=(30, 41, 59), font=font("bold", 13))
    draw.text((90, seal_y + 55), f"VERIFIED ON: {data['periodEnd']} BY DIGITAL AUDIT", fill=(71, 85, 105), font=font("regular", 11))
    draw.text((90, seal_y + 75), "SIGNATURE: [AUTHORIZED OFFICER SPECIMEN]", fill=(100, 116, 139), font=font("regular", 11))
    
    return apply_watermark_and_footer(img)

def render_insurance(data: dict) -> Image.Image:
    """Renders a standard Schengen-compliant travel medical insurance certificate."""
    W, H = 1240, 1754
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([25, 25, W - 26, H - 26], outline=(228, 228, 231), width=1)
    
    # Header Band
    draw.rectangle([26, 26, W - 27, 130], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 80, 78, radius=32, label="SHIELD")
    
    draw.text((135, 46), "SAMPLE SHIELD TRAVEL ASSISTANCE", fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 78), "INTERNATIONAL MEDICAL & TRAVEL INSURANCE POLICY CERTIFICATE", fill=(161, 161, 170), font=font("bold", 14))
    
    draw.text((W - 320, 60), f"POLICY: POL-SMP-{abs(hash(data['holderName'])) % 1000000:06d}", fill=(255, 255, 255), font=font("bold", 15))
    
    # Policy Overview Box
    box_y = 160
    draw.rectangle([50, box_y, W - 51, box_y + 200], fill=(250, 250, 250), outline=(228, 228, 231), width=1)
    
    draw.text((80, box_y + 20), "INSURED PERSON / POLICY HOLDER:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((80, box_y + 40), data["holderName"].upper(), fill=(9, 9, 11), font=font("bold", 22))
    
    draw.text((80, box_y + 80), "POLICY COVERAGE AMOUNT:", fill=(113, 113, 122), font=font("regular", 12))
    cov_str = f"{data['coverageAmount']:,} {data['currency']} (MINIMUM SCHENGEN REQUIREMENT: 30,000 EUR)"
    draw.text((80, box_y + 100), cov_str, fill=(220, 38, 38) if data["coverageAmount"] < 30000 else (22, 101, 52), font=font("bold", 18))
    
    draw.text((80, box_y + 140), "VALIDITY PERIOD:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((80, box_y + 160), f"{data['startDate']}  to  {data['endDate']} (COVERS ENTIRE ITINERARY)", fill=(9, 9, 11), font=font("bold", 16))
    
    draw.text((640, box_y + 20), "COVERED GEOGRAPHIC REGION:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((640, box_y + 40), data["coveredRegions"].upper(), fill=(9, 9, 11), font=font("bold", 18))
    
    draw.text((640, box_y + 80), "DEDUCTIBLE / FRANCHISE:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((640, box_y + 100), "EUR 0.00 (NIL DEDUCTIBLE)", fill=(9, 9, 11), font=font("bold", 16))
    
    draw.text((640, box_y + 140), "STATUS:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((640, box_y + 160), "CONFIRMED & PREMIUM PAID IN FULL", fill=(21, 128, 61), font=font("bold", 16))
    
    # Detailed Benefits Table
    tbl_y = 390
    draw.text((50, tbl_y), "SCHEDULE OF EMERGENCY MEDICAL & REPATRIATION BENEFITS", fill=(15, 23, 42), font=font("bold", 16))
    
    benefits = [
        ("Emergency Medical Treatment & Hospitalization", f"{data['coverageAmount']:,} {data['currency']}", "Direct Billing Available"),
        ("Emergency Medical Repatriation & Evacuation", "INCLUDED IN FULL", "100% Covered"),
        ("Repatriation of Mortal Remains", "INCLUDED IN FULL", "100% Covered"),
        ("Emergency Dental Care (Pain Relief)", "500 EUR", "Covered"),
        ("COVID-19 & Pandemic Medical Expenses", f"{data['coverageAmount']:,} {data['currency']}", "Fully Included"),
        ("24/7 Worldwide Emergency Assistance Helpline", "UNLIMITED", "Toll-Free Support"),
    ]
    
    b_y = tbl_y + 35
    draw.rectangle([50, b_y, W - 51, b_y + 35], fill=(244, 244, 245))
    draw.text((70, b_y + 10), "BENEFIT DESCRIPTION", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((650, b_y + 10), "MAXIMUM LIMIT", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((950, b_y + 10), "NOTES", fill=(39, 39, 42), font=font("bold", 12))
    
    b_y += 45
    for b_title, b_limit, b_notes in benefits:
        draw.line([(50, b_y + 30), (W - 51, b_y + 30)], fill=(244, 244, 245), width=1)
        draw.text((70, b_y + 6), b_title, fill=(15, 23, 42), font=font("regular", 14))
        draw.text((650, b_y + 6), b_limit, fill=(15, 23, 42), font=font("bold", 14))
        draw.text((950, b_y + 6), b_notes, fill=(100, 116, 139), font=font("regular", 13))
        b_y += 38
        
    # Consular Compliance Declaration Box
    decl_y = b_y + 40
    draw.rectangle([50, decl_y, W - 51, decl_y + 110], fill=(248, 250, 252), outline=(203, 213, 225), width=1)
    draw.text((70, decl_y + 15), "CONSULAR DECLARATION PURSUANT TO REGULATION (EC) NO 810/2009 (VISA CODE):", fill=(71, 85, 105), font=font("bold", 11))
    
    decl_text = (
        "We hereby certify that this policy provides insurance coverage for any expenses which might arise in connection "
        "with repatriation for medical reasons, urgent medical attention, and/or emergency hospital treatment during the entire stay."
    )
    draw.text((70, decl_y + 38), decl_text, fill=(30, 41, 59), font=font("regular", 12))
    
    if data["coverageAmount"] < 30000:
        draw.text((70, decl_y + 75), "WARNING: COVERAGE IS DELIBERATELY BELOW SCHENGEN 30,000 EUR THRESHOLD FOR TESTING", fill=(185, 28, 28), font=font("bold", 13))
    else:
        draw.text((70, decl_y + 75), "COMPLIANCE STATUS: SATISFIES SCHENGEN VISA ARTICLE 15 MINIMUM REQUIREMENTS (30,000+ EUR)", fill=(21, 128, 61), font=font("bold", 13))
        
    return apply_watermark_and_footer(img)

def render_flight(data: dict) -> Image.Image:
    """Renders a standard airline e-ticket itinerary receipt."""
    W, H = 1240, 1754
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([25, 25, W - 26, H - 26], outline=(228, 228, 231), width=1)
    
    # Header Band
    draw.rectangle([26, 26, W - 27, 130], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 80, 78, radius=32, label="AIR")
    
    draw.text((135, 46), "SAMPLE AIRWAYS INTERNATIONAL", fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 78), "ELECTRONIC TICKET PASSENGER ITINERARY RECEIPT", fill=(161, 161, 170), font=font("bold", 14))
    
    pnr = f"SMP-{abs(hash(data['passengerName'])) % 90000 + 10000}"
    draw.text((W - 270, 60), f"BOOKING REF: {pnr}", fill=(255, 255, 255), font=font("bold", 16))
    
    # Passenger and Ticket Details
    box_y = 160
    draw.rectangle([50, box_y, W - 51, box_y + 130], fill=(250, 250, 250), outline=(228, 228, 231), width=1)
    
    draw.text((80, box_y + 18), "PASSENGER NAME:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((80, box_y + 36), data["passengerName"].upper(), fill=(9, 9, 11), font=font("bold", 20))
    
    draw.text((80, box_y + 75), "E-TICKET NUMBER:", fill=(113, 113, 122), font=font("regular", 12))
    tkt_no = f"000-2468{abs(hash(data['passengerName'])) % 1000000:06d}"
    draw.text((80, box_y + 93), tkt_no, fill=(9, 9, 11), font=font("bold", 16))
    
    draw.text((580, box_y + 18), "ROUTE / ITINERARY:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((580, box_y + 36), data["route"], fill=(9, 9, 11), font=font("bold", 20))
    
    draw.text((580, box_y + 75), "BOOKING STATUS:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((580, box_y + 93), "CONFIRMED / TICKET ISSUED", fill=(21, 128, 61), font=font("bold", 16))
    
    # Flights Segment Table
    tbl_y = 320
    draw.text((50, tbl_y), "FLIGHT SEGMENTS & SCHEDULE", fill=(15, 23, 42), font=font("bold", 16))
    
    f_y = tbl_y + 35
    draw.rectangle([50, f_y, W - 51, f_y + 35], fill=(244, 244, 245))
    draw.text((70, f_y + 10), "FLIGHT", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((180, f_y + 10), "DEPARTURE", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((450, f_y + 10), "ARRIVAL", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((730, f_y + 10), "DATE", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((920, f_y + 10), "CLASS / SEAT", fill=(39, 39, 42), font=font("bold", 12))
    draw.text((1080, f_y + 10), "STATUS", fill=(39, 39, 42), font=font("bold", 12))
    
    # Outbound flight
    f_y += 45
    draw.line([(50, f_y + 50), (W - 51, f_y + 50)], fill=(244, 244, 245), width=1)
    draw.text((70, f_y + 8), "SA-101", fill=(15, 23, 42), font=font("bold", 16))
    draw.text((70, f_y + 28), "SampleAir", fill=(100, 116, 139), font=font("regular", 12))
    
    dep_city = data["route"].split("->")[0].strip() if "->" in data["route"] else "DXB"
    arr_city = data["route"].split("->")[1].strip() if "->" in data["route"] else "CDG"
    
    draw.text((180, f_y + 8), f"{dep_city} - 08:30", fill=(15, 23, 42), font=font("bold", 15))
    draw.text((180, f_y + 28), "Terminal 3", fill=(100, 116, 139), font=font("regular", 12))
    
    draw.text((450, f_y + 8), f"{arr_city} - 13:15", fill=(15, 23, 42), font=font("bold", 15))
    draw.text((450, f_y + 28), "Terminal 2E", fill=(100, 116, 139), font=font("regular", 12))
    
    draw.text((730, f_y + 14), data["departureDate"], fill=(15, 23, 42), font=font("bold", 15))
    draw.text((920, f_y + 14), "Economy / 14A", fill=(15, 23, 42), font=font("regular", 14))
    draw.text((1080, f_y + 14), "OK", fill=(21, 128, 61), font=font("bold", 15))
    
    # Inbound return flight
    f_y += 65
    draw.line([(50, f_y + 50), (W - 51, f_y + 50)], fill=(244, 244, 245), width=1)
    draw.text((70, f_y + 8), "SA-102", fill=(15, 23, 42), font=font("bold", 16))
    draw.text((70, f_y + 28), "SampleAir", fill=(100, 116, 139), font=font("regular", 12))
    
    draw.text((180, f_y + 8), f"{arr_city} - 15:45", fill=(15, 23, 42), font=font("bold", 15))
    draw.text((180, f_y + 28), "Terminal 2E", fill=(100, 116, 139), font=font("regular", 12))
    
    draw.text((450, f_y + 8), f"{dep_city} - 00:10 (+1)", fill=(15, 23, 42), font=font("bold", 15))
    draw.text((450, f_y + 28), "Terminal 3", fill=(100, 116, 139), font=font("regular", 12))
    
    draw.text((730, f_y + 14), data["returnDate"], fill=(15, 23, 42), font=font("bold", 15))
    draw.text((920, f_y + 14), "Economy / 14A", fill=(15, 23, 42), font=font("regular", 14))
    draw.text((1080, f_y + 14), "OK", fill=(21, 128, 61), font=font("bold", 15))
    
    # Fake linear barcode for e-ticket
    draw_fake_barcode(draw, 50, f_y + 90, 480, 80, f"{pnr}-{tkt_no[:10]}")
    
    return apply_watermark_and_footer(img)

def render_hotel(data: dict) -> Image.Image:
    """Renders a standard hotel booking voucher confirmation."""
    W, H = 1240, 1754
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([25, 25, W - 26, H - 26], outline=(228, 228, 231), width=1)
    
    # Header Band
    draw.rectangle([26, 26, W - 27, 130], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 80, 78, radius=32, label="HOTEL")
    
    draw.text((135, 46), "SAMPLE STAY RESERVATIONS", fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 78), "HOTEL BOOKING CONFIRMATION & ACCOMMODATION VOUCHER", fill=(161, 161, 170), font=font("bold", 14))
    
    htl_code = f"HTL-SMP-{abs(hash(data['guestName'])) % 90000 + 10000}"
    draw.text((W - 320, 60), f"CONFIRMATION: {htl_code}", fill=(255, 255, 255), font=font("bold", 16))
    
    # Guest and Hotel Details Box
    box_y = 160
    draw.rectangle([50, box_y, W - 51, box_y + 220], fill=(250, 250, 250), outline=(228, 228, 231), width=1)
    
    draw.text((80, box_y + 20), "PRIMARY GUEST NAME:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((80, box_y + 40), data["guestName"].upper(), fill=(9, 9, 11), font=font("bold", 22))
    
    hotel_name = f"Sample Grand Hotel {data['city']}"
    draw.text((80, box_y + 85), "HOTEL PROPERTY & LOCATION:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((80, box_y + 105), f"{hotel_name}, {data['city']}", fill=(9, 9, 11), font=font("bold", 18))
    draw.text((80, box_y + 130), f"Address: 12 Avenue Fictitious, {data['city']} (Central District)", fill=(100, 116, 139), font=font("regular", 13))
    
    # Dates
    draw.text((650, box_y + 20), "CHECK-IN DATE:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((650, box_y + 40), f"{data['checkIn']} (from 14:00)", fill=(9, 9, 11), font=font("bold", 18))
    
    draw.text((650, box_y + 85), "CHECK-OUT DATE:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((650, box_y + 105), f"{data['checkOut']} (until 11:00)", fill=(9, 9, 11), font=font("bold", 18))
    
    # Calculate nights
    cin = datetime.strptime(data["checkIn"], "%Y-%m-%d").date()
    cout = datetime.strptime(data["checkOut"], "%Y-%m-%d").date()
    nights = (cout - cin).days
    
    draw.text((650, box_y + 150), "DURATION OF STAY:", fill=(113, 113, 122), font=font("regular", 12))
    draw.text((650, box_y + 170), f"{nights} NIGHTS TOTAL", fill=(9, 9, 11), font=font("bold", 16))
    
    # Room and Payment Breakdown
    sec_y = 410
    draw.text((50, sec_y), "ROOM SPECIFICATIONS & PAYMENT RECORD", fill=(15, 23, 42), font=font("bold", 16))
    
    tbl_y = sec_y + 35
    draw.rectangle([50, tbl_y, W - 51, tbl_y + 160], outline=(228, 228, 231), width=1)
    
    draw.text((80, tbl_y + 20), "Room Type: Deluxe Double Room - Non-Smoking", fill=(15, 23, 42), font=font("bold", 14))
    draw.text((80, tbl_y + 50), "Meal Plan: Daily Continental Breakfast Included", fill=(100, 116, 139), font=font("regular", 13))
    draw.text((80, tbl_y + 80), "Cancellation Policy: Non-refundable visa guarantee rate", fill=(100, 116, 139), font=font("regular", 13))
    draw.text((80, tbl_y + 115), "Payment Status: PREPAID IN FULL • PROOF OF ACCOMMODATION", fill=(21, 128, 61), font=font("bold", 15))
    
    draw_fake_barcode(draw, 50, tbl_y + 190, 420, 75, f"VOUCHER-{htl_code}")
    
    return apply_watermark_and_footer(img)

def render_employment_letter(data: dict) -> Image.Image:
    """Renders a standard employer No-Objection Certificate (NOC) / Leave Approval letter."""
    W, H = 1240, 1754
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([25, 25, W - 26, H - 26], outline=(228, 228, 231), width=1)
    
    # Corporate Letterhead
    draw.rectangle([26, 26, W - 27, 130], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 80, 78, radius=32, label="CORP")
    
    draw.text((135, 46), data["employer"].upper(), fill=(255, 255, 255), font=font("bold", 22))
    draw.text((135, 78), "CORPORATE HUMAN RESOURCES & TALENT MANAGEMENT DIVISION", fill=(161, 161, 170), font=font("bold", 14))
    
    draw.text((W - 270, 60), f"DATE: {data['issueDate']}", fill=(255, 255, 255), font=font("bold", 15))
    
    # Formal Letter recipient
    cur_y = 175
    draw.text((70, cur_y), "TO: The Visa Officer / Consular Authority", fill=(15, 23, 42), font=font("bold", 16))
    draw.text((70, cur_y + 24), "Embassy / Consulate General of the Destination State", fill=(100, 116, 139), font=font("regular", 14))
    draw.text((70, cur_y + 44), "Dubai, United Arab Emirates", fill=(100, 116, 139), font=font("regular", 14))
    
    cur_y += 95
    draw.text((70, cur_y), "SUBJECT: EMPLOYMENT VERIFICATION AND ANNUAL LEAVE APPROVAL (NOC)", fill=(15, 23, 42), font=font("bold", 16))
    draw.line([(70, cur_y + 26), (920, cur_y + 26)], fill=(15, 23, 42), width=1)
    
    cur_y += 50
    paragraphs = [
        f"Dear Visa Officer,",
        f"This letter is to confirm that {data['employeeName'].upper()} is employed on a full-time, permanent basis with {data['employer']} in the position of {data['position']}.",
        f"The employee commenced employment with our organization on 15 March 2021 and currently draws a monthly gross remuneration of AED 22,500.",
        f"We have officially sanctioned approved annual leave for {data['employeeName'].upper()} from {data['leaveStart']} to {data['leaveEnd']} to undertake personal tourism travel.",
        f"We confirm that {data['employeeName']} will resume their professional duties at our Dubai headquarters immediately following their return on {data['leaveEnd']}.",
        f"Should you require any additional information or verification regarding this application, please feel free to contact our Human Resources department.",
    ]
    
    for p in paragraphs:
        # Wrap long text cleanly
        words = p.split(" ")
        lines = []
        cur_line = ""
        for w in words:
            if len(cur_line + " " + w) > 85:
                lines.append(cur_line)
                cur_line = w
            else:
                cur_line = (cur_line + " " + w).strip()
        if cur_line:
            lines.append(cur_line)
            
        for line in lines:
            draw.text((70, cur_y), line, fill=(30, 41, 59), font=font("regular", 15))
            cur_y += 26
        cur_y += 18
        
    # Signatory Box
    cur_y += 30
    draw.text((70, cur_y), "Sincerely,", fill=(15, 23, 42), font=font("regular", 15))
    cur_y += 35
    draw.text((70, cur_y), "[AUTHORIZED DIGITAL SIGNATURE]", fill=(100, 116, 139), font=font("mono_bold", 14))
    cur_y += 30
    draw.text((70, cur_y), "Director of Human Resources", fill=(15, 23, 42), font=font("bold", 15))
    draw.text((70, cur_y + 22), f"{data['employer']} • Dubai Head Office", fill=(100, 116, 139), font=font("regular", 14))
    
    # Official Company Stamp Box
    stamp_y = cur_y - 20
    draw.rectangle([780, stamp_y, 1140, stamp_y + 120], outline=(148, 163, 184), width=1)
    draw.text((800, stamp_y + 15), "CORPORATE SEAL", fill=(100, 116, 139), font=font("bold", 11))
    draw.text((800, stamp_y + 40), f"{data['employer']}", fill=(30, 41, 59), font=font("bold", 13))
    draw.text((800, stamp_y + 65), "AUTHENTICATED HR VERIFICATION", fill=(21, 128, 61), font=font("regular", 11))
    draw.text((800, stamp_y + 88), f"REF: NOC-SMP-{abs(hash(data['employeeName'])) % 100000:05d}", fill=(100, 116, 139), font=font("regular", 11))
    
    return apply_watermark_and_footer(img)

def render_photo(data: dict) -> Image.Image:
    """Renders a standard compliant 35x45mm biometric silhouette photo."""
    W, H = 600, 750
    img = Image.new("RGBA", (W, H), (241, 245, 249, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer photo border
    draw.rectangle([0, 0, W - 1, H - 1], outline=(203, 213, 225), width=4)
    
    # Silhouette (clean vector geometry)
    head_cx = W // 2
    head_cy = int(H * 0.38)
    head_w = int(W * 0.44)
    head_h = int(H * 0.42)
    
    # Torso
    draw.pieslice([int(W * 0.12), int(H * 0.58), int(W * 0.88), int(H * 1.25)], 180, 360, fill=(148, 163, 184))
    # Head
    draw.ellipse([head_cx - head_w // 2, head_cy - head_h // 2, head_cx + head_w // 2, head_cy + head_h // 2], fill=(148, 163, 184))
    
    # Top and Bottom Specimen Badges
    draw.rectangle([0, 0, W, 40], fill=(30, 41, 59))
    draw.text((25, 10), "SAMPLE BIOMETRIC SPECIMEN • 35 x 45 mm", fill=(255, 255, 255), font=font("bold", 14))
    
    draw.rectangle([0, H - 45, W, H], fill=(226, 232, 240))
    draw.text((25, H - 32), "NEUTRAL SILHOUETTE • NO REAL OR AI FACES", fill=(71, 85, 105), font=font("bold", 13))
    
    return apply_watermark_and_footer(img)

# -----------------------------------------------------------------------------
# Contact Sheet Generator (public/samples/overview.png)
# -----------------------------------------------------------------------------

def generate_contact_sheet(travelers_docs: list, output_path: str):
    """
    Creates an executive overview contact-sheet image showing thumbnails
    of all generated sample documents across the 4 travelers.
    """
    thumb_w, thumb_h = 240, 320
    cols = 9  # Up to 9 document thumbnails per row
    rows = len(travelers_docs)
    
    row_header_h = 55
    sheet_w = 260 + (thumb_w + 20) * cols + 40
    sheet_h = 160 + (thumb_h + row_header_h + 30) * rows
    
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (250, 250, 250, 255))
    draw = ImageDraw.Draw(sheet)
    
    # Main Header
    draw.rectangle([0, 0, sheet_w, 110], fill=(24, 24, 27))
    draw_placeholder_crest(draw, 65, 55, radius=32, label="ALL")
    draw.text((120, 28), "VISAVAULT FICTIONAL SAMPLE DOCUMENTS • 4 TRAVELERS OVERVIEW", fill=(255, 255, 255), font=font("bold", 24))
    draw.text((120, 64), "Visual contact sheet of generated test credentials • Hackathon demo scenarios", fill=(161, 161, 170), font=font("bold", 14))
    
    cur_y = 140
    for t in travelers_docs:
        # Traveler Row Header
        draw.rectangle([30, cur_y, sheet_w - 30, cur_y + row_header_h], fill=(244, 244, 245), outline=(228, 228, 231), width=1)
        draw.text((45, cur_y + 14), f"TRAVELER: {t['name'].upper()} ({t['slug']})", fill=(9, 9, 11), font=font("bold", 17))
        draw.text((420, cur_y + 16), f"SCENARIO: {t['scenario']}", fill=(82, 82, 91), font=font("bold", 13))
        
        # Outcome badge
        outcome_color = (22, 101, 52) if "READY" in t["expectedOutcome"] else ((185, 28, 28) if "BLOCKED" in t["expectedOutcome"] or "ACTION" in t["expectedOutcome"] else (194, 65, 12))
        draw.text((sheet_w - 580, cur_y + 16), f"OUTCOME: {t['expectedOutcome'][:48]}...", fill=outcome_color, font=font("bold", 13))
        
        doc_x = 45
        doc_y = cur_y + row_header_h + 15
        
        for doc in t["docs"]:
            # Load and thumbnail image
            try:
                img_path = doc["absPath"]
                if img_path.lower().endswith(".pdf"):
                    # Render PDF page preview using PIL if possible, or use fallback
                    # In our pipeline we cache or render the source PIL image
                    thumb_img = doc["img"].copy()
                else:
                    thumb_img = Image.open(img_path)
                    
                thumb_img.thumbnail((thumb_w, thumb_h), Image.BICUBIC)
                
                # Card frame
                draw.rectangle([doc_x - 4, doc_y - 4, doc_x + thumb_w + 4, doc_y + thumb_h + 36], fill=(255, 255, 255), outline=(203, 213, 225), width=1)
                
                # Center thumbnail inside box
                tw, th = thumb_img.size
                tx = doc_x + (thumb_w - tw) // 2
                ty = doc_y + (thumb_h - th) // 2
                sheet.paste(thumb_img.convert("RGBA"), (tx, ty))
                
                # Label below thumbnail
                l_font = font("bold", 11)
                label = f"{doc['fileName']}"
                draw.rectangle([doc_x - 3, doc_y + thumb_h, doc_x + thumb_w + 3, doc_y + thumb_h + 34], fill=(241, 245, 249))
                draw.text((doc_x + 6, doc_y + thumb_h + 8), label, fill=(15, 23, 42), font=l_font)
                
            except Exception as e:
                # Placeholder box if load failed
                draw.rectangle([doc_x, doc_y, doc_x + thumb_w, doc_y + thumb_h], fill=(241, 245, 249), outline=(203, 213, 225))
                draw.text((doc_x + 10, doc_y + 50), f"Preview N/A\n{doc['fileName']}", fill=(100, 116, 139), font=font("regular", 12))
                
            doc_x += thumb_w + 22
            
        cur_y += row_header_h + thumb_h + 60
        
    sheet.convert("RGB").save(output_path, "PNG")

# -----------------------------------------------------------------------------
# Main Generation Orchestrator
# -----------------------------------------------------------------------------

def build_traveler_data(base_date_str: str):
    """
    Computes all dates and document data for the 4 travelers based on BASE_DATE.
    """
    b_date = datetime.strptime(base_date_str, "%Y-%m-%d").date()
    
    # -------------------------------------------------------------------------
    # 1. Aarav Example (Scenario: visa fully covers trip, "good to go")
    # -------------------------------------------------------------------------
    t1_passport = {
        "fullName": "Aarav Example",
        "passportNumber": "XX0000101",
        "nationality": "Sampleland",
        "dateOfBirth": "1988-04-15",
        "issueDate": (b_date.replace(year=b_date.year - 3)).isoformat(),
        "expiryDate": (b_date.replace(year=b_date.year + 6)).isoformat(),
        "issuingCountry": "Sampleland"
    }
    t1_visa = {
        "holderName": "Aarav Example",
        "passportNumber": "XX0000101",
        "country": "France",
        "region": "Schengen",
        "visaType": "C - TOURIST (SHORT STAY)",
        "entries": "MULT",
        "validFrom": (b_date - timedelta(days=60)).isoformat(),
        "validUntil": (b_date + timedelta(days=300)).isoformat(),
        "maxStayDays": 90,
        "referenceNumber": "VS99000101"
    }
    t1_permit = {
        "holderName": "Aarav Example",
        "idNumber": "784-1988-0000101-1",
        "issuingCountry": "United Arab Emirates",
        "expiryDate": (b_date + timedelta(days=426)).isoformat(), # ~14 months
        "sponsorOrEmployer": "Sample Global Tech LLC"
    }
    t1_trip_start = (b_date + timedelta(days=30)).isoformat()
    t1_trip_end = (b_date + timedelta(days=40)).isoformat()
    t1_flight = {
        "passengerName": "Aarav Example",
        "departureDate": t1_trip_start,
        "returnDate": t1_trip_end,
        "route": "DXB -> CDG -> DXB"
    }
    t1_hotel = {
        "guestName": "Aarav Example",
        "checkIn": t1_trip_start,
        "checkOut": t1_trip_end,
        "city": "Paris"
    }
    t1_insurance = {
        "holderName": "Aarav Example",
        "coverageAmount": 50000,
        "currency": "EUR",
        "startDate": t1_trip_start,
        "endDate": t1_trip_end,
        "coveredRegions": "Schengen States"
    }
    t1_bank = {
        "accountHolderName": "Aarav Example",
        "periodStart": (b_date - timedelta(days=97)).isoformat(),
        "periodEnd": (b_date - timedelta(days=7)).isoformat(),
        "closingBalance": 42500.00,
        "currency": "AED"
    }
    t1_employment = {
        "employeeName": "Aarav Example",
        "employer": "Sample Global Tech LLC",
        "position": "Senior Software Architect",
        "issueDate": (b_date - timedelta(days=10)).isoformat(),
        "leaveStart": t1_trip_start,
        "leaveEnd": t1_trip_end
    }
    t1_photo = {
        "qualityNotes": "Compliant neutral silhouette, standard 35x45mm format, light plain background"
    }
    
    # -------------------------------------------------------------------------
    # 2. Meera Sample (Scenario: visa valid but problems, "partially covered")
    # -------------------------------------------------------------------------
    t2_passport_exp = (b_date + timedelta(days=75)).isoformat()
    t2_passport = {
        "fullName": "Meera Sample",
        "passportNumber": "XX0000202",
        "nationality": "Sampleland",
        "dateOfBirth": "1992-08-22",
        "issueDate": (b_date.replace(year=b_date.year - 9) - timedelta(days=290)).isoformat(),
        "expiryDate": t2_passport_exp,
        "issuingCountry": "Sampleland"
    }
    t2_visa = {
        "holderName": "Meera Sample",
        "passportNumber": "XX0000202",
        "country": "Germany",
        "region": "Schengen",
        "visaType": "C - TOURIST (SHORT STAY)",
        "entries": "MULT",
        "validFrom": (b_date - timedelta(days=100)).isoformat(),
        "validUntil": (b_date + timedelta(days=200)).isoformat(),
        "maxStayDays": 90,
        "referenceNumber": "VS99000202"
    }
    t2_permit = {
        "holderName": "Meera Sample",
        "idNumber": "784-1992-0000202-3",
        "issuingCountry": "United Arab Emirates",
        "expiryDate": (b_date + timedelta(days=304)).isoformat(), # ~10 months
        "sponsorOrEmployer": "Sample Retail Horizons FZCO"
    }
    t2_trip_start = (b_date + timedelta(days=20)).isoformat()
    t2_trip_end = (b_date + timedelta(days=40)).isoformat()
    t2_flight = {
        "passengerName": "Meera Sample",
        "departureDate": t2_trip_start,
        "returnDate": t2_trip_end,
        "route": "DXB -> FRA -> DXB"
    }
    t2_hotel = {
        "guestName": "Meera Sample",
        "checkIn": t2_trip_start,
        "checkOut": t2_trip_end,
        "city": "Frankfurt"
    }
    t2_insurance = {
        "holderName": "Meera Sample",
        "coverageAmount": 40000,
        "currency": "EUR",
        "startDate": t2_trip_start,
        "endDate": t2_trip_end,
        "coveredRegions": "Schengen States"
    }
    t2_bank = {
        "accountHolderName": "Meera Sample",
        "periodStart": (b_date - timedelta(days=95)).isoformat(),
        "periodEnd": (b_date - timedelta(days=5)).isoformat(),
        "closingBalance": 31800.00,
        "currency": "AED"
    }
    t2_employment = {
        "employeeName": "Meera Sample",
        "employer": "Sample Retail Horizons FZCO",
        "position": "Marketing Lead",
        "issueDate": (b_date - timedelta(days=12)).isoformat(),
        "leaveStart": t2_trip_start,
        "leaveEnd": t2_trip_end
    }
    t2_photo = {
        "qualityNotes": "Compliant neutral silhouette, standard 35x45mm format, light plain background"
    }
    
    # -------------------------------------------------------------------------
    # 3. Rohan Demo (Scenario: no visa, missing documents, new application)
    # -------------------------------------------------------------------------
    t3_passport = {
        "fullName": "Rohan Demo",
        "passportNumber": "XX0000303",
        "nationality": "Sampleland",
        "dateOfBirth": "1995-11-04",
        "issueDate": (b_date.replace(year=b_date.year - 2)).isoformat(),
        "expiryDate": (b_date.replace(year=b_date.year + 8)).isoformat(),
        "issuingCountry": "Sampleland"
    }
    t3_permit = {
        "holderName": "Rohan Demo",
        "idNumber": "784-1995-0000303-7",
        "issuingCountry": "United Arab Emirates",
        "expiryDate": (b_date + timedelta(days=548)).isoformat(), # ~18 months
        "sponsorOrEmployer": "Demo Creative Media LLC"
    }
    t3_trip_start = (b_date + timedelta(days=45)).isoformat()
    t3_trip_end = (b_date + timedelta(days=55)).isoformat()
    t3_flight = {
        "passengerName": "Rohan Demo",
        "departureDate": t3_trip_start,
        "returnDate": t3_trip_end,
        "route": "DXB -> AMS -> DXB"
    }
    t3_hotel = {
        "guestName": "Rohan Demo",
        "checkIn": t3_trip_start,
        "checkOut": t3_trip_end,
        "city": "Amsterdam"
    }
    t3_bank = {
        "accountHolderName": "Rohan Demo",
        "periodStart": (b_date - timedelta(days=145)).isoformat(),
        "periodEnd": (b_date - timedelta(days=55)).isoformat(), # DELIBERATELY TOO OLD
        "closingBalance": 18500.00,
        "currency": "AED"
    }
    t3_photo = {
        "qualityNotes": "Compliant neutral silhouette, standard 35x45mm format, light plain background"
    }
    
    # -------------------------------------------------------------------------
    # 4. Sana Testcase (Scenario: inconsistency problems)
    # -------------------------------------------------------------------------
    t4_passport = {
        "fullName": "Sana Testcase",
        "passportNumber": "XX0000404",
        "nationality": "Sampleland",
        "dateOfBirth": "1997-03-19",
        "issueDate": (b_date.replace(year=b_date.year - 1)).isoformat(),
        "expiryDate": (b_date.replace(year=b_date.year + 4)).isoformat(),
        "issuingCountry": "Sampleland"
    }
    t4_permit = {
        "holderName": "Sana Testcase",
        "idNumber": "784-1997-0000404-5",
        "issuingCountry": "United Arab Emirates",
        "expiryDate": (b_date + timedelta(days=365)).isoformat(),
        "sponsorOrEmployer": "Testcase Logistics Corp"
    }
    t4_trip_start = (b_date + timedelta(days=35)).isoformat()
    t4_trip_end = (b_date + timedelta(days=47)).isoformat()
    t4_flight = {
        "passengerName": "Sana Testcase",
        "departureDate": t4_trip_start,
        "returnDate": t4_trip_end,
        "route": "DXB -> FCO -> DXB"
    }
    # Deliberate mismatches for Sana:
    # 1. Name spelling mismatch on hotel: SANNA TEST-CASE
    # 2. Hotel check-out BASE+44d, while flight departs BASE+47d (missing 3 nights!)
    t4_hotel = {
        "guestName": "Sanna Test-Case", # SPELLING MISMATCH
        "checkIn": t4_trip_start,
        "checkOut": (b_date + timedelta(days=44)).isoformat(), # SHORTER THAN FLIGHT!
        "city": "Rome"
    }
    # 3. Insurance coverage EUR 20,000 (below 30,000 EUR requirement)
    t4_insurance = {
        "holderName": "Sana Testcase",
        "coverageAmount": 20000, # DELIBERATELY BELOW SCHENGEN 30k
        "currency": "EUR",
        "startDate": t4_trip_start,
        "endDate": t4_trip_end,
        "coveredRegions": "Schengen States"
    }
    # 4. Low bank balance (450 AED)
    t4_bank = {
        "accountHolderName": "Sana Testcase",
        "periodStart": (b_date - timedelta(days=93)).isoformat(),
        "periodEnd": (b_date - timedelta(days=3)).isoformat(),
        "closingBalance": 450.00, # LOW BALANCE
        "currency": "AED"
    }
    t4_employment = {
        "employeeName": "Sana Testcase",
        "employer": "Testcase Logistics Corp",
        "position": "Operations Analyst",
        "issueDate": (b_date - timedelta(days=8)).isoformat(),
        "leaveStart": t4_trip_start,
        "leaveEnd": t4_trip_end
    }
    t4_photo = {
        "qualityNotes": "Compliant neutral silhouette, standard 35x45mm format, light plain background"
    }
    
    travelers = [
        {
            "slug": "aarav-example",
            "name": "Aarav Example",
            "scenario": "Visa fully covers the trip (good to go)",
            "expectedOutcome": "READY: Existing Schengen multiple-entry visa fully covers trip dates (stay 10 days; 12 prior + 10 = 22/90 days used; passport & insurance valid; all documents verified).",
            "plannedTrip": {
                "destination": "France (Schengen)",
                "startDate": t1_trip_start,
                "endDate": t1_trip_end
            },
            "travelRecords": [
                {
                    "country": "France",
                    "entryDate": (b_date - timedelta(days=90)).isoformat(),
                    "exitDate": (b_date - timedelta(days=78)).isoformat(),
                    "days": 12
                }
            ],
            "doc_specs": [
                {"type": "PASSPORT", "file": "passport.pdf", "render": render_passport, "data": t1_passport},
                {"type": "VISA", "file": "visa.pdf", "render": render_visa, "data": t1_visa},
                {"type": "RESIDENCE_PERMIT", "file": "residence-permit.png", "render": render_residence_permit, "data": t1_permit},
                {"type": "BANK_STATEMENT", "file": "bank-statement.pdf", "render": render_bank_statement, "data": t1_bank},
                {"type": "INSURANCE", "file": "insurance.pdf", "render": render_insurance, "data": t1_insurance},
                {"type": "FLIGHT_BOOKING", "file": "flight.pdf", "render": render_flight, "data": t1_flight},
                {"type": "HOTEL_BOOKING", "file": "hotel.pdf", "render": render_hotel, "data": t1_hotel},
                {"type": "EMPLOYMENT_LETTER", "file": "employment-letter.pdf", "render": render_employment_letter, "data": t1_employment},
                {"type": "PHOTO", "file": "photo.png", "render": render_photo, "data": t1_photo},
            ]
        },
        {
            "slug": "meera-sample",
            "name": "Meera Sample",
            "scenario": "Visa valid but problems (partially covered)",
            "expectedOutcome": "PARTIAL / BLOCKED: Passport expires too soon (expires in 75 days, less than 3 months beyond trip return date); Schengen 90/180 stay limit exceeded (78 past days + 20 planned days = 98 days in 180-day window).",
            "plannedTrip": {
                "destination": "Germany (Schengen)",
                "startDate": t2_trip_start,
                "endDate": t2_trip_end
            },
            "travelRecords": [
                {
                    "country": "Germany",
                    "entryDate": (b_date - timedelta(days=90)).isoformat(),
                    "exitDate": (b_date - timedelta(days=12)).isoformat(),
                    "days": 78
                }
            ],
            "doc_specs": [
                {"type": "PASSPORT", "file": "passport.png", "render": render_passport, "data": t2_passport, "scan_effect": True, "scan_angle": 1.2},
                {"type": "VISA", "file": "visa.pdf", "render": render_visa, "data": t2_visa},
                {"type": "RESIDENCE_PERMIT", "file": "residence-permit.pdf", "render": render_residence_permit, "data": t2_permit},
                {"type": "BANK_STATEMENT", "file": "bank-statement.pdf", "render": render_bank_statement, "data": t2_bank},
                {"type": "INSURANCE", "file": "insurance.pdf", "render": render_insurance, "data": t2_insurance},
                {"type": "FLIGHT_BOOKING", "file": "flight.pdf", "render": render_flight, "data": t2_flight},
                {"type": "HOTEL_BOOKING", "file": "hotel.pdf", "render": render_hotel, "data": t2_hotel},
                {"type": "EMPLOYMENT_LETTER", "file": "employment-letter.pdf", "render": render_employment_letter, "data": t2_employment},
                {"type": "PHOTO", "file": "photo.png", "render": render_photo, "data": t2_photo},
            ]
        },
        {
            "slug": "rohan-demo",
            "name": "Rohan Demo",
            "scenario": "No visa, missing documents, new application",
            "expectedOutcome": "NEW APPLICATION REQUIRED: No valid Schengen visa found. Missing mandatory travel insurance policy. Missing employer leave letter. Stale bank statement (ending 55 days ago; exceeds 30-day freshness rule).",
            "plannedTrip": {
                "destination": "Netherlands (Schengen)",
                "startDate": t3_trip_start,
                "endDate": t3_trip_end
            },
            "travelRecords": [],
            "doc_specs": [
                {"type": "PASSPORT", "file": "passport.pdf", "render": render_passport, "data": t3_passport},
                {"type": "RESIDENCE_PERMIT", "file": "residence-permit.png", "render": render_residence_permit, "data": t3_permit},
                {"type": "BANK_STATEMENT", "file": "bank-statement.pdf", "render": render_bank_statement, "data": t3_bank},
                {"type": "FLIGHT_BOOKING", "file": "flight.pdf", "render": render_flight, "data": t3_flight},
                {"type": "HOTEL_BOOKING", "file": "hotel.pdf", "render": render_hotel, "data": t3_hotel},
                {"type": "PHOTO", "file": "photo.png", "render": render_photo, "data": t3_photo},
                # Deliberately missing: VISA, INSURANCE, EMPLOYMENT_LETTER
            ]
        },
        {
            "slug": "sana-testcase",
            "name": "Sana Testcase",
            "scenario": "Inconsistency problems",
            "expectedOutcome": "ACTION REQUIRED / CRITICAL INCONSISTENCIES: Name mismatch on hotel voucher ('SANNA TEST-CASE' vs passport 'SANA TESTCASE'); Hotel booking does not cover full stay (check-out 2026-11-24 vs flight return 2026-11-27, missing 3 nights); Travel insurance coverage EUR 20,000 is below EUR 30,000 Schengen minimum requirement; Bank statement balance indicates insufficient subsistence funds.",
            "plannedTrip": {
                "destination": "Italy (Schengen)",
                "startDate": t4_trip_start,
                "endDate": t4_trip_end
            },
            "travelRecords": [],
            "doc_specs": [
                {"type": "PASSPORT", "file": "passport.pdf", "render": render_passport, "data": t4_passport},
                {"type": "RESIDENCE_PERMIT", "file": "residence-permit.pdf", "render": render_residence_permit, "data": t4_permit},
                {"type": "BANK_STATEMENT", "file": "bank-statement.pdf", "render": render_bank_statement, "data": t4_bank},
                {"type": "FLIGHT_BOOKING", "file": "flight.pdf", "render": render_flight, "data": t4_flight},
                {"type": "HOTEL_BOOKING", "file": "hotel.png", "render": render_hotel, "data": t4_hotel, "scan_effect": True, "scan_angle": -1.4},
                {"type": "INSURANCE", "file": "insurance.pdf", "render": render_insurance, "data": t4_insurance},
                {"type": "EMPLOYMENT_LETTER", "file": "employment-letter.pdf", "render": render_employment_letter, "data": t4_employment},
                {"type": "PHOTO", "file": "photo.png", "render": render_photo, "data": t4_photo},
                # Deliberately missing: VISA
            ]
        }
    ]
    
    return travelers

def generate_samples(base_date_str: str, output_base: str):
    """
    Main entry point: renders all documents, applies watermarks/effects, saves PDFs/PNGs,
    and writes public/samples/manifest.json, public/samples/README.md, and public/samples/overview.png.
    """
    print(f"============================================================")
    print(f"VisaVault Sample Document Generator")
    print(f"BASE_DATE: {base_date_str}")
    print(f"Output Directory: {output_base}")
    print(f"============================================================")
    
    os.makedirs(output_base, exist_ok=True)
    travelers_meta = build_traveler_data(base_date_str)
    
    all_manifest_docs = []
    travelers_for_overview = []
    
    for t in travelers_meta:
        person_dir = os.path.join(output_base, t["slug"])
        os.makedirs(person_dir, exist_ok=True)
        print(f"\n[+] Processing traveler: {t['name']} ({t['slug']})")
        
        t_overview_docs = []
        
        for spec in t["doc_specs"]:
            file_name = spec["file"]
            file_path = os.path.join(person_dir, file_name)
            rel_path = f"samples/{t['slug']}/{file_name}"
            
            # Render base image with watermark
            img = spec["render"](spec["data"])
            
            # Apply phone scan effect if requested
            if spec.get("scan_effect"):
                print(f"    - Applying phone scan effect to {file_name} (angle: {spec.get('scan_angle')} deg)")
                img = apply_phone_scan_effect(img, angle_deg=spec.get("scan_angle", 1.2), noise_level=6)
                # Re-apply watermark on top if needed or watermark is already preserved
                img = apply_watermark_and_footer(img)
                
            # Save file according to extension
            if file_name.lower().endswith(".pdf"):
                # Save as high-quality PDF
                img.convert("RGB").save(file_path, "PDF", resolution=150.0)
            elif file_name.lower().endswith(".png"):
                img.save(file_path, "PNG")
            elif file_name.lower().endswith(".jpg") or file_name.lower().endswith(".jpeg"):
                img.convert("RGB").save(file_path, "JPEG", quality=95)
                
            print(f"    [OK] Generated {file_name} ({os.path.getsize(file_path):,} bytes)")
            
            # Prepare manifest record
            manifest_doc = {
                "person": t["name"],
                "personSlug": t["slug"],
                "filePath": rel_path,
                "fileName": file_name,
                "documentType": spec["type"],
                "extracted": spec["data"]
            }
            all_manifest_docs.append(manifest_doc)
            
            t_overview_docs.append({
                "fileName": file_name,
                "absPath": file_path,
                "img": img
            })
            
        travelers_for_overview.append({
            "name": t["name"],
            "slug": t["slug"],
            "scenario": t["scenario"],
            "expectedOutcome": t["expectedOutcome"],
            "docs": t_overview_docs
        })
        
    # Write manifest.json
    manifest_data = {
        "baseDate": base_date_str,
        "generatedAt": datetime.now().isoformat(),
        "disclaimer": "All files in this directory are 100% fictional demo artifacts created for software testing and evaluation. Every document carries a prominent watermark and must never be used for real visa applications.",
        "travelers": [
            {
                "name": t["name"],
                "slug": t["slug"],
                "scenario": t["scenario"],
                "expectedOutcome": t["expectedOutcome"],
                "plannedTrip": t["plannedTrip"],
                "travelRecords": t["travelRecords"],
                "documents": [d for d in all_manifest_docs if d["personSlug"] == t["slug"]]
            }
            for t in travelers_meta
        ],
        "documents": all_manifest_docs
    }
    
    manifest_path = os.path.join(output_base, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    print(f"\n[OK] Manifest written to {manifest_path} ({len(all_manifest_docs)} documents indexed)")
    
    # Write README.md
    readme_path = os.path.join(output_base, "README.md")
    readme_content = f"""# VisaVault Fictional Sample Documents 📁🛡️

> **LEGAL NOTICE & DISCLAIMER:**  
> **All documents, names, numbers, institutions, employers, and addresses in this directory are 100% FICTIONAL and generated exclusively for software testing, OCR verification, and hackathon demonstrations.**  
> Every document carries a prominent, diagonal watermark across the entire page (**"SAMPLE - NOT A REAL DOCUMENT"**) and an official testing footer (**"Fictional demo data for software testing"**).  
> **NEVER ATTEMPT TO USE THESE DOCUMENTS FOR ANY REAL VISA APPLICATION, TRAVEL, OR IDENTIFICATION PURPOSE.**

---

## 📅 Dynamic Date Basis
- **Current BASE_DATE:** `{base_date_str}`
- All dates (issuance, validity, statements, flight reservations, leave periods) are calculated relative to `BASE_DATE`.
- To regenerate with a different base date (e.g., today's date), run:
  ```bash
  python scripts/generate_samples.py --base-date YYYY-MM-DD
  ```

---

## 👥 The 4 Fictional Travelers & Test Scenarios

### 1. Aarav Example (`aarav-example/`)
- **Scenario:** Visa fully covers the trip (**"Good to go"**).
- **Nationality / Residence:** Fictional Sampleland resident in the UAE.
- **Dossier:** Passport (valid +6y), multiple-entry Schengen visa (valid -60d to +300d), UAE residence permit (+14m), travel insurance (€50k, covers full stay), flight booking (+30d to +40d), hotel voucher (+30d to +40d), bank statement (healthy closing balance of AED 42,500), employment NOC letter (-10d), photo silhouette.
- **Expected Outcome:** `READY` (Score: 100%). Existing visa covers trip; rolling 90/180 stay allowance satisfied (12 past + 10 planned = 22/90 days used); all documents consistent.

### 2. Meera Sample (`meera-sample/`)
- **Scenario:** Visa valid but problems (**"Partially covered"**).
- **Issues Flagged:**
  1. **Passport expires too soon:** Passport expires in 75 days, violating Schengen requirement of at least 3 months validity beyond intended return.
  2. **Stay allowance exceeded:** 78 days already spent in Schengen in the last 180 days; a 20-day trip (+20d to +40d) reaches 98 days, exceeding the 90-day rolling ceiling.
- **Files:** Includes phone-scanned passport copy (`passport.png`), visa, residence permit, insurance (€40k), flight, hotel, bank statement, employment letter, photo.
- **Expected Outcome:** `PARTIAL / BLOCKED`. Passport renewal required; trip duration must be reduced to avoid overstaying the 90/180 limit.

### 3. Rohan Demo (`rohan-demo/`)
- **Scenario:** No visa, missing documents (**"New application required"**).
- **Issues Flagged:**
  1. **No existing visa document in vault.**
  2. **Deliberately missing mandatory documents:** No travel insurance policy and no employer leave letter (NOC).
  3. **Stale bank statement:** Bank statement ends 55 days ago, violating the standard consular 30-day freshness rule.
- **Files:** Passport, residence permit, flight, hotel, stale bank statement, photo. (No visa, no insurance, no employment letter).
- **Expected Outcome:** `NEW APPLICATION REQUIRED`. Checklist indicates missing insurance, missing employment letter, and requests recent 30-day bank statement.

### 4. Sana Testcase (`sana-testcase/`)
- **Scenario:** Critical inconsistencies (**"Action required"**).
- **Issues Flagged:**
  1. **Spelling mismatch:** Hotel booking issued to `"SANNA TEST-CASE"` while passport is `"SANA TESTCASE"`.
  2. **Incomplete accommodation:** Flight returns on +47d, but hotel check-out is +44d (missing 3 nights of lodging).
  3. **Insufficient insurance:** Coverage is €20,000, failing the Schengen minimum statutory requirement of €30,000.
  4. **Insufficient funds:** Closing bank balance is only AED 450.00, below subsistence requirements.
- **Files:** Passport, residence permit, flight, hotel (phone scan with desk shadow), insurance, bank statement, employment letter, photo.
- **Expected Outcome:** `ACTION REQUIRED / CRITICAL INCONSISTENCIES`. Highlights spelling mismatch, 3-night hotel coverage gap, inadequate insurance coverage, and low bank funds.

---

## 🖼️ Contact Sheet Overview
A high-resolution contact sheet image showing all generated thumbnails side-by-side is located at:
`public/samples/overview.png`
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print(f"[OK] README written to {readme_path}")
    
    # Generate overview contact sheet
    overview_path = os.path.join(output_base, "overview.png")
    print(f"\n[+] Generating visual contact sheet: {overview_path}...")
    generate_contact_sheet(travelers_for_overview, overview_path)
    print(f"[OK] Contact sheet successfully generated ({os.path.getsize(overview_path):,} bytes)")
    
    print(f"\n============================================================")
    print(f"Generation Complete! Total files created: {len(all_manifest_docs) + 3}")
    print(f"============================================================")

# -----------------------------------------------------------------------------
# CLI Entry Point
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate fictional sample documents for VisaVault hackathon demo.")
    parser.add_argument("--base-date", default=DEFAULT_BASE_DATE, help="Base date for scenario calculations (YYYY-MM-DD)")
    parser.add_argument("--output-dir", default=None, help="Custom output directory (default: public/samples)")
    args = parser.parse_args()
    
    # Determine default paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    if args.output_dir:
        output_dir = os.path.abspath(args.output_dir)
    else:
        output_dir = os.path.join(project_root, "public", "samples")
        
    # Validate base date format
    try:
        datetime.strptime(args.base_date, "%Y-%m-%d")
    except ValueError:
        print(f"Error: Invalid date format for --base-date '{args.base_date}'. Expected YYYY-MM-DD.")
        sys.exit(1)
        
    generate_samples(args.base_date, output_dir)

if __name__ == "__main__":
    main()
