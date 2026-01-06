# Contributing to NuraPDF

First off, thanks for taking the time to contribute! 🎉

NuraPDF aims to be the best **local-first, dependency-free** PDF tool suite. We value code that is clean, efficient, and respects the "No System Binaries" rule.

## 🛠️ Development Setup

1.  **Fork the repo** and clone it locally.
2.  **Backend:**
    * Navigate to `backend/`.
    * Install requirements: `pip install -r requirements.txt`.
    * Run the server: `python main.py`.
3.  **Frontend:**
    * Open `frontend/index.html` in your browser.
    * We recommend using the **Live Server** extension for VS Code for auto-reloading.

## 📐 Coding Guidelines

### General
* **No Heavy Binaries:** Do not add libraries that require installing software (like Poppler, Ghostscript, or ImageMagick) on the host machine. We stick to `pip` and `npm/cdn` only.
* **Responsive UI:** Any UI changes must look good on both Desktop and Mobile. Test your changes by resizing the browser window.

### Backend (Python)
* Use type hints where possible.
* Keep the `main.py` clean. If adding a large feature, consider creating a module.
* Ensure `TEMP_DIR` files are cleaned up after processing using `BackgroundTasks`.

### Frontend (JS/CSS)
* Use Vanilla JavaScript (ES6+). No React/Vue/Angular (we keep it lightweight).
* Follow the "Midnight Pro" theme variables in `style.css`.
* Use `Swal.fire` (SweetAlert2) for user feedback, not `alert()`.

## 📥 Submitting a Pull Request

1.  Create a new branch: `git checkout -b feature/AmazingFeature`.
2.  Commit your changes: `git commit -m 'Add some AmazingFeature'`.
3.  Push to the branch: `git push origin feature/AmazingFeature`.
4.  Open a Pull Request on GitHub.

## 🐛 Reporting Bugs

If you find a bug, please open an issue describing:
1.  What you tried to do.
2.  What happened (Screenshots help!).
3.  Any error messages from the Browser Console (F12) or Python Terminal.

Happy Coding! 🚀