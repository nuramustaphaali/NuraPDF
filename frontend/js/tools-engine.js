/* NuraPDF - UX Enhanced Engine */

const ToolsEngine = {
    
    // Helper: Button Loading State
    setLoading: (btnId, isLoading, text) => {
        const btn = document.getElementById(btnId);
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="loader"></span> ${text}`;
            btn.classList.add('loading');
        } else {
            btn.disabled = false;
            btn.innerHTML = text; // Reset text usually "Download" or "Merge"
            btn.classList.remove('loading');
            
            // Success flash
            btn.classList.add('btn-success-anim');
            setTimeout(() => btn.classList.remove('btn-success-anim'), 1000);
        }
    },

    // --- 1. MERGE ---
    mergePdfs: async () => {
        const files = document.getElementById('mergeInput').files;
        if (files.length < 2) return alert("Please select at least 2 PDF files.");

        ToolsEngine.setLoading('btnMerge', true, "Merging...");

        // Small delay to allow UI to render the spinner (Main thread blocking fix)
        setTimeout(async () => {
            try {
                const mergedPdf = await PDFLib.PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    const arrayBuffer = await files[i].arrayBuffer();
                    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                const pdfBytes = await mergedPdf.save();
                Exporter.triggerDownload(pdfBytes, "NuraPDF_Merged.pdf");
                ToolsEngine.setLoading('btnMerge', false, "Merge Complete!");
                setTimeout(() => document.getElementById('btnMerge').innerText = "Merge PDFs", 2000);
            } catch (err) {
                alert("Error: " + err.message);
                ToolsEngine.setLoading('btnMerge', false, "Merge Failed");
            }
        }, 100);
    },

    // --- 2. SPLIT ---
    splitPdf: async () => {
        const file = document.getElementById('splitInput').files[0];
        const rangeStr = document.getElementById('splitRange').value;
        if (!file || !rangeStr) return alert("Select file & range.");

        ToolsEngine.setLoading('btnSplit', true, "Splitting...");

        setTimeout(async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const newPdf = await PDFLib.PDFDocument.create();
                const totalPages = sourcePdf.getPageCount();

                const indicesToKeep = new Set();
                const parts = rangeStr.split(',');

                parts.forEach(part => {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                        for (let i = start; i <= end; i++) indicesToKeep.add(i - 1);
                    } else {
                        indicesToKeep.add(parseInt(part.trim()) - 1);
                    }
                });

                const indicesArray = Array.from(indicesToKeep).filter(i => i >= 0 && i < totalPages);
                if (indicesArray.length === 0) throw new Error("Invalid Page Range");

                const copiedPages = await newPdf.copyPages(sourcePdf, indicesArray);
                copiedPages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                Exporter.triggerDownload(pdfBytes, "NuraPDF_Split.pdf");
                
                ToolsEngine.setLoading('btnSplit', false, "Done!");
            } catch (err) {
                alert(err.message);
                ToolsEngine.setLoading('btnSplit', false, "Split PDF");
            }
        }, 100);
    },

    // --- 3. PDF TO IMAGE ---
    pdfToImages: async () => {
        const file = document.getElementById('p2iInput').files[0];
        if (!file) return alert("Select PDF.");

        ToolsEngine.setLoading('btnP2I', true, "Converting...");

        setTimeout(async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                const pdf = await loadingTask.promise;
                const zip = new JSZip();

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.8));
                    zip.file(`Page-${i}.jpg`, blob);
                }

                const content = await zip.generateAsync({ type: "blob" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "NuraPDF_Images.zip";
                link.click();
                
                ToolsEngine.setLoading('btnP2I', false, "Downloaded!");
            } catch (err) {
                console.error(err);
                ToolsEngine.setLoading('btnP2I', false, "Error");
            }
        }, 100);
    },

    // --- 4. IMG TO PDF ---
    imagesToPdf: async () => {
        const files = document.getElementById('i2pInput').files;
        if (files.length === 0) return alert("Select images.");

        ToolsEngine.setLoading('btnI2P', true, "Building PDF...");

        setTimeout(async () => {
            try {
                const newPdf = await PDFLib.PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    const buffer = await files[i].arrayBuffer();
                    const isPng = files[i].type === 'image/png';
                    let image;
                    if (isPng) image = await newPdf.embedPng(buffer);
                    else image = await newPdf.embedJpg(buffer);
                    
                    // Scale image to fit A4 roughly or keep original size
                    // For safety, let's just make page size = image size
                    const page = newPdf.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                }
                const pdfBytes = await newPdf.save();
                Exporter.triggerDownload(pdfBytes, "NuraPDF_Gallery.pdf");
                ToolsEngine.setLoading('btnI2P', false, "Success!");
            } catch (err) {
                alert(err.message);
                ToolsEngine.setLoading('btnI2P', false, "Failed");
            }
        }, 100);
    }
};