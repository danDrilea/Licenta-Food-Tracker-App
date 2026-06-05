import os
import sys
import math

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPTS_DIR)
WEIGHTS = os.path.join(BASE_DIR, "runs", "FoodInsSeg_L_v2", "weights", "best.pt")
SAVE_DIR = os.path.join(BASE_DIR, "runs", "predict")

# v2 — 73 classes (cleaned dataset, removed Asian/uncommon, merged similar)
CLASS_NAMES = [
    "candy", "french fries", "chocolate", "biscuit", "popcorn",
    "ice cream", "cheese butter", "cake", "wine", "milkshake",
    "coffee", "juice", "milk", "almond", "cashew",
    "dried cranberries", "walnut", "peanut", "egg", "apple",
    "apricot", "avocado", "banana", "strawberry", "cherry",
    "berries", "mango", "olives", "peach", "lemon",
    "pear", "pineapple", "grape", "kiwi", "melon",
    "orange", "watermelon", "steak", "pork", "chicken",
    "sausage", "fried meat", "sauce", "crab", "fish",
    "shellfish", "shrimp", "soup", "bread", "corn",
    "hamburger", "pizza", "pasta", "rice", "pie",
    "eggplant", "potato", "garlic", "cauliflower", "tomato",
    "lettuce", "pumpkin", "cucumber", "carrot", "asparagus",
    "broccoli", "celery", "cabbage", "onion", "pepper",
    "green beans", "mushroom", "salad",
]

# Average density (g/cm³) for each of the 73 food classes.
# Used to convert estimated volume (cm³) into mass (grams).
# Primary source: density_DB_v2_0_final (USDA FoodData Central, UK 6th Ed, S&W).
# Classes without a direct match (marked *) use standard food science estimates.
DENSITY = {
    "candy": 1.20,               # * hard candy / gummy avg
    "french fries": 0.90,        # * fried potato strips, substance density
    "chocolate": 1.056,          # density_DB_v2: chocolate
    "biscuit": 0.45,             # * dry baked goods, loose
    "popcorn": 0.04,             # * popped corn, very low bulk density
    "ice cream": 0.568,          # density_DB_v2: ice cream (6 entries avg)
    "cheese butter": 1.05,       # * composite cheese/butter
    "cake": 0.809,               # density_DB_v2: cake (3 entries avg)
    "wine": 0.996,               # density_DB_v2: wine (31 entries avg)
    "milkshake": 1.05,           # * similar to milk-based drinks
    "coffee": 0.750,             # density_DB_v2: coffee (3 entries avg)
    "juice": 1.050,              # density_DB_v2: juice (14 entries avg)
    "milk": 0.877,               # density_DB_v2: milk (18 entries avg)
    "almond": 0.460,             # density_DB_v2: almond
    "cashew": 0.500,             # density_DB_v2: cashew
    "dried cranberries": 0.55,   # * dried fruit avg
    "walnut": 0.45,              # * tree nut avg, similar to almond
    "peanut": 0.793,             # density_DB_v2: peanut (4 entries avg)
    "egg": 0.640,                # density_DB_v2: egg (6 entries avg)
    "apple": 0.915,              # density_DB_v2: apple (6 entries avg)
    "apricot": 0.88,             # * stone fruit avg
    "avocado": 0.95,             # * whole avocado
    "banana": 1.067,             # density_DB_v2: banana (30 entries avg)
    "strawberry": 1.080,         # density_DB_v2: strawberry
    "cherry": 1.02,              # * stone fruit avg
    "berries": 0.62,             # * mixed berries avg
    "mango": 0.998,              # density_DB_v2: mango
    "olives": 0.650,             # density_DB_v2: olives
    "peach": 0.92,               # * stone fruit avg
    "lemon": 1.010,              # density_DB_v2: lemon (7 entries avg)
    "pear": 1.050,               # density_DB_v2: pear
    "pineapple": 0.88,           # * tropical fruit avg
    "grape": 1.056,              # density_DB_v2: grape (5 entries avg)
    "kiwi": 1.00,                # * similar to mango
    "melon": 0.92,               # * high water content fruit
    "orange": 1.037,             # density_DB_v2: orange (4 entries avg)
    "watermelon": 0.95,          # * high water content
    "steak": 1.05,               # * raw beef avg
    "pork": 0.808,               # density_DB_v2: pork (4 entries avg)
    "chicken": 0.879,            # density_DB_v2: chicken (3 entries avg)
    "sausage": 0.95,             # * ground meat in casing
    "fried meat": 0.90,          # * cooked meat avg
    "sauce": 0.815,              # density_DB_v2: sauce (3 entries avg)
    "crab": 0.85,                # * crustacean avg
    "fish": 1.02,                # * white fish avg
    "shellfish": 0.95,           # * mollusk avg
    "shrimp": 0.90,              # * crustacean avg
    "soup": 1.032,               # density_DB_v2: soup (10 entries avg)
    "bread": 0.344,              # density_DB_v2: bread (6 entries avg)
    "corn": 0.688,               # density_DB_v2: corn (32 entries avg)
    "hamburger": 1.038,          # density_DB_v2: hamburger
    "pizza": 0.65,               # * layered baked dough + toppings
    "pasta": 0.583,              # density_DB_v2: pasta (4 entries avg)
    "rice": 0.677,               # density_DB_v2: rice (20 entries avg)
    "pie": 0.120,                # density_DB_v2: pie (1 entry — crust-heavy)
    "eggplant": 0.825,           # density_DB_v2: eggplant
    "potato": 0.899,             # density_DB_v2: potato (36 entries avg)
    "garlic": 0.335,             # density_DB_v2: garlic (2 entries avg)
    "cauliflower": 0.450,        # density_DB_v2: cauliflower
    "tomato": 1.017,             # density_DB_v2: tomato
    "lettuce": 0.06,             # * leafy green, extremely low density
    "pumpkin": 0.70,             # * gourd avg
    "cucumber": 0.96,            # * high water content vegetable
    "carrot": 0.625,             # density_DB_v2: carrot (2 entries avg)
    "asparagus": 0.40,           # * low-density vegetable
    "broccoli": 0.950,           # density_DB_v2: broccoli
    "celery": 0.60,              # * fibrous vegetable
    "cabbage": 0.36,             # * leafy vegetable
    "onion": 0.538,              # density_DB_v2: onion (8 entries avg)
    "pepper": 0.450,             # density_DB_v2: pepper (2 entries avg)
    "green beans": 0.530,        # density_DB_v2: green beans
    "mushroom": 1.017,           # density_DB_v2: mushroom
    "salad": 0.680,              # density_DB_v2: salad (3 entries avg)
}

