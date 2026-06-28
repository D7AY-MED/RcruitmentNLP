@echo off
REM ============================================================
REM  runall.bat - launches backend (FastAPI) and frontend (Vite)
REM  Backend:  http://localhost:8000
REM  Frontend: http://localhost:5173
REM ============================================================
setlocal
set "ROOT=%~dp0"

echo ============================================================
echo  Starting xQuesty Link
echo ============================================================

REM ---------- Backend ----------
echo [backend] Preparing virtual environment...
pushd "%ROOT%backend"
if not exist ".venv\Scripts\python.exe" (
    echo [backend] Creating venv and installing requirements...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)
popd

echo [backend] Launching uvicorn on http://localhost:8000 ...
start "backend" cmd /k "cd /d "%ROOT%backend" && call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

REM ---------- Frontend ----------
echo [frontend] Installing npm dependencies (if needed)...
pushd "%ROOT%frontend"
if not exist "node_modules" (
    call npm install
)
popd

echo [frontend] Launching Vite dev server on http://localhost:5173 ...
start "frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo ============================================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Two windows opened. Close them to stop the servers.
echo ============================================================
endlocal
