/* NuraPDF - Backend Client (Fixed & Interactive) */
const API_URL = "http://127.0.0.1:8000/api";

const BackendTools = {

    // Helper: Get file from specific input
    getFileFromInput: (inputId) => {
        const input = document.getElementById(inputId);
        if (!input || !input.files || input.files.length === 0) return null;
        return input.files[0];
    },

    // Helper: Send Request with SweetAlert Feedback
    sendRequest: async (endpoint, formData, filename) => {
        // 1. Show Loading Popup
        Swal.fire({
            title: 'Processing...',
            text: 'Sending data to local engine',
            didOpen: () => { Swal.showLoading() },
            allowOutsideClick: false
        });

        try {
            // 2. Fetch from Python Backend
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                body: formData
            });

            // 3. Handle Server Errors
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Server rejected request");
            }

            // 4. Download Result
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename || "processed.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 5. Success Popup
            Swal.fire({
                icon: 'success',
                title: 'Done!',
                text: 'File downloaded successfully.',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            console.error(err);
            // 6. Error Popup (Interactive)
            Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text: err.message === 'Failed to fetch' 
                    ? 'Is the Python Backend running? (Run "python main.py")' 
                    : err.message
            });
        }
    },

    // --- SECURITY TOOLS (Uses #secInput) ---

    compress: () => {
        const file = BackendTools.getFileFromInput('secInput');
        if(!file) return Swal.fire('No File', 'Please select a PDF in the Security tab first.', 'warning');
        
        const fd = new FormData();
        fd.append("file", file);
        BackendTools.sendRequest("compress", fd, `Optimized_${file.name}`);
    },

    encrypt: () => {
        const file = BackendTools.getFileFromInput('secInput');
        const pass = document.getElementById('encPass').value;
        if(!file) return Swal.fire('No File', 'Select a PDF first.', 'warning');
        if(!pass) return Swal.fire('Missing Password', 'Enter a password to lock the file.', 'warning');

        const fd = new FormData();
        fd.append("file", file);
        fd.append("password", pass);
        BackendTools.sendRequest("encrypt", fd, `Locked_${file.name}`);
    },

    decrypt: () => {
        const file = BackendTools.getFileFromInput('secInput');
        const pass = document.getElementById('decPass').value;
        if(!file) return Swal.fire('No File', 'Select a PDF first.', 'warning');
        if(!pass) return Swal.fire('Missing Password', 'Enter the password to unlock.', 'warning');

        const fd = new FormData();
        fd.append("file", file);
        fd.append("password", pass);
        BackendTools.sendRequest("decrypt", fd, `Unlocked_${file.name}`);
    },

    watermark: () => {
        const file = BackendTools.getFileFromInput('secInput');
        const text = document.getElementById('wmText').value;
        if(!file) return Swal.fire('No File', 'Select a PDF first.', 'warning');
        if(!text) return Swal.fire('Missing Text', 'Enter watermark text.', 'warning');

        const fd = new FormData();
        fd.append("file", file);
        fd.append("text", text);
        BackendTools.sendRequest("watermark", fd, `Watermarked_${file.name}`);
    },

    // --- CONVERSION TOOLS (Uses #convInput) ---

    convert: (type) => {
        const file = BackendTools.getFileFromInput('convInput');
        if(!file) return Swal.fire('No File', 'Please select a file in the Convert tab.', 'warning');
        
        // Simple Validation
        if(type === 'docx-to-pdf' && !file.name.match(/\.doc/i)) {
            return Swal.fire('Wrong Format', 'Please upload a Word (.docx) file.', 'error');
        }
        if(type.startsWith('pdf') && !file.name.match(/\.pdf/i)) {
            return Swal.fire('Wrong Format', 'Please upload a PDF file.', 'error');
        }

        const fd = new FormData();
        fd.append("file", file);
        
        // Determine Output Extension
        let ext = "pdf";
        if(type === 'pdf-to-docx') ext = "docx";
        if(type === 'pdf-to-txt') ext = "txt";

        BackendTools.sendRequest(`convert/${type}`, fd, `Converted_${file.name.split('.')[0]}.${ext}`);
    }
};