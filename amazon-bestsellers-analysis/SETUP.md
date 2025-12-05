# Setup Instructions

## Quick Start

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the analysis:**
```bash
python scripts/data_analysis.py
```

3. **Or use Jupyter Notebook:**
```bash
jupyter notebook notebooks/01_comprehensive_analysis.ipynb
```

## Alternative: Using Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Run analysis
python scripts/data_analysis.py
```

## Expected Outputs

After running the analysis, you'll find:

- **Visualizations** in `outputs/` directory:
  - Price distribution
  - Rating distribution
  - Price vs Rating scatter plot
  - Format analysis
  - Author rankings
  - And more...

- **Research Report** in `reports/analysis_report.txt`

## Troubleshooting

If you encounter import errors:
1. Make sure all packages are installed: `pip install -r requirements.txt`
2. Check Python version (3.8+ recommended)
3. For matplotlib issues, try: `pip install --upgrade matplotlib`



