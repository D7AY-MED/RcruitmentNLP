import sys
import os

# Add the parent directory of this file to sys.path to ensure 'app' imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
