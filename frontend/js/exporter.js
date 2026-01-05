/* NuraPDF - Exporter.js
   Handles merging overlays and generating the final PDF.
*/

const Exporter = {

    downloadPDF: async () => {
        console.log("Download started...");
        const btn = document.getElementById('btnDownload');
        const originalText = btn.innerText;
        
        // 1. SAFETY CHECKS
        if (typeof PDFLib === 'undefined') {
            alert("Error: PDF-Lib library not loaded. Check your internet connection or index.html.");
            return;
        }

        if (!AppState.pdfDoc) {
            alert("No PDF loaded. Please upload a file first.");
            return;
        }

        if (!AppState.fileBuffer) {
            alert("System Error: Original file data is missing. Please refresh and re-upload the PDF.");
            console.error("AppState.fileBuffer is null. Update app.js to save arrayBuffer to AppState.");
            return;
        }

        try {
            btn.innerText = "⏳ Processing...";
            btn.disabled = true;

            // 2. Load the original PDF
            // Load a COPY of the buffer, so the original stays valid for a second download
            const pdfDoc = await PDFLib.PDFDocument.load(AppState.fileBuffer.slice(0));
            
            // Create a NEW PDF to serve as the output (allows us to reorder/delete pages easily)
            const newPdf = await PDFLib.PDFDocument.create();

            // 3. Process Every Page
            // We iterate through AppState.pages because that reflects the USER'S order (and deletions)
            for (let i = 0; i < AppState.pages.length; i++) {
                const pageData = AppState.pages[i];
                const originalIndex = pageData.originalIndex - 1; // PDF-Lib is 0-indexed

                // A. Copy the page from Source
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [originalIndex]);

                // B. Apply Rotation
                // Add existing rotation + new rotation
                const existingRotation = copiedPage.getRotation().angle;
                const finalRotation = (existingRotation + pageData.rotation) % 360;
                copiedPage.setRotation(PDFLib.degrees(finalRotation));

                // C. Generate and Embed Overlay (Drawings/Text)
                const overlayBytes = await Exporter.generateOverlayPng(i, copiedPage.getWidth(), copiedPage.getHeight());
                
                if (overlayBytes) {
                    const embeddedImage = await newPdf.embedPng(overlayBytes);
                    copiedPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: copiedPage.getWidth(),
                        height: copiedPage.getHeight(),
                    });
                }

                // D. Add to final PDF
                newPdf.addPage(copiedPage);
            }

            // 4. Save and Download
            const pdfBytes = await newPdf.save();
            Exporter.triggerDownload(pdfBytes, "NuraPDF_Edited.pdf");

        } catch (err) {
            console.error("Export Error:", err);
            alert("Failed to create PDF: " + err.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    // Generates a transparent PNG of the FabricJS canvas for a specific page
    generateOverlayPng: async (pageIndex, width, height) => {
        const json = AppState.pageEdits[pageIndex];
        
        // If no edits exist for this page, return null
        if (!json || !json.objects || json.objects.length === 0) return null;

        return new Promise((resolve) => {
            // Create a hidden canvas to render the specific page's JSON
            const tempCanvasEl = document.createElement('canvas');
            tempCanvasEl.width = width;
            tempCanvasEl.height = height;

            // Use StaticCanvas (no interactivity needed, just rendering)
            const tempFabric = new fabric.StaticCanvas(tempCanvasEl);
            tempFabric.setDimensions({ width, height });

            // Load the JSON data
            tempFabric.loadFromJSON(json, () => {
                // Convert to PNG Data URL
                const dataURL = tempFabric.toDataURL({
                    format: 'png',
                    multiplier: 1 // 1 = Screen res. Increase for higher quality print.
                });

                // Convert DataURL to Uint8Array for PDF-Lib
                const byteString = atob(dataURL.split(',')[1]);
                const arrayBuffer = new ArrayBuffer(byteString.length);
                const uint8Array = new Uint8Array(arrayBuffer);
                for (let k = 0; k < byteString.length; k++) {
                    uint8Array[k] = byteString.charCodeAt(k);
                }

                tempFabric.dispose(); // Cleanup memory
                resolve(uint8Array);
            });
        });
    },

    // Browser download trigger
    triggerDownload: (data, filename) => {
        const blob = new Blob([data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
};