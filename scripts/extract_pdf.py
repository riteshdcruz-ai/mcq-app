import fitz  # pymupdf
import sys
import os

pdf_path = sys.argv[1]
out_path = sys.argv[2] if len(sys.argv) > 2 else "extracted.txt"

doc = fitz.open(pdf_path)
print(f"Pages: {doc.page_count}")

text_parts = []
for i, page in enumerate(doc):
    text = page.get_text()
    if text.strip():
        text_parts.append(f"\n--- Page {i+1} ---\n{text}")
    if (i + 1) % 50 == 0:
        print(f"  Processed {i+1}/{doc.page_count} pages...")

full_text = "\n".join(text_parts)
with open(out_path, "w", encoding="utf-8") as f:
    f.write(full_text)

print(f"Text length: {len(full_text)} chars")
print(f"Saved to: {out_path}")
