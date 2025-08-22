#!/usr/bin/env python3
"""
Simple script to run the ML training pipeline
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from training_pipeline import main

if __name__ == "__main__":
    print("🚀 Starting AI Model Training...")
    main()
