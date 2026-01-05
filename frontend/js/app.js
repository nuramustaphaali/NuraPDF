/* NuraPDF - Core Engine v2 (Fixed Export + Extended Tools) */

// --- STATE MANAGEMENT ---
const AppState = {
    pdfDoc: null,
    fileBuffer: null,      // FIXED: Stores raw file for export
    pages: [],             
    pageEdits: {},         
    currentPageIndex: 0,   
    scale: 1.0,            
    fabricCanvas: null,    
    isDrawing: false,
    isRendering: false,
    // Default Styles
    activeColor: '#ff0000',
    activeWidth: 3,
    activeFontSize: 20
};

// --- DOM ELEMENTS ---
const els = {
    fileInput: document.getElementById('fileInput'),
    pdfCanvas: document.getElementById('the-canvas'),
    fabricCanvasEl: document.getElementById('fabric-canvas'),
    canvasWrapper: document.getElementById('canvas-wrapper'),
    thumbs: document.getElementById('thumbnailContainer'),
    zoomLevel: document.getElementById('zoomLevel'),
};

// --- INITIALIZATION ---

function initFabric() {
    if (AppState.fabricCanvas) return;
    
    AppState.fabricCanvas = new fabric.Canvas('fabric-canvas', {
        selection: true,
        preserveObjectStacking: true
    });

    // Auto-save listeners
    AppState.fabricCanvas.on('object:modified', saveCurrentPageState);
    AppState.fabricCanvas.on('object:added', saveCurrentPageState);
    AppState.fabricCanvas.on('path:created', saveCurrentPageState);
    
    // Sync styles when an object is selected
    AppState.fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected[0];
        if (obj) {
            // Update UI pickers to match selected object (Optional polish)
        }
    });
}

// REPLACE THIS ENTIRE EVENT LISTENER IN APP.JS
els.fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if(window.UI) UI.switchView('editor');

    try {
        // 1. Get the raw file data
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = await file.arrayBuffer();
        
        // 2. CLONE it securely for the Exporter (Fixes "Detached ArrayBuffer" error)
        AppState.fileBuffer = originalBuffer.slice(0); 
        
        // 3. Give the original to PDF.js (It might consume/detach this one, which is now fine)
        const loadingTask = pdfjsLib.getDocument(originalBuffer);
        
        AppState.pdfDoc = await loadingTask.promise;
        
        // Reset State
        AppState.pages = [];
        AppState.pageEdits = {};
        for (let i = 1; i <= AppState.pdfDoc.numPages; i++) {
            AppState.pages.push({ originalIndex: i, rotation: 0 });
        }
        AppState.currentPageIndex = 0;
        
        initFabric();
        renderApp();
        
    } catch (err) {
        console.error("Error loading PDF:", err);
        alert("Error loading PDF. Check console for details.");
    }
});

// --- RENDERING ---

async function renderApp() {
    renderThumbnailSidebar();
    await renderMainView();
}

async function renderMainView() {
    if (AppState.isRendering) return;
    AppState.isRendering = true;

    const activePageData = AppState.pages[AppState.currentPageIndex];
    const page = await AppState.pdfDoc.getPage(activePageData.originalIndex);

    const totalRotation = (page.rotate + activePageData.rotation) % 360;
    const viewport = page.getViewport({ scale: AppState.scale, rotation: totalRotation });

    els.pdfCanvas.height = viewport.height;
    els.pdfCanvas.width = viewport.width;

    const renderContext = {
        canvasContext: els.pdfCanvas.getContext('2d'),
        viewport: viewport
    };
    await page.render(renderContext).promise;

    els.canvasWrapper.style.width = `${viewport.width}px`;
    els.canvasWrapper.style.height = `${viewport.height}px`;

    AppState.fabricCanvas.setWidth(viewport.width);
    AppState.fabricCanvas.setHeight(viewport.height);
    AppState.fabricCanvas.setDimensions({ width: viewport.width, height: viewport.height });

    AppState.fabricCanvas.clear();
    const savedState = AppState.pageEdits[AppState.currentPageIndex];
    
    if (savedState) {
        AppState.fabricCanvas.loadFromJSON(savedState, () => {
            if (AppState.isDrawing) {
                // Restore drawing brush if mode was active
                AppState.fabricCanvas.isDrawingMode = true;
                updateBrush();
            }
            AppState.fabricCanvas.renderAll();
        });
    }

    els.zoomLevel.innerText = `${Math.round(AppState.scale * 100)}%`;
    AppState.isRendering = false;
}

// --- THUMBNAILS & NAV ---

async function renderThumbnailSidebar() {
    els.thumbs.innerHTML = ''; 
    AppState.pages.forEach((pageData, index) => {
        const div = document.createElement('div');
        div.className = `thumbnail ${index === AppState.currentPageIndex ? 'active' : ''}`;
        div.onclick = () => changePage(index);
        const num = document.createElement('div');
        num.className = 'page-num';
        num.innerText = `Page ${index + 1}`;
        div.appendChild(num);
        els.thumbs.appendChild(div);
        generateThumbCanvas(pageData, div);
    });
}

async function generateThumbCanvas(pageData, container) {
    const page = await AppState.pdfDoc.getPage(pageData.originalIndex);
    const totalRotation = (page.rotate + pageData.rotation) % 360;
    const viewport = page.getViewport({ scale: 0.2, rotation: totalRotation }); 
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    container.prepend(canvas);
}

function changePage(newIndex) {
    if (newIndex === AppState.currentPageIndex) return;
    saveCurrentPageState();
    AppState.currentPageIndex = newIndex;
    renderApp();
}

function saveCurrentPageState() {
    if (!AppState.fabricCanvas) return;
    const json = AppState.fabricCanvas.toJSON();
    AppState.pageEdits[AppState.currentPageIndex] = json;
}

