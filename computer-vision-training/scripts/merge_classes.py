"""
Dataset Class Cleanup Script for FoodInsSeg
============================================
Removes Asian-specific / uncommon food classes, merges similar ones,
and reindexes all remaining class IDs to be contiguous (0..N-1).

This modifies label files IN PLACE after creating a backup.

Changes:
  - REMOVE 22 classes (Asian cuisine, tiny samples, confusing labels)
  - MERGE 8 classes into existing ones (mushrooms, berries, etc.)
  - RENAME 3 classes (chicken duck→chicken, hamburg→hamburger, celery stick→celery)
  - Result: 103 → 73 classes
"""

import os
import shutil
from collections import Counter

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
LABELS_TRAIN = os.path.join(BASE_DIR, "FoodInsSeg", "labels", "train")
LABELS_TEST = os.path.join(BASE_DIR, "FoodInsSeg", "labels", "test")
BACKUP_DIR = os.path.join(BASE_DIR, "FoodInsSeg", "labels_backup_original")

# ── Classes to REMOVE (old IDs) ───────────────────────────────────────────────
REMOVE_IDS = {
    1,   # egg tart (16 instances)
    6,   # pudding (5 instances)
    15,  # tea (27 instances)
    17,  # red beans (258 instances)
    20,  # soy (418 instances)
    25,  # date (37 instances)
    38,  # fig (121 instances)
    50,  # lamb (326 instances)
    61,  # hanamaki baozi (84 instances)
    62,  # wonton dumplings (95 instances)
    67,  # tofu (308 instances)
    73,  # kelp (2 instances!)
    74,  # seaweed (18 instances)
    76,  # rape / rapeseed greens (216 instances)
    77,  # ginger (30 instances)
    78,  # okra (243 instances)
    82,  # white radish / daikon (168 instances)
    85,  # bamboo shoots (17 instances)
    88,  # cilantro mint (1991 - confusing dual label)
    89,  # snow peas (402 instances)
    91,  # bean sprouts (227 instances)
    102, # other ingredients (656 - junk catch-all)
}

# ── Classes to MERGE (old_id → target_old_id) ────────────────────────────────
MERGE_MAP = {
    32: 31,   # raspberry → blueberry (renamed "berries")
    64: 63,   # noodles → pasta
    75: 92,   # spring onion → onion
    95: 94,   # French beans → green beans
    96: 100,  # king oyster mushroom → mushroom
    97: 100,  # shiitake → mushroom
    98: 100,  # enoki mushroom → mushroom
    99: 100,  # oyster mushroom → mushroom
}

# ── Build the reindex map ─────────────────────────────────────────────────────
# Surviving old IDs = all IDs not removed and not merged away
SURVIVING_OLD_IDS = sorted(
    set(range(103)) - REMOVE_IDS - set(MERGE_MAP.keys())
)
# Map each surviving old ID to a new contiguous ID
REINDEX_MAP = {old_id: new_id for new_id, old_id in enumerate(SURVIVING_OLD_IDS)}

# ── New class names (new_id → name) ──────────────────────────────────────────
ORIGINAL_NAMES = {
    0: "candy", 1: "egg tart", 2: "french fries", 3: "chocolate",
    4: "biscuit", 5: "popcorn", 6: "pudding", 7: "ice cream",
    8: "cheese butter", 9: "cake", 10: "wine", 11: "milkshake",
    12: "coffee", 13: "juice", 14: "milk", 15: "tea", 16: "almond",
    17: "red beans", 18: "cashew", 19: "dried cranberries", 20: "soy",
    21: "walnut", 22: "peanut", 23: "egg", 24: "apple", 25: "date",
    26: "apricot", 27: "avocado", 28: "banana", 29: "strawberry",
    30: "cherry", 31: "blueberry", 32: "raspberry", 33: "mango",
    34: "olives", 35: "peach", 36: "lemon", 37: "pear", 38: "fig",
    39: "pineapple", 40: "grape", 41: "kiwi", 42: "melon", 43: "orange",
    44: "watermelon", 45: "steak", 46: "pork", 47: "chicken duck",
    48: "sausage", 49: "fried meat", 50: "lamb", 51: "sauce", 52: "crab",
    53: "fish", 54: "shellfish", 55: "shrimp", 56: "soup", 57: "bread",
    58: "corn", 59: "hamburg", 60: "pizza", 61: "hanamaki baozi",
    62: "wonton dumplings", 63: "pasta", 64: "noodles", 65: "rice",
    66: "pie", 67: "tofu", 68: "eggplant", 69: "potato", 70: "garlic",
    71: "cauliflower", 72: "tomato", 73: "kelp", 74: "seaweed",
    75: "spring onion", 76: "rape", 77: "ginger", 78: "okra",
    79: "lettuce", 80: "pumpkin", 81: "cucumber", 82: "white radish",
    83: "carrot", 84: "asparagus", 85: "bamboo shoots", 86: "broccoli",
    87: "celery stick", 88: "cilantro mint", 89: "snow peas",
    90: "cabbage", 91: "bean sprouts", 92: "onion", 93: "pepper",
    94: "green beans", 95: "French beans", 96: "king oyster mushroom",
    97: "shiitake", 98: "enoki mushroom", 99: "oyster mushroom",
    100: "white button mushroom", 101: "salad", 102: "other ingredients",
}

