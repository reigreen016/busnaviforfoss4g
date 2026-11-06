"""Copy the static site into the GitHub Pages publishing folder."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
destination = root / 'docs'
destination.mkdir(exist_ok=True)
for name in ['index.html', 'style.css', 'app.js', 'schedule.js', 'overview.js', 'i18n.js', 'realtime.js', 'presentation.js', 'walking.js', 'station-map-v2.webp']:
    shutil.copy2(root / name, destination / name)
for name in ['assets', 'data']:
    shutil.copytree(root / name, destination / name, dirs_exist_ok=True)
(destination / '.nojekyll').touch()
print('GitHub Pages files ready in docs/')
