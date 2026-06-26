import sys
import os

# Add backend directory to sys.path to resolve 'app' imports correctly
# __file__ resolves to frontend/api/index.py
repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
backend_path = os.path.join(repo_root, 'backend')
sys.path.insert(0, backend_path)

from app.main import app