// --- EXTENDED TOOLS ---

function updateBrush() {
    if (!AppState.fabricCanvas) return;
    AppState.fabricCanvas.freeDrawingBrush.width = parseInt(AppState.activeWidth, 10);
    AppState.fabricCanvas.freeDrawingBrush.color = AppState.activeColor;
}

const Tools = {
    disableDraw: () => {
        AppState.isDrawing = false;
        AppState.fabricCanvas.isDrawingMode = false;
    },

    // 1. Text
    addText: () => {
        Tools.disableDraw();
        const text = new fabric.IText('Type Here', {
            left: 50, top: 50,
            fontFamily: 'Arial',
            fill: AppState.activeColor,
            fontSize: parseInt(AppState.activeFontSize, 10)
        });
        AppState.fabricCanvas.add(text);
        AppState.fabricCanvas.setActiveObject(text);
    },

    // 2. Highlight (Transparent Rect)
    addHighlight: () => {
        Tools.disableDraw();
        const rect = new fabric.Rect({
            left: 100, top: 100, width: 200, height: 30,
            fill: 'purple', opacity: 0.4,
            selectable: true
        });
        AppState.fabricCanvas.add(rect);
    },

    // 3. Arrow
    addArrow: () => {
        Tools.disableDraw();
        // Fabric doesn't have a native Arrow, we draw a path
        const triangle = new fabric.Triangle({
            width: 15, height: 15, fill: AppState.activeColor, left: 235, top: 65, angle: 90
        });
        const line = new fabric.Line([50, 100, 200, 100], {
            stroke: AppState.activeColor, strokeWidth: parseInt(AppState.activeWidth, 10)
        });
        
        const group = new fabric.Group([line, triangle], {
            left: 100, top: 100
        });
        // Note: Simple arrow implementation.
        AppState.fabricCanvas.add(group);
    },

    // 4. Rectangle
    addRect: () => {
        Tools.disableDraw();
        const rect = new fabric.Rect({
            left: 100, top: 100, width: 100, height: 100,
            fill: 'transparent', 
            stroke: AppState.activeColor, 
            strokeWidth: parseInt(AppState.activeWidth, 10)
        });
        AppState.fabricCanvas.add(rect);
    },

    // 5. Circle
    addCircle: () => {
        Tools.disableDraw();
        const circle = new fabric.Circle({
            left: 100, top: 100, radius: 50,
            fill: 'transparent', 
            stroke: AppState.activeColor, 
            strokeWidth: parseInt(AppState.activeWidth, 10)
        });
        AppState.fabricCanvas.add(circle);
    },

    // 6. Freehand
    toggleDraw: () => {
        AppState.isDrawing = !AppState.isDrawing;
        AppState.fabricCanvas.isDrawingMode = AppState.isDrawing;
        if (AppState.isDrawing) updateBrush();
    },

    // 7. Image
    addImage: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                    img.scaleToWidth(200);
                    AppState.fabricCanvas.add(img);
                    saveCurrentPageState();
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    // Add this inside the Tools object in app.js
    addEraser: () => {
        Tools.disableDraw();
        // Create a White Rectangle (Visual Eraser)
        const rect = new fabric.Rect({
            left: 100, top: 100, width: 300, height: 50,
            fill: '#ffffff', // White to match paper
            stroke: 'transparent',
            selectable: true
        });
        AppState.fabricCanvas.add(rect);
        AppState.fabricCanvas.setActiveObject(rect);
        saveCurrentPageState();
    },

    // 8. Style Updater (Color, Width, Font)
    updateStyle: (type, value) => {
        if (type === 'color') AppState.activeColor = value;
        if (type === 'width') AppState.activeWidth = parseInt(value, 10);
        if (type === 'fontSize') AppState.activeFontSize = parseInt(value, 10);

        // Update active object if one is selected
        const active = AppState.fabricCanvas.getActiveObject();
        if (active) {
            if (type === 'color') {
                if (active.type === 'i-text') active.set({ fill: value });
                else active.set({ stroke: value });
            }
            if (type === 'width' && active.type !== 'i-text') {
                active.set({ strokeWidth: parseInt(value, 10) });
            }
            if (type === 'fontSize' && active.type === 'i-text') {
                active.set({ fontSize: parseInt(value, 10) });
            }
            AppState.fabricCanvas.renderAll();
            saveCurrentPageState();
        }
        
        // Update brush if drawing
        if (AppState.isDrawing) updateBrush();
    },

    deleteSelected: () => {
        const activeObj = AppState.fabricCanvas.getActiveObject();
        if (activeObj) {
            AppState.fabricCanvas.remove(activeObj);
            saveCurrentPageState();
        }
    }
};

// Global Events
document.getElementById('zoomIn').onclick = () => { AppState.scale += 0.25; renderMainView(); };
document.getElementById('zoomOut').onclick = () => { if(AppState.scale > 0.5) AppState.scale -= 0.25; renderMainView(); };
document.getElementById('rotateLeft').onclick = () => { saveCurrentPageState(); AppState.pages[AppState.currentPageIndex].rotation -= 90; renderApp(); };
document.getElementById('rotateRight').onclick = () => { saveCurrentPageState(); AppState.pages[AppState.currentPageIndex].rotation += 90; renderApp(); };
document.getElementById('deletePage').onclick = () => {
    if (AppState.pages.length <= 1) return alert("Cannot delete last page.");
    AppState.pages.splice(AppState.currentPageIndex, 1);
    delete AppState.pageEdits[AppState.currentPageIndex];
    if (AppState.currentPageIndex >= AppState.pages.length) AppState.currentPageIndex = Math.max(0, AppState.pages.length - 1);
    renderApp();
};

window.Tools = Tools;