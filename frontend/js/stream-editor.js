/* NuraPDF - Advanced Stream Editor v2
   Support for ASCII and Hexadecimal Text Streams
*/

const StreamEditor = {

    replaceTextValues: async (findText, replaceText) => {
        if (!AppState.fileBuffer) return alert("No file loaded.");
        
        console.log(`Deep Search: "${findText}" -> "${replaceText}"`);
        const btn = document.querySelector('button[title="Stream Replace (Beta)"]');
        if(btn) btn.innerText = "Scanning...";

        try {
            const pdfDoc = await PDFLib.PDFDocument.load(AppState.fileBuffer.slice(0));
            const pages = pdfDoc.getPages();
            let totalReplacements = 0;

            // PREPARE PATTERNS
            // 1. Standard ASCII: (Hello)
            const asciiPattern = `\\(${StreamEditor.escapeRegExp(findText)}\\)`;
            
            // 2. Hexadecimal: <48656C6C6F>
            const hexText = StreamEditor.stringToHex(findText);
            const hexReplace = StreamEditor.stringToHex(replaceText);
            const hexPattern = `<${hexText}>`;

            // Combine into one big regex
            const regex = new RegExp(`(${asciiPattern}|${hexPattern})`, 'g');

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { Content } = page.node.normalizedEntries();
                
                let streams = [];
                if (Content instanceof PDFLib.PDFArray) streams = Content.asArray();
                else if (Content instanceof PDFLib.PDFStream) streams = [Content];

                for (const streamRef of streams) {
                    const streamObj = pdfDoc.context.lookup(streamRef);
                    if (!(streamObj instanceof PDFLib.PDFRawStream)) continue;

                    // DECOMPRESS
                    const compressedBytes = streamObj.contents;
                    let uncompressedString = "";
                    try {
                        const decompressed = pako.inflate(compressedBytes);
                        uncompressedString = StreamEditor.bytesToString(decompressed);
                    } catch (e) {
                        uncompressedString = StreamEditor.bytesToString(compressedBytes);
                    }

                    // SEARCH & REPLACE
                    if (regex.test(uncompressedString)) {
                        console.log(`Found match on Page ${i+1}`);
                        
                        // Smart Replace: If we matched Hex, replace with Hex. If ASCII, replace with ASCII.
                        const newContent = uncompressedString.replace(regex, (match) => {
                            totalReplacements++;
                            if (match.startsWith('<')) return `<${hexReplace}>`;
                            return `(${replaceText})`;
                        });

                        // RE-COMPRESS
                        const newBytes = StreamEditor.stringToBytes(newContent);
                        const newCompressed = pako.deflate(newBytes);
                        streamObj.contents = newCompressed;
                    }
                }
            }

            if (totalReplacements === 0) {
                alert("Still not found. The text uses a Custom Encoding (Identity-H). Use the 'Eraser' tool instead.");
            } else {
                const pdfBytes = await pdfDoc.save();
                Exporter.triggerDownload(pdfBytes, "NuraPDF_TextReplaced.pdf");
            }

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            if(btn) btn.innerText = "⚠ REP";
        }
    },

    // --- UTILITIES ---
    escapeRegExp: (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    
    bytesToString: (bytes) => {
        let str = "";
        for (let i = 0; i < bytes.length; i++) { str += String.fromCharCode(bytes[i]); }
        return str;
    },

    stringToBytes: (str) => {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) { bytes[i] = str.charCodeAt(i); }
        return bytes;
    },

    stringToHex: (str) => {
        let hex = "";
        for (let i = 0; i < str.length; i++) {
            hex += ("0" + str.charCodeAt(i).toString(16)).slice(-2).toUpperCase();
        }
        return hex;
    }
};