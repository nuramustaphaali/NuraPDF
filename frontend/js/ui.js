/* UI Controller - Handles Navigation & Interaction */
const UI = {
    currentView: 'editor',

    switchView: (viewId) => {
        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

        // Show target view
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        // Update Sidebar Active State
        // (Simple loop to match text or href, specifically optimized for this strict layout)
        const menuItems = document.querySelectorAll('.menu-item');
        if (viewId === 'editor') menuItems[0].classList.add('active');
        if (viewId === 'merge') menuItems[1].classList.add('active');
        if (viewId === 'split') menuItems[2].classList.add('active');
        if (viewId === 'pdf-to-img') menuItems[3].classList.add('active');
        if (viewId === 'img-to-pdf') menuItems[4].classList.add('active');

        UI.currentView = viewId;
    }
};

// Auto-populate file lists for Merge/Img2Pdf
document.getElementById('mergeInput').addEventListener('change', (e) => {
    const list = document.getElementById('mergeList');
    list.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
        const li = document.createElement('li');
        li.innerText = file.name;
        list.appendChild(li);
    });
});

document.getElementById('i2pInput').addEventListener('change', (e) => {
    const list = document.getElementById('i2pList');
    list.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
        const li = document.createElement('li');
        li.innerText = file.name;
        list.appendChild(li);
    });
});

/* UI Controller - Enhanced UX */

// Helper to format file size
const formatSize = (bytes) => {
    if(bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Render File Cards
const renderFileCards = (files, containerId, type) => {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous

    Array.from(files).forEach((file, index) => {
        const div = document.createElement('div');
        div.className = `file-card ${type}`; // 'pdf' or 'img'
        
        // Icon based on type
        const icon = type === 'pdf' ? '📄' : '🖼';
        
        div.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="name">${file.name}</span>
            <span class="size">${formatSize(file.size)}</span>
        `;
        container.appendChild(div);
    });
};

// --- EVENT LISTENERS FOR FILE INPUTS ---

// 1. Merge Input
document.getElementById('mergeInput').addEventListener('change', (e) => {
    renderFileCards(e.target.files, 'mergeList', 'pdf');
});

// 2. Split Input
document.getElementById('splitInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const container = document.getElementById('splitFileDisplay');
    if (file) {
        container.innerHTML = `
            <div class="file-card pdf" style="width: 100%; display: flex; align-items: center; gap: 10px; justify-content: center;">
                <span class="icon">📄</span>
                <div>
                    <span class="name" style="font-size: 14px;">${file.name}</span>
                    <span class="size">${formatSize(file.size)}</span>
                </div>
            </div>
        `;
    }
});

// 3. PDF to Img Input
document.getElementById('p2iInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    // Re-use the split display logic or create a new one
    const label = document.getElementById('p2iLabel');
    if(file) label.innerText = `Selected: ${file.name}`; // Simple fallback for this one
});

// 4. Img to PDF Input
document.getElementById('i2pInput').addEventListener('change', (e) => {
    renderFileCards(e.target.files, 'i2pList', 'img');
});