# Renamed classes
RENAMES = {
    31: "berries",       # blueberry + raspberry merged
    47: "chicken",       # was "chicken duck"
    59: "hamburger",     # was "hamburg"
    63: "pasta",         # noodles merged in
    87: "celery",        # was "celery stick"
    92: "onion",         # spring onion merged in
    94: "green beans",   # French beans merged in
    100: "mushroom",     # all mushroom types merged
}

def get_new_name(old_id):
    """Get the display name for a surviving old ID."""
    if old_id in RENAMES:
        return RENAMES[old_id]
    return ORIGINAL_NAMES[old_id]

NEW_CLASS_NAMES = {
    REINDEX_MAP[old_id]: get_new_name(old_id)
    for old_id in SURVIVING_OLD_IDS
}


def process_line(line):
    """
    Process a single label line.
    Returns the modified line, or None if the class should be removed.
    Format: <class_id> <x1> <y1> <x2> <y2> ... (polygon coords)
    """
    parts = line.strip().split()
    if len(parts) < 2:
        return None

    old_id = int(parts[0])

    # Remove?
    if old_id in REMOVE_IDS:
        return None

    # Merge?
    if old_id in MERGE_MAP:
        old_id = MERGE_MAP[old_id]

    # Reindex
    if old_id not in REINDEX_MAP:
        print(f"  WARNING: Unexpected class ID {old_id} — skipping")
        return None

    new_id = REINDEX_MAP[old_id]
    parts[0] = str(new_id)
    return " ".join(parts)


def process_directory(label_dir, split_name):
    """Process all label files in a directory."""
    files = [f for f in os.listdir(label_dir) if f.endswith(".txt")]
    print(f"\n{'='*60}")
    print(f"Processing {split_name}: {len(files)} label files")
    print(f"{'='*60}")

    before_counts = Counter()
    after_counts = Counter()
    total_removed = 0
    total_merged = 0
    total_kept = 0
    empty_files = 0

    for filename in files:
        filepath = os.path.join(label_dir, filename)
        with open(filepath, "r") as f:
            lines = f.readlines()

        new_lines = []
        for line in lines:
            parts = line.strip().split()
            if len(parts) < 2:
                continue
            old_id = int(parts[0])
            before_counts[old_id] += 1

            if old_id in REMOVE_IDS:
                total_removed += 1
                continue
            elif old_id in MERGE_MAP:
                total_merged += 1

            result = process_line(line)
            if result is not None:
                new_id = int(result.split()[0])
                after_counts[new_id] += 1
                new_lines.append(result + "\n")
                total_kept += 1

        if len(new_lines) == 0:
            empty_files += 1

        with open(filepath, "w") as f:
            f.writelines(new_lines)

    print(f"  Lines before:  {sum(before_counts.values()):,}")
    print(f"  Lines removed: {total_removed:,}")
    print(f"  Lines merged:  {total_merged:,}")
    print(f"  Lines after:   {total_kept:,}")
    print(f"  Empty files:   {empty_files} (images with no remaining labels)")
    print(f"  Unique classes before: {len(before_counts)}")
    print(f"  Unique classes after:  {len(after_counts)}")

    return before_counts, after_counts


def backup_labels():
    """Create a backup of original label files."""
    if os.path.exists(BACKUP_DIR):
        print(f"Backup already exists at {BACKUP_DIR} — skipping backup")
        return

    print(f"Creating backup at {BACKUP_DIR}")
    os.makedirs(BACKUP_DIR, exist_ok=True)

    for split in ["train", "test"]:
        src = os.path.join(BASE_DIR, "FoodInsSeg", "labels", split)
        dst = os.path.join(BACKUP_DIR, split)
        if os.path.exists(src):
            shutil.copytree(src, dst)
            file_count = len([f for f in os.listdir(dst) if f.endswith(".txt")])
            print(f"  Backed up {split}: {file_count} files")

    print("Backup complete!")


def main():
    print("FoodInsSeg Class Cleanup")
    print("=" * 60)
    print(f"Removing {len(REMOVE_IDS)} classes")
    print(f"Merging {len(MERGE_MAP)} classes")
    print(f"Final class count: {len(NEW_CLASS_NAMES)}")
    print()

    # Print the new class list
    print("New class list:")
    for new_id in sorted(NEW_CLASS_NAMES.keys()):
        print(f"  {new_id:3d}: {NEW_CLASS_NAMES[new_id]}")
    print()

    # Backup
    backup_labels()

    # Process
    process_directory(LABELS_TRAIN, "TRAIN")
    process_directory(LABELS_TEST, "TEST")

    print(f"\n{'='*60}")
    print("DONE! Labels updated successfully.")
    print(f"Original labels backed up to: {BACKUP_DIR}")
    print(f"Total classes: {len(NEW_CLASS_NAMES)}")
    print("Next step: Use food_v2.yaml for training")


if __name__ == "__main__":
    main()
