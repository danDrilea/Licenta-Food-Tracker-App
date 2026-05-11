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

CONF = 0.2

# ── Camera / physical estimation constants ───────────────────────────────
CAMERA_DISTANCE_CM = 30.0       # assumed fixed distance from camera to plate
CAMERA_HFOV_DEG    = 75.0       # typical smartphone horizontal field of view
MAX_FOOD_HEIGHT_CM = 5.0        # assumed max height food can stick up from plate


def compute_cm_per_pixel(image_width_px):
    """Pinhole model: how many cm does 1 pixel represent at CAMERA_DISTANCE_CM."""
    half_fov_rad = math.radians(CAMERA_HFOV_DEG / 2)
    scene_width_cm = 2 * CAMERA_DISTANCE_CM * math.tan(half_fov_rad)
    return scene_width_cm / image_width_px


def load_midas():
    """Load MiDaS small model for monocular depth estimation."""
    import torch
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
    midas.to(device).eval()

    transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
    transform = transforms.small_transform

    return midas, transform, device


def estimate_depth(midas, transform, device, img_rgb):
    """Run MiDaS on an RGB image, return depth map at original resolution."""
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

    # MiDaS outputs inverse depth (higher = closer). Normalize to 0-1.
    depth = depth - depth.min()
    if depth.max() > 0:
        depth = depth / depth.max()

    return depth


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

    from ultralytics import YOLO
    import cv2
    import numpy as np
    import random

    # ── Step 1: YOLO segmentation ────────────────────────────────────────
    print("[1/3] Running YOLO segmentation...")
    model = YOLO(WEIGHTS)
    results = model.predict(source=image_path, conf=CONF, save=True, verbose=False,
                            project=SAVE_DIR, name="run", exist_ok=True)

    result = results[0]
    original_img = result.orig_img.copy()
    h, w = original_img.shape[:2]
    img_rgb = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)

    # ── Physical scale ───────────────────────────────────────────────────
    cm_per_px = compute_cm_per_pixel(w)
    cm2_per_px2 = cm_per_px ** 2
    print(f"  Camera: {CAMERA_DISTANCE_CM}cm distance, {CAMERA_HFOV_DEG}° HFOV")
    print(f"  Scale:  1 px = {cm_per_px:.4f} cm  |  1 px² = {cm2_per_px2:.6f} cm²")

    # ── Step 2: MiDaS depth estimation ───────────────────────────────────
    print("[2/3] Running MiDaS depth estimation...")
    midas, transform, device = load_midas()
    depth_map = estimate_depth(midas, transform, device, img_rgb)

    # Save depth map visualization
    depth_vis = (depth_map * 255).astype(np.uint8)
    depth_colored = cv2.applyColorMap(depth_vis, cv2.COLORMAP_MAGMA)

    os.makedirs(os.path.join(SAVE_DIR, "run"), exist_ok=True)
    base = os.path.basename(image_path)
    stem, ext = os.path.splitext(base)

    depth_path = os.path.join(SAVE_DIR, "run", f"{stem}_depth{ext}")
    cv2.imwrite(depth_path, depth_colored)
    print(f"  Saved depth map -> {depth_path}")

    # ── Estimate baseline depth (plate/table surface) ────────────────────
    # Use the 10th percentile of the depth map as the "table level"
    # (lowest depth = furthest from camera = the flat table)
    all_food_mask = np.zeros((h, w), dtype=np.uint8)

    # ── Step 3: Combine YOLO masks + depth → physical volume ────────────
    print("[3/3] Calculating areas and volumes...")

    # Collect per-class data
    class_data = {}  # name -> { "points": [...], "binary_masks": [...] }

    if result.boxes is not None and result.masks is not None:
        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0].item())
            conf_val = float(box.conf[0].item())
            name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id)

            poly_xy = result.masks.xy[i]
            if len(poly_xy) == 0:
                continue

            poly = np.array(poly_xy, dtype=np.int32).reshape((-1, 1, 2))

            # Build binary mask for this detection
            binary = np.zeros((h, w), dtype=np.uint8)
            cv2.fillPoly(binary, [np.array(poly_xy, dtype=np.int32)], 1)
            all_food_mask = np.bitwise_or(all_food_mask, binary)

            if name not in class_data:
                class_data[name] = {"points": [], "binary_masks": []}
            class_data[name]["points"].append(poly)
            class_data[name]["binary_masks"].append(binary)

    if not class_data:
        print("\n[INFO] No classes detected.")
        return

    # Baseline depth = mean depth of non-food pixels (the table/plate surface)
    non_food = (all_food_mask == 0)
    if non_food.sum() > 0:
        baseline_depth = float(np.mean(depth_map[non_food]))
    else:
        baseline_depth = float(np.percentile(depth_map, 10))

    print(f"  Baseline (table) depth: {baseline_depth:.3f}")

    # Compute per-detection, then aggregate per class
    random.seed(42)
    vis_img = original_img.copy()

    # Assign a stable color per class
    class_colors = {}
    for name in class_data:
        class_colors[name] = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))

    # Print individual detections
    print("\n  Individual detections:")
    print("  " + "-" * 62)
    print(f"    {'#':<4} {'CLASS':<16} {'cm²':<10} {'cm':<10} {'cm³':<10}")
    print("  " + "-" * 62)

    class_totals = {}  # name -> { "area_cm2": float, "volume_cm3": float, "count": int }
    det_idx = 0

    for name, data in class_data.items():
        color = class_colors[name]

        for j, bm in enumerate(data["binary_masks"]):
            det_idx += 1

            # Actual mask pixel count = true area (no gaps)
            area_px = int(bm.sum())
            area_cm2 = area_px * cm2_per_px2

            # Height from depth for THIS specific mask
            masked_depth = depth_map[bm == 1]
            mean_depth = float(np.mean(masked_depth)) if len(masked_depth) > 0 else 0.0

            height_ratio = max(0.0, mean_depth - baseline_depth)
            height_ratio = min(height_ratio, 1.0)
            height_cm = height_ratio * MAX_FOOD_HEIGHT_CM
            height_cm = max(height_cm, 0.3)

            volume_cm3 = area_cm2 * height_cm

            print(f"    {det_idx:<4} {name:<16} {area_cm2:<10.1f} {height_cm:<10.1f} {volume_cm3:<10.1f}")

            # Accumulate totals
            if name not in class_totals:
                class_totals[name] = {"area_cm2": 0, "volume_cm3": 0, "count": 0}
            class_totals[name]["area_cm2"] += area_cm2
            class_totals[name]["volume_cm3"] += volume_cm3
            class_totals[name]["count"] += 1

            # Draw individual mask contour on visualization
            contours, _ = cv2.findContours(bm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis_img, contours, -1, color, 2)

    # Print class totals
    print("\n  " + "=" * 62)
    print(f"  {'CLASS':<16} {'COUNT':<8} {'TOTAL cm²':<14} {'TOTAL cm³':<14}")
    print("  " + "=" * 62)

    for name, totals in class_totals.items():
        color = class_colors[name]
        print(f"  {name:<16} {totals['count']:<8} {totals['area_cm2']:<14.1f} {totals['volume_cm3']:<14.1f}")

        # Merged mask for label placement
        merged = np.zeros((h, w), dtype=np.uint8)
        for bm in class_data[name]["binary_masks"]:
            merged = np.bitwise_or(merged, bm)
        M = cv2.moments(merged)
        if M["m00"] != 0:
            cx, cy = int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"])
        else:
            cx, cy = w // 2, h // 2

        label = f"{name} {totals['volume_cm3']:.0f}cm3"
        cv2.putText(vis_img, label, (cx - 50, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
        cv2.putText(vis_img, label, (cx - 50, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 1)

    print("  " + "=" * 62)

    # Save final visualization
    out_path = os.path.join(SAVE_DIR, "run", f"{stem}_masks{ext}")
    cv2.imwrite(out_path, vis_img)
    print(f"\n[INFO] Saved masks+volume -> {out_path}")

    # Save side-by-side: original | depth | masks
    side_by_side = np.hstack([original_img, depth_colored, vis_img])
    combo_path = os.path.join(SAVE_DIR, "run", f"{stem}_combo{ext}")
    cv2.imwrite(combo_path, side_by_side)
    print(f"[INFO] Saved combo   -> {combo_path}")


if __name__ == "__main__":
    main()