CONF = 0.25

# ── Geometric calibration constants ───────────────────────────────────────
# Pinhole camera model parameters for XY (horizontal) scale:
#   scene_width = 2 · d · tan(θ/2)
#   cm_per_pixel = scene_width / image_width_px
CAMERA_DISTANCE_CM = 35.0       # standard capture distance (arm's length above plate)
CAMERA_HFOV_DEG    = 75.0       # typical smartphone horizontal field of view (degrees)

# Empirical depth-to-height calibration factor.
# MiDaS outputs normalized relative inverse depth in [0, 1].
# K_DEPTH_CM converts a unit of normalized disparity difference into
# real-world centimeters of height at the standard capture distance.
# Chosen heuristically: the average non-overlapping food portion
# sits flat on a plate with an average max height of 10 cm.
K_DEPTH_CM = 10.0


def compute_cm_per_pixel(image_width_px):
    """Pinhole camera model: cm per pixel at CAMERA_DISTANCE_CM.

    At distance d with horizontal field-of-view θ:
        scene_width = 2 · d · tan(θ / 2)
        cm_per_pixel = scene_width / image_width_px
    """
    half_fov_rad = math.radians(CAMERA_HFOV_DEG / 2)
    scene_width_cm = 2 * CAMERA_DISTANCE_CM * math.tan(half_fov_rad)
    return scene_width_cm / image_width_px


def load_midas():
    """Load MiDaS v2.1 Small for monocular depth estimation."""
    import torch

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
    midas.to(device).eval()

    transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
    transform = transforms.small_transform

    return midas, transform, device


