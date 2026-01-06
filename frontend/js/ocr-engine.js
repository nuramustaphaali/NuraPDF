/* NuraPDF - OCR Engine (PDF & Image Support) */

const OCREngine = {
    file: null,

    loadImage: async (input) => {
        if (input.files && input.files[0]) {
            OCREngine.file = input.files[0];
            document.getElementById('ocrLabel').innerText = OCREngine.file.name;

            // HANDLE PREVIEW
            const imgEl = document.getElementById('ocrImg');
            const previewContainer = document.getElementById('ocrPreview');

            if (OCREngine.file.type === 'application/pdf') {
                // If PDF, render Page 1 as preview
                const arrayBuffer = await OCREngine.file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.5 });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                imgEl.src = canvas.toDataURL(); // Show PDF page as image
                previewContainer.style.display = 'block';

            } else {
                // If Image, just show it
                const reader = new FileReader();
                reader.onload = (e) => {
                    imgEl.src = e.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(OCREngine.file);
            }
        }
    },

    run: async () => {
        if (!OCREngine.file) return Swal.fire('No File', 'Upload an image or PDF.', 'warning');

        const btn = document.getElementById('btnOCR');
        const resultArea = document.getElementById('ocrResult');
        const lang = document.getElementById('ocrLang').value;

        btn.disabled = true;
        btn.innerText = "Processing...";
        resultArea.value = "Initializing...";

        try {
            let imageToScan;

            // STEP 1: PREPARE THE IMAGE
            if (OCREngine.file.type === 'application/pdf') {
                resultArea.value = "Converting PDF Page 1 to Image...";
                
                const arrayBuffer = await OCREngine.file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const page = await pdf.getPage(1); // Scan Page 1 only for now
                const viewport = page.getViewport({ scale: 2.0 }); // High Res for OCR
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                // Convert to Blob for Tesseract
                imageToScan = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            } else {
                imageToScan = OCREngine.file;
            }

            // STEP 2: RUN TESSERACT
            resultArea.value = "Loading OCR Engine (this may take a moment)...";
            
            const worker = await Tesseract.createWorker(lang);
            
            resultArea.value = "Scanning Text...";
            const ret = await worker.recognize(imageToScan);
            
            resultArea.value = ret.data.text;
            await worker.terminate();

            btn.disabled = false;
            btn.innerText = "Start Scan";
            Swal.fire('Success', 'Text Extracted!', 'success');

        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerText = "Start Scan";
            resultArea.value = "Error: " + err.message;
            Swal.fire('OCR Failed', 'Could not process file. ' + err.message, 'error');
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