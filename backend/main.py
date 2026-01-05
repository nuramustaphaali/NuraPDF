import os
import io
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from pdf2docx import Converter
from pdfminer.high_level import extract_text
import mammoth
from xhtml2pdf import pisa

app = FastAPI(title="NuraPDF Backend")

# Enable CORS (Allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# --- UTILS ---
def cleanup_file(path: str):
    """Deletes the file after response is sent"""
    try:
        os.remove(path)
    except Exception:
        pass

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "NuraPDF Backend is Running"}

# 1. COMPRESS PDF (Optimization)
@app.post("/api/compress")
async def compress_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        reader = PdfReader(file.file)
        writer = PdfWriter()

        for page in reader.pages:
            # pypdf compression (lossless structure optimization)
            page.compress_content_streams() 
            writer.add_page(page)

        # Advanced: Deduplicate objects
        writer.compress_identical_objects(remove_identicals=True)

        output_path = f"{TEMP_DIR}/compressed_{file.filename}"
        with open(output_path, "wb") as f:
            writer.write(f)

        # Register auto-delete
        background_tasks.add_task(cleanup_file, output_path)
        
        return FileResponse(output_path, filename=f"Optimized_{file.filename}")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# 2. ENCRYPT PDF (Password Protect)
@app.post("/api/encrypt")
async def encrypt_pdf(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    password: str = Form(...)
):
    try:
        reader = PdfReader(file.file)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # Add 128-bit AES Encryption
        writer.encrypt(password, algorithm="AES-128")

        output_path = f"{TEMP_DIR}/locked_{file.filename}"
        with open(output_path, "wb") as f:
            writer.write(f)

        background_tasks.add_task(cleanup_file, output_path)
        return FileResponse(output_path, filename=f"Locked_{file.filename}")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# 3. DECRYPT PDF (Unlock)
@app.post("/api/decrypt")
async def decrypt_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...)
):
    try:
        reader = PdfReader(file.file)
        
        if reader.is_encrypted:
            success = reader.decrypt(password)
            if not success:
                return JSONResponse(status_code=400, content={"error": "Incorrect Password"})

        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)

        output_path = f"{TEMP_DIR}/unlocked_{file.filename}"
        with open(output_path, "wb") as f:
            writer.write(f)

        background_tasks.add_task(cleanup_file, output_path)
        return FileResponse(output_path, filename=f"Unlocked_{file.filename}")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# 4. WATERMARK PDF (Overlay Text)
@app.post("/api/watermark")
async def watermark_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    text: str = Form(...)
):
    try:
        # A. Create Watermark PDF in memory using ReportLab
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica-Bold", 50)
        can.setFillColorRGB(0.5, 0.5, 0.5, 0.3) # Grey, Transparent
        
        # Draw text at 45 degrees in center
        can.saveState()
        can.translate(300, 400)
        can.rotate(45)
        can.drawCentredString(0, 0, text)
        can.restoreState()
        can.save()

        packet.seek(0)
        watermark_pdf = PdfReader(packet)
        watermark_page = watermark_pdf.pages[0]

        # B. Merge Watermark onto Original
        reader = PdfReader(file.file)
        writer = PdfWriter()

        for page in reader.pages:
            page.merge_page(watermark_page) # The magic merge
            writer.add_page(page)

        output_path = f"{TEMP_DIR}/watermarked_{file.filename}"
        with open(output_path, "wb") as f:
            writer.write(f)

        background_tasks.add_task(cleanup_file, output_path)
        return FileResponse(output_path, filename=f"Watermarked_{file.filename}")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# 5. PDF TO DOCX
@app.post("/api/convert/pdf-to-docx")
async def pdf_to_docx(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        input_path = f"{TEMP_DIR}/{file.filename}"
        output_filename = f"{file.filename.rsplit('.', 1)[0]}.docx"
        output_path = f"{TEMP_DIR}/{output_filename}"

        # Save uploaded PDF temporarily
        with open(input_path, "wb") as f:
            f.write(await file.read())

        # Convert
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()

        background_tasks.add_task(cleanup_file, input_path)
        background_tasks.add_task(cleanup_file, output_path)

        return FileResponse(output_path, filename=output_filename)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# 6. PDF TO TXT
@app.post("/api/convert/pdf-to-txt")
async def pdf_to_txt(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        # Extract text directly from memory
        text = extract_text(file.file)
        
        output_filename = f"{file.filename.rsplit('.', 1)[0]}.txt"
        output_path = f"{TEMP_DIR}/{output_filename}"
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

        background_tasks.add_task(cleanup_file, output_path)
        return FileResponse(output_path, filename=output_filename)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# 7. DOCX TO PDF (The Pip-Only Bridge Method)
@app.post("/api/convert/docx-to-pdf")
async def docx_to_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        input_path = f"{TEMP_DIR}/{file.filename}"
        output_filename = f"{file.filename.rsplit('.', 1)[0]}.pdf"
        output_path = f"{TEMP_DIR}/{output_filename}"

        # Save docx
        with open(input_path, "wb") as f:
            f.write(await file.read())

        # Step A: DOCX -> HTML (using Mammoth)
        with open(input_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            html = result.value

        # Step B: HTML -> PDF (using xhtml2pdf)
        # We add some basic CSS to make it look decent
        full_html = f"""
        <html>
        <head>
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{ font-family: Helvetica; font-size: 12pt; }}
        </style>
        </head>
        <body>{html}</body>
        </html>
        """
        
        with open(output_path, "wb") as pdf_file:
            pisa_status = pisa.CreatePDF(io.BytesIO(full_html.encode('utf-8')), dest=pdf_file)

        if pisa_status.err:
            raise Exception("PDF Generation Error")

        background_tasks.add_task(cleanup_file, input_path)
        background_tasks.add_task(cleanup_file, output_path)

        return FileResponse(output_path, filename=output_filename)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Run on localhost:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)