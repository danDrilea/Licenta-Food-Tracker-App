"""
Create a 2-page collage of the 10 test photo results.
Each row: combo image (left) | YOLO-annotated image (right)
Page 1: photos 1-5, Page 2: photos 6-10.
All rows normalized to the same height for consistency.
"""

import os
from PIL import Image, ImageDraw, ImageFont

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPTS_DIR)
RUN_DIR = os.path.join(BASE_DIR, "runs", "predict", "run")

# The 10 test photos in order (just stems, extensions auto-detected)
TEST_PHOTOS = [
    "chicken_1",
    "bread_2",
    "banana_3",
    "tomato_4",
    "broccoli_5",
    "pasta_6",
    "egg_7",
    "apple_8",
    "cake_9",
    "carrot_10",
]

# Romanian names with diacritics for thesis labels
ROMANIAN_NAMES = {
    "chicken_1":  "Pui",
    "bread_2":    "Pâine",
    "banana_3":   "Banană",
    "tomato_4":   "Roșii",
    "broccoli_5": "Broccoli",
    "pasta_6":    "Paste",
    "egg_7":      "Ou",
    "apple_8":    "Măr",
    "cake_9":     "Prăjitură",
    "carrot_10":  "Morcov",
}

ROW_HEIGHT = 400    # normalized height for each row (px)
PADDING = 20        # px between images and edges
GAP = 40            # px gap between combo and yolo in a row
LABEL_HEIGHT = 55   # px for the label above each row
BG_COLOR = (255, 255, 255)

EXTENSIONS = [".jpg", ".jpeg", ".png"]


def find_file(directory, stem, suffix=""):
    """Find a file matching stem+suffix with any image extension."""
    for ext in EXTENSIONS:
        path = os.path.join(directory, f"{stem}{suffix}{ext}")
        if os.path.isfile(path):
            return path
    raise FileNotFoundError(f"No file found for {stem}{suffix} in {directory}")


def load_pair(stem):
    """Load the combo and YOLO-annotated images for a given food."""
    combo_path = find_file(RUN_DIR, stem, "_combo")
    yolo_path = find_file(RUN_DIR, stem)

    combo = Image.open(combo_path)
    yolo = Image.open(yolo_path)

    print(f"  Loaded: {os.path.basename(combo_path)} ({combo.width}x{combo.height}) + "
          f"{os.path.basename(yolo_path)} ({yolo.width}x{yolo.height})")
    return combo, yolo


def resize_to_height(img, target_height):
    """Resize an image to a target height, preserving aspect ratio."""
    scale = target_height / img.height
    new_width = int(img.width * scale)
    return img.resize((new_width, target_height), Image.LANCZOS)


def make_page(photos, page_num):
    """Create a collage page with normalized row heights."""
    rows = []

    for stem in photos:
        combo, yolo = load_pair(stem)

        # Resize both to ROW_HEIGHT
        combo_resized = resize_to_height(combo, ROW_HEIGHT)
        yolo_resized = resize_to_height(yolo, ROW_HEIGHT)

        rows.append((stem, combo_resized, yolo_resized))

    # Calculate page dimensions
    # Each row: [PADDING] [combo] [GAP] [yolo] [PADDING]
    total_width = 0
    for _, combo, yolo in rows:
        row_w = PADDING + combo.width + GAP + yolo.width + PADDING
        total_width = max(total_width, row_w)

    total_height = PADDING  # top padding
    for _ in rows:
        total_height += LABEL_HEIGHT + ROW_HEIGHT + PADDING

    # Create the page
    page = Image.new("RGB", (total_width, total_height), BG_COLOR)
    draw = ImageDraw.Draw(page)

    # Try to load a font (larger, with Unicode/diacritics support)
    try:
        font = ImageFont.truetype("arialbd.ttf", 36)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("arial.ttf", 36)
        except (OSError, IOError):
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
            except (OSError, IOError):
                font = ImageFont.load_default()

    y = PADDING

    for stem, combo, yolo in rows:
        # Draw label in Romanian
        label = ROMANIAN_NAMES.get(stem, stem.replace('_', ' ').title())
        draw.text((PADDING, y + 5), label, fill=(60, 60, 60), font=font)
        y += LABEL_HEIGHT

        # Separator line
        draw.line([(PADDING, y - 3), (total_width - PADDING, y - 3)],
                  fill=(210, 210, 210), width=1)

        # Paste combo (left)
        page.paste(combo, (PADDING, y))

        # Paste YOLO-annotated (right)
        yolo_x = PADDING + combo.width + GAP
        page.paste(yolo, (yolo_x, y))

        y += ROW_HEIGHT + PADDING

    # Save
    out_path = os.path.join(BASE_DIR, f"thesis_results_collage_page{page_num}.jpg")
    page.save(out_path, quality=95)
    print(f"Saved page {page_num} -> {out_path}  ({page.width}x{page.height})")
    return out_path


def main():
    p1 = make_page(TEST_PHOTOS[:5], 1)
    p2 = make_page(TEST_PHOTOS[5:], 2)
    print(f"\nDone! Collages saved to:\n  {p1}\n  {p2}")


if __name__ == "__main__":
    main()
