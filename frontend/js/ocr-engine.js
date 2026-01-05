/* NuraPDF - OCR Engine (Tesseract v5) */

const OCREngine = {
    file: null,

    loadImage: (input) => {
        if (input.files && input.files[0]) {
            OCREngine.file = input.files[0];
            document.getElementById('ocrLabel').innerText = OCREngine.file.name;

            // Preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('ocrImg');
                img.src = e.target.result;
                document.getElementById('ocrPreview').style.display = 'block';
            };
            reader.readAsDataURL(OCREngine.file);
        }
    },

    run: async () => {
        if (!OCREngine.file) {
            return Swal.fire('No File', 'Upload an image first.', 'warning');
        }

        const btn = document.getElementById('btnOCR');
        const resultArea = document.getElementById('ocrResult');
        const lang = document.getElementById('ocrLang').value; // 'eng', 'spa', etc.

        btn.disabled = true;
        btn.innerText = "Initializing...";
        resultArea.value = "Downloading Language Model (20MB)... this happens once.";

        try {
            // Tesseract v5 Simple API
            const worker = await Tesseract.createWorker(lang);
            
            btn.innerText = "Scanning...";
            
            // Define Logger to show progress
            // (Note: v5 logger is tricky, simplified here for stability)
            
            const ret = await worker.recognize(OCREngine.file);
            
            resultArea.value = ret.data.text;
            await worker.terminate();

            btn.disabled = false;
            btn.innerText = "Start Scan";
            Swal.fire('Success', 'Scan Complete!', 'success');

        } catch (err) {
            console.error("OCR Error:", err);
            btn.disabled = false;
            btn.innerText = "Start Scan";
            resultArea.value = "Error details logged to console (F12).";
            Swal.fire('OCR Failed', 'Check internet connection (Language data download failed) or file type.', 'error');
        }
    },

    downloadTxt: () => {
        const text = document.getElementById('ocrResult').value;
        if (!text) return Swal.fire('Empty', 'No text to download.', 'info');
        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "OCR_Result.txt";
        link.click();
    }
};