import sys
import os

# Add parent directory (frontend root) to sys.path to resolve the copied 'app' module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