def estimate_depth(midas, transform, device, img_rgb):
    """Run MiDaS inference → normalized disparity map at original resolution.

    Returns a 2D numpy array in [0, 1] where higher values = closer to camera.
    """
    import torch
    import numpy as np

    input_batch = transform(img_rgb).to(device)

    with torch.no_grad():
        prediction = midas(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img_rgb.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    depth = prediction.cpu().numpy()

    # Normalize to [0, 1] (higher = closer to camera)
    depth = depth - depth.min()
    if depth.max() > 0:
        depth = depth / depth.max()

    return depth


def compute_baseline_depth(depth_map, binary_mask):
    """Compute D_base: median disparity along the boundary of the food mask.

    The boundary pixels sit on the plate/container surface, providing
    a robust estimate of the reference plane beneath the food.
    """
    import cv2
    import numpy as np

    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return float(np.median(depth_map))

    # Draw a thick contour band (3px) to sample the plate surface around the food
    boundary_mask = np.zeros_like(binary_mask)
    cv2.drawContours(boundary_mask, contours, -1, 1, thickness=3)

    boundary_depths = depth_map[boundary_mask == 1]
    if len(boundary_depths) == 0:
        return float(np.median(depth_map))

    return float(np.median(boundary_depths))


def compute_volume_cm3(depth_map, binary_mask, cm2_per_px, D_base):
    """Per-pixel Riemann sum for volumetric integration.

    For each pixel (x, y) inside the food mask:
        H(x, y) = max(0, D(x, y) - D_base)        [disparity height above plate]

    Volume index (unitless):
        V_idx = Σ H(x, y)   for all (x, y) where mask = 1

    Real volume:
        V_real = cm²_per_pixel × K_DEPTH_CM × V_idx
    """
    import numpy as np

    food_disparities = depth_map[binary_mask == 1]
    if len(food_disparities) == 0:
        return 0.0

    heights = np.maximum(0.0, food_disparities - D_base)
    V_idx = float(np.sum(heights))

    return cm2_per_px * K_DEPTH_CM * V_idx


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/predict.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.isfile(image_path):
        print(f"[ERROR] Image not found: {image_path}")
        sys.exit(1)

    if not os.path.isfile(WEIGHTS):
        print(f"[ERROR] Weights not found: {WEIGHTS}")
        sys.exit(1)

    import time
    t_start = time.time()

    from ultralytics import YOLO
    import cv2
    import numpy as np
    import random

    t_imports = time.time()

    # ── Step 1: YOLO segmentation ────────────────────────────────────────
    print("[1/3] Running YOLO segmentation...")
    t_yolo_start = time.time()
    model = YOLO(WEIGHTS)
    results = model.predict(
        source=image_path, conf=CONF, save=True, verbose=False,
        project=SAVE_DIR, name="run", exist_ok=True, agnostic_nms=True
    )
    t_yolo_end = time.time()

    result = results[0]
    original_img = result.orig_img.copy()
    h, w = original_img.shape[:2]
    img_rgb = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)

    # ── Pinhole XY calibration ───────────────────────────────────────────
    cm_per_px = compute_cm_per_pixel(w)
    cm2_per_px = cm_per_px ** 2
    print(f"  Pinhole model: d={CAMERA_DISTANCE_CM}cm, HFOV={CAMERA_HFOV_DEG}°")
    print(f"  Scale: 1 px = {cm_per_px:.4f} cm  |  1 px² = {cm2_per_px:.6f} cm²")
    print(f"  Depth calibration: K_DEPTH = {K_DEPTH_CM} cm/disparity-unit")

    # ── Step 2: MiDaS depth estimation ───────────────────────────────────
    print("[2/3] Running MiDaS depth estimation...")
    t_midas_start = time.time()
    midas, transform, device = load_midas()
    depth_map = estimate_depth(midas, transform, device, img_rgb)
    t_midas_end = time.time()

    # Save depth map visualization
    depth_vis = (depth_map * 255).astype(np.uint8)
    depth_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_MAGMA)

    os.makedirs(os.path.join(SAVE_DIR, "run"), exist_ok=True)
    base = os.path.basename(image_path)
    stem, ext = os.path.splitext(base)

    depth_path = os.path.join(SAVE_DIR, "run", f"{stem}_depth{ext}")
    cv2.imwrite(depth_path, depth_colored)
    print(f"  Saved depth map -> {depth_path}")

    # ── Step 3: Combine YOLO masks + depth → volume → mass ──────────────
    print("[3/3] Computing volumes and masses...")
    t_post_start = time.time()

    # Collect detections per class
    class_data = {}  # name -> { "binary_masks": [...] }

    if result.boxes is not None and result.masks is not None:
        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0].item())
            name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id)

            poly_xy = result.masks.xy[i]
            if len(poly_xy) == 0:
                continue

            binary = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(binary, [np.array(poly_xy, dtype=np.int32)], 1)

            if name not in class_data:
                class_data[name] = {"binary_masks": []}
            class_data[name]["binary_masks"].append(binary)

    if not class_data:
        print("\n[INFO] No food items detected.")
        return

    # Print individual detections
    print(f"\n  {'#':<4} {'CLASS':<16} {'AREA cm²':<12} {'VOL cm³':<12} {'MASS g':<12} {'DENSITY':<10}")
    print("  " + "-" * 70)

    class_totals = {}  # name -> { area, volume, mass, count }
    det_idx = 0

    random.seed(42)
    vis_img = original_img.copy()
    class_colors = {
        name: (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        for name in class_data
    }

    for name, data in class_data.items():
        color = class_colors[name]
        density = DENSITY.get(name, 0.80)  # fallback density

        for bm in data["binary_masks"]:
            det_idx += 1

            # Area (pinhole-calibrated)
            area_px = int(bm.sum())
            area_cm2 = area_px * cm2_per_px

            # D_base: median disparity on the boundary of THIS mask
            D_base = compute_baseline_depth(depth_map, bm)

            # Volume: per-pixel Riemann sum
            volume_cm3 = compute_volume_cm3(depth_map, bm, cm2_per_px, D_base)

            # Mass: V × ρ
            mass_g = volume_cm3 * density

            print(f"  {det_idx:<4} {name:<16} {area_cm2:<12.1f} {volume_cm3:<12.1f} {mass_g:<12.1f} {density:<10.2f}")

            # Accumulate
            if name not in class_totals:
                class_totals[name] = {"area_cm2": 0, "volume_cm3": 0, "mass_g": 0, "count": 0}
            class_totals[name]["area_cm2"] += area_cm2
            class_totals[name]["volume_cm3"] += volume_cm3
            class_totals[name]["mass_g"] += mass_g
            class_totals[name]["count"] += 1

            # Draw mask contour on visualization
            contours, _ = cv2.findContours(bm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis_img, contours, -1, color, 2)

    # Print class totals
    print("\n  " + "=" * 70)
    print(f"  {'CLASS':<16} {'N':<6} {'TOTAL cm²':<14} {'TOTAL cm³':<14} {'TOTAL g':<14}")
    print("  " + "=" * 70)

    total_mass = 0.0
    total_volume = 0.0

    for name, t in class_totals.items():
        color = class_colors[name]
        print(f"  {name:<16} {t['count']:<6} {t['area_cm2']:<14.1f} {t['volume_cm3']:<14.1f} {t['mass_g']:<14.1f}")
        total_mass += t["mass_g"]
        total_volume += t["volume_cm3"]

        # Label on visualization (centroid of merged mask)
        merged = np.zeros((h, w), dtype=np.uint8)
        for bm in class_data[name]["binary_masks"]:
            merged = np.bitwise_or(merged, bm)
        M = cv2.moments(merged)
        if M["m00"] != 0:
            cx, cy = int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"])
        else:
            cx, cy = w // 2, h // 2

        label = f"{name} ~{t['mass_g']:.0f}g"
        cv2.putText(vis_img, label, (cx - 50, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        cv2.putText(vis_img, label, (cx - 50, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 1)

    print("  " + "=" * 70)
    print(f"\n  TOTAL PLATE: {total_volume:.1f} cm³  |  {total_mass:.1f} g")

    # Save visualizations
    out_path = os.path.join(SAVE_DIR, "run", f"{stem}_masks{ext}")
    cv2.imwrite(out_path, vis_img)
    print(f"\n[INFO] Saved masks+volume -> {out_path}")

    side_by_side = np.hstack([original_img, depth_colored, vis_img])
    combo_path = os.path.join(SAVE_DIR, "run", f"{stem}_combo{ext}")
    cv2.imwrite(combo_path, side_by_side)
    print("[INFO] Saved combo   -> {combo_path}")

    t_end = time.time()
    print("\n  " + "=" * 70)
    print("  [TIMING SUMMARY FOR LICENTA THESIS]")
    print(f"    1. Importuri și Startup:         {t_imports - t_start:.3f} s")
    print(f"    2. Inferență YOLOv11:            {t_yolo_end - t_yolo_start:.3f} s")
    print(f"    3. Inferență MiDaS (Adâncime):   {t_midas_end - t_midas_start:.3f} s")
    print(f"    4. Integrare Volum și Masă:      {t_end - t_post_start:.3f} s")
    print(f"    ------------------------------------------------------------------")
    print(f"    Timp Total Inferență Activă:     {t_end - t_yolo_start:.3f} s")
    print(f"    Timp Total Rulare Script:        {t_end - t_start:.3f} s")
    print("  " + "=" * 70)


if __name__ == "__main__":
    main()
