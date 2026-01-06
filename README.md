# NuraPDF 📄✨

> **The Premium, Local-First PDF Suite.** > *Edit, Convert, OCR, and Secure your documents without sending data to the cloud.*

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/backend-FastAPI-yellow.svg)
![Frontend](https://img.shields.io/badge/frontend-VanillaJS-orange.svg)

**NuraPDF** is a powerful PDF manipulation tool that combines a **Responsive Web Interface** with a lightweight **Python Backend**. Unlike other tools, it requires **zero system binaries** (no Poppler, no ImageMagick) and runs entirely on `pip` libraries and browser technologies.

---

## 🚀 Key Features

### 🎨 **Frontend Tools (Browser-Side)**
*Instant operations running directly in your browser (Zero Latency).*
* **PDF Editor:** Draw, highlight, add text, and insert images.
* **Visual Eraser:** "Whiteout" tool to redact sensitive information.
* **Organization:** Merge PDFs, Split pages, and Delete pages.
* **Smart OCR:** Extract text from scanned PDFs and Images using **Tesseract v5 (WASM)**.
* **Images:** Convert PDF to JPG (ZIP) and Images to PDF.

### ⚙️ **Backend Engine (Python / FastAPI)**
*Heavy-duty processing handling complex file structures.*
* **Optimization:** Smart compression using **PyMuPDF** (Garbage Collection 4).
* **Conversion:** High-fidelity `PDF ↔ Word (.docx)` and `PDF → Text`.
* **Security:** AES-128 Encryption and Decryption.
* **Watermarking:** Server-side text overlay.

---

## 🛠️ Installation

### Prerequisites
* Python 3.10+ (Recommended)
* A modern web browser (Chrome/Edge/Firefox)

### 1. Clone the Repository
```bash
git clone [https://github.com/nuramustaphaali/NuraPDF.git](https://github.com/nuramustaphaali/NuraPDF.git)
cd NuraPDF

```

### 2. Backend Setup

We use a strict **pip-only** stack. No `.exe` installers required.

```bash
cd backend
# Create virtual environment (Optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

```

### 3. Running the App

**Step A: Start the Engine**

```bash
# Inside /backend folder
python main.py

```

*You will see: `Uvicorn running on http://127.0.0.1:8000*`
**Step B: Launch the UI**
* Open `frontend/index.html` directly in your browser.
* **Pro Tip:** Use Live Server (VS Code) for the best experience, but double-clicking the file works too!



## 🖥️ Usage Guide

1. **Editor Tab:** Upload a PDF to draw, highlight, or redact text. Click **Download** to save changes.
2. **Tools (Merge/Split):** Select multiple files to combine them or extract specific page ranges (e.g., `1-3, 5`).
3. **Security Tab:** Use this for **Compression**, **Locking**, and **Watermarking**. These requests are sent to your local Python backend.
4. **Convert Tab:** Transform PDFs to Word/Text or vice-versa.
5. **OCR Tab:** Upload an image or scanned PDF. The browser will download the language model once and perform recognition locally.

---

## 🏗️ Architecture

* **Frontend:** HTML5, CSS3 (Midnight Pro Theme), Fabric.js, PDF.js, Tesseract.js.
* **Backend:** FastAPI, Uvicorn.
* **Core Libraries:** `PyMuPDF` (Compression), `pypdf` (Security), `pdf2docx` (Conversion).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](https://www.google.com/search?q=CONTRIBUTING.md) for details on how to set up your development environment and submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.


*Created by [Nura Mustapha Ali*](https://www.google.com/search?q=https://github.com/nuramustaphaali)
