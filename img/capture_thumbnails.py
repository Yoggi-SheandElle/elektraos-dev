"""Capture thumbnails from generate-thumbnails.html using Edge headless."""
import time
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from pathlib import Path

OUT = Path(__file__).parent
URL = "http://localhost:8765/generate-thumbnails.html"

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--window-size=1400,5000")
opts.add_argument("--force-device-scale-factor=2")  # 2x for retina quality
opts.add_argument("--disable-gpu")

driver = webdriver.Edge(options=opts)
driver.get(URL)
time.sleep(3)  # Wait for fonts to load

elements = {
    "og-image": "og-share.png",
    "about-hero": "about-hero.png",
    "case-elektraos": "case-elektraos.png",
    "case-ayla": "case-ayla.png",
    "case-thumbnail": "case-thumbnail-pipeline.png",
    "case-sheandelle": "case-sheandelle.png",
    "case-40thbrick": "case-40th-brick.png",
    "case-mealshift": "case-mealshift.png",
}

for elem_id, filename in elements.items():
    el = driver.find_element(By.ID, elem_id)
    out_path = OUT / filename
    el.screenshot(str(out_path))
    print(f"Captured {filename} ({out_path.stat().st_size // 1024}KB)")

driver.quit()
print("\nAll thumbnails captured!")
