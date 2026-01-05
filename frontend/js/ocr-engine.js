/* NuraPDF - OCR Engine (Interactive) */

const OCREngine = {
    file: null,

    // Called when user selects a file
    loadImage: (input) => {
        if (input.files && input.files[0]) {
            OCREngine.file = input.files[0];
            
            // Update Label
            document.getElementById('ocrLabel').innerText = OCREngine.file.name;

            // Show Preview
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
            return Swal.fire('No File', 'Please upload an image or PDF first.', 'warning');
        }

        const btn = document.getElementById('btnOCR');
        const resultArea = document.getElementById('ocrResult');
        const lang = document.getElementById('ocrLang').value;

        btn.disabled = true;
        resultArea.value = "Starting OCR Engine...";
        
        try {
            // Tesseract Worker
            const worker = Tesseract.createWorker({
                logger: m => {
                    // Update Text Area with Progress
                    if(m.status === 'recognizing text') {
                        resultArea.value = `Scanning... ${(m.progress * 100).toFixed(0)}%`;
                    }
                }
            });

            await worker.load();
            await worker.loadLanguage(lang);
            await worker.initialize(lang);

            const { data: { text } } = await worker.recognize(OCREngine.file);
            
            resultArea.value = text;
            await worker.terminate();
            
            btn.disabled = false;
            Swal.fire('Success', 'Text extracted successfully!', 'success');

        } catch (err) {
            console.error(err);
            Swal.fire('OCR Failed', err.message, 'error');
            btn.disabled = false;
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