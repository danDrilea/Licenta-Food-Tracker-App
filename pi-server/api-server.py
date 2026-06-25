"""
AI Food Tracker — Raspberry Pi API Server
==========================================
FastAPI server running YOLO instance-segmentation + MiDaS monocular depth
to detect food items and estimate their volume (cm³) and mass (grams).
Includes Llama 3.2 3B (GGUF) for nutritional text generation.

Usage (on Raspberry Pi):
    uvicorn api-server:app --host 0.0.0.0 --port 8000
"""

import os
import io
import math
import time

import cv2
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from llama_cpp import Llama


# ══════════════════════════════════════════════════════════════════════
#  App Setup
# ══════════════════════════════════════════════════════════════════════

app = FastAPI(title="AI Food Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════
#  Paths
# ══════════════════════════════════════════════════════════════════════

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(
    BASE_DIR, "..", "computer-vision-training", "trainedModel", "best.pt"
)
LLAMA_MODEL_PATH = os.path.join(
    BASE_DIR, "..", "llm", "Llama-3.2-3B-Instruct-Q4_K_M.gguf"
)

# ══════════════════════════════════════════════════════════════════════
#  73 Food Classes (v2 — cleaned dataset)
# ══════════════════════════════════════════════════════════════════════

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

# ══════════════════════════════════════════════════════════════════════
#  Density Table (g/cm³)
#  Source: density_DB_v2_0_final (USDA FoodData Central, UK 6th Ed, S&W)
#  Classes marked * use standard food-science estimates.
# ══════════════════════════════════════════════════════════════════════

DENSITY = {
    "candy": 1.20,
    "french fries": 0.90,
    "chocolate": 1.056,
    "biscuit": 0.45,
    "popcorn": 0.04,
    "ice cream": 0.568,
    "cheese butter": 1.05,
    "cake": 0.809,
    "wine": 0.996,
    "milkshake": 1.05,
    "coffee": 0.750,
    "juice": 1.050,
    "milk": 0.877,
    "almond": 0.460,
    "cashew": 0.500,
    "dried cranberries": 0.55,
    "walnut": 0.45,
    "peanut": 0.793,
    "egg": 0.640,
    "apple": 0.915,
    "apricot": 0.88,
    "avocado": 0.95,
    "banana": 1.067,
    "strawberry": 1.080,
    "cherry": 1.02,
    "berries": 0.62,
    "mango": 0.998,
    "olives": 0.650,
    "peach": 0.92,
    "lemon": 1.010,
    "pear": 1.050,
    "pineapple": 0.88,
    "grape": 1.056,
    "kiwi": 1.00,
    "melon": 0.92,
    "orange": 1.037,
    "watermelon": 0.95,
    "steak": 1.05,
    "pork": 0.808,
    "chicken": 0.879,
    "sausage": 0.95,
    "fried meat": 0.90,
    "sauce": 0.815,
    "crab": 0.85,
    "fish": 1.02,
    "shellfish": 0.95,
    "shrimp": 0.90,
    "soup": 1.032,
    "bread": 0.344,
    "corn": 0.688,
    "hamburger": 1.038,
    "pizza": 0.65,
    "pasta": 0.583,
    "rice": 0.677,
    "pie": 0.120,
    "eggplant": 0.825,
    "potato": 0.899,
    "garlic": 0.335,
    "cauliflower": 0.450,
    "tomato": 1.017,
    "lettuce": 0.06,
    "pumpkin": 0.70,
    "cucumber": 0.96,
    "carrot": 0.625,
    "asparagus": 0.40,
    "broccoli": 0.950,
    "celery": 0.60,
    "cabbage": 0.36,
    "onion": 0.538,
    "pepper": 0.450,
    "green beans": 0.530,
    "mushroom": 1.017,
    "salad": 0.680,
}

# ══════════════════════════════════════════════════════════════════════
#  Geometric Calibration Constants (Pinhole Camera Model)
# ══════════════════════════════════════════════════════════════════════

CONF_THRESHOLD = 0.25
CAMERA_DISTANCE_CM = 35.0       # standard capture distance (arm's length)
CAMERA_HFOV_DEG    = 75.0       # typical smartphone horizontal FOV

# K_DEPTH_CM maps per request via depth_category query param:
#   A = flat food  (5.0)
#   B = medium     (10.0)  ← default
#   C = tall food  (15.0)
K_DEPTH_MAP = {"A": 5.0, "B": 10.0, "C": 15.0}


# ══════════════════════════════════════════════════════════════════════
#  Helper Functions (ported from predict.py)
# ══════════════════════════════════════════════════════════════════════

def compute_cm_per_pixel(image_width_px: int) -> float:
    """Pinhole camera model: cm per pixel at CAMERA_DISTANCE_CM.

    scene_width = 2 · d · tan(θ / 2)
    cm_per_pixel = scene_width / image_width_px
    """
    half_fov_rad = math.radians(CAMERA_HFOV_DEG / 2)
    scene_width_cm = 2 * CAMERA_DISTANCE_CM * math.tan(half_fov_rad)
    return scene_width_cm / image_width_px


def estimate_depth(img_rgb: np.ndarray) -> np.ndarray:
    """Run MiDaS inference → normalized disparity map in [0, 1].

    Higher values = closer to camera.
    """
    input_batch = midas_transform(img_rgb).to(midas_device)

    with torch.no_grad():
        prediction = midas_model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img_rgb.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

    depth = prediction.cpu().numpy()

    # Normalize to [0, 1]
    depth = depth - depth.min()
    if depth.max() > 0:
        depth = depth / depth.max()

    return depth


def compute_baseline_depth(
    depth_map: np.ndarray, binary_mask: np.ndarray
) -> float:
    """Median disparity along mask boundary (plate/container surface).

    Boundary pixels sit on the reference plane beneath the food.
    """
    contours, _ = cv2.findContours(
        binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        return float(np.median(depth_map))

    boundary_mask = np.zeros_like(binary_mask)
    cv2.drawContours(boundary_mask, contours, -1, 1, thickness=3)

    boundary_depths = depth_map[boundary_mask == 1]
    if len(boundary_depths) == 0:
        return float(np.median(depth_map))

    return float(np.median(boundary_depths))


def compute_volume_cm3(
    depth_map: np.ndarray,
    binary_mask: np.ndarray,
    cm2_per_px: float,
    d_base: float,
    k_depth_cm: float,
) -> float:
    """Per-pixel Riemann sum for volumetric integration.

    H(x,y) = max(0, D(x,y) - D_base)
    V = cm²_per_pixel × K_DEPTH_CM × Σ H(x,y)
    """
    food_disparities = depth_map[binary_mask == 1]
    if len(food_disparities) == 0:
        return 0.0

    heights = np.maximum(0.0, food_disparities - d_base)
    v_idx = float(np.sum(heights))

    return cm2_per_px * k_depth_cm * v_idx


# ══════════════════════════════════════════════════════════════════════
#  Model Loading (at startup)
# ══════════════════════════════════════════════════════════════════════

# --- YOLO ---
print(f"[INFO] Loading YOLO model from: {WEIGHTS_PATH}")
yolo_model = None
if os.path.exists(WEIGHTS_PATH):
    yolo_model = YOLO(WEIGHTS_PATH)
    print("[OK] YOLO model loaded successfully.")
else:
    print(f"[WARNING] YOLO weights not found at {WEIGHTS_PATH}")

# --- MiDaS ---
print("[INFO] Loading MiDaS depth estimation model...")
midas_model = None
midas_transform = None
midas_device = None
try:
    midas_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    midas_model = torch.hub.load(
        "intel-isl/MiDaS", "MiDaS_small", trust_repo=True
    )
    midas_model.to(midas_device).eval()

    transforms = torch.hub.load(
        "intel-isl/MiDaS", "transforms", trust_repo=True
    )
    midas_transform = transforms.small_transform
    print(f"[OK] MiDaS loaded on {midas_device}.")
except Exception as e:
    print(f"[WARNING] Failed to load MiDaS: {e}")

# --- Llama 3.2 3B (GGUF) ---
print(f"[INFO] Loading Llama 3.2 3B from: {LLAMA_MODEL_PATH}")
llm_model = None
try:
    if os.path.exists(LLAMA_MODEL_PATH):
        llm_model = Llama(
            model_path=LLAMA_MODEL_PATH,
            n_ctx=2048,       # context window
            n_threads=4,      # match RPi core count
            verbose=False,
        )
        print("[OK] Llama 3.2 3B loaded successfully.")
    else:
        print(f"[WARNING] Llama GGUF not found at {LLAMA_MODEL_PATH}")
except Exception as e:
    print(f"[WARNING] Failed to load Llama model: {e}")


# ══════════════════════════════════════════════════════════════════════
#  API Endpoints
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "message": "Raspberry Pi Food Tracker API is Live!",
        "yolo_loaded": yolo_model is not None,
        "midas_loaded": midas_model is not None,
        "llm_loaded": llm_model is not None,
    }


@app.post("/analyze-food")
async def analyze_food(
    photo: UploadFile = File(...),
    depth_category: str = Query(
        "B",
        description="Food height category: A=flat (5cm), B=medium (10cm), C=tall (15cm)",
    ),
):
    """Full food analysis pipeline:
    1. YOLO instance segmentation → detect food items + masks
    2. MiDaS monocular depth → disparity map
    3. Pinhole calibration + Riemann integration → volume (cm³)
    4. Volume × density → mass (grams)

    Returns JSON with per-detection and per-class results.
    """
    # ── Validate models ──────────────────────────────────────────────
    if yolo_model is None:
        return JSONResponse(
            content={
                "status": "error",
                "message": "YOLO model not loaded. Check weights path on the Pi.",
            },
            status_code=500,
        )
    if midas_model is None:
        return JSONResponse(
            content={
                "status": "error",
                "message": "MiDaS model not loaded. Depth estimation unavailable.",
            },
            status_code=500,
        )

    # ── Resolve depth calibration ────────────────────────────────────
    k_depth_cm = K_DEPTH_MAP.get(depth_category.upper(), 10.0)

    try:
        t_start = time.time()

        # ── Read image ───────────────────────────────────────────────
        image_bytes = await photo.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_rgb = np.array(pil_image)
        h, w = img_rgb.shape[:2]

        # ── Pinhole XY calibration ───────────────────────────────────
        cm_per_px = compute_cm_per_pixel(w)
        cm2_per_px = cm_per_px ** 2

        # ── Step 1: YOLO segmentation ────────────────────────────────
        t_yolo = time.time()
        results = yolo_model.predict(
            source=pil_image,
            conf=CONF_THRESHOLD,
            verbose=False,
            agnostic_nms=True,
        )
        t_yolo_done = time.time()

        result = results[0]

        # Quick exit if nothing detected
        if result.boxes is None or len(result.boxes) == 0:
            return JSONResponse(content={
                "status": "success",
                "message": "No food items detected.",
                "detections": [],
                "by_class": {},
                "totals": {
                    "detected_items": 0,
                    "unique_classes": 0,
                    "total_volume_cm3": 0.0,
                    "total_mass_grams": 0.0,
                },
                "timing": {
                    "yolo_seconds": round(t_yolo_done - t_yolo, 3),
                    "midas_seconds": 0.0,
                    "total_seconds": round(time.time() - t_start, 3),
                },
            })

        has_masks = result.masks is not None

        # ── Step 2: MiDaS depth estimation ───────────────────────────
        t_midas = time.time()
        depth_map = estimate_depth(img_rgb)
        t_midas_done = time.time()

        # ── Step 3: Extract detections, compute volume & mass ────────
        detections = []
        class_totals = {}  # name → {count, area, volume, mass}
        det_idx = 0

        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            name = (
                CLASS_NAMES[cls_id]
                if cls_id < len(CLASS_NAMES)
                else f"unknown_{cls_id}"
            )
            density = DENSITY.get(name, 0.80)

            # Build binary mask from segmentation polygon
            if has_masks and i < len(result.masks.xy):
                poly_xy = result.masks.xy[i]
                if len(poly_xy) == 0:
                    continue
                binary_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.fillPoly(
                    binary_mask, [np.array(poly_xy, dtype=np.int32)], 1
                )
            else:
                # Fallback: use bounding box as a rough mask
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                binary_mask = np.zeros((h, w), dtype=np.uint8)
                binary_mask[int(y1):int(y2), int(x1):int(x2)] = 1

            # Area
            area_px = int(binary_mask.sum())
            area_cm2 = area_px * cm2_per_px

            # Baseline depth (plate surface under this item)
            d_base = compute_baseline_depth(depth_map, binary_mask)

            # Volume via Riemann integration
            volume_cm3 = compute_volume_cm3(
                depth_map, binary_mask, cm2_per_px, d_base, k_depth_cm
            )

            # Mass = Volume × Density
            mass_g = volume_cm3 * density

            det_idx += 1
            detections.append({
                "index": det_idx,
                "food_item": name,
                "confidence": round(conf, 4),
                "area_cm2": round(area_cm2, 1),
                "volume_cm3": round(volume_cm3, 1),
                "mass_grams": round(mass_g, 1),
                "density_used": density,
            })

            # Accumulate per-class totals
            if name not in class_totals:
                class_totals[name] = {
                    "count": 0,
                    "total_area_cm2": 0.0,
                    "total_volume_cm3": 0.0,
                    "total_mass_grams": 0.0,
                }
            class_totals[name]["count"] += 1
            class_totals[name]["total_area_cm2"] += area_cm2
            class_totals[name]["total_volume_cm3"] += volume_cm3
            class_totals[name]["total_mass_grams"] += mass_g

        # Round class totals
        for name in class_totals:
            ct = class_totals[name]
            ct["total_area_cm2"] = round(ct["total_area_cm2"], 1)
            ct["total_volume_cm3"] = round(ct["total_volume_cm3"], 1)
            ct["total_mass_grams"] = round(ct["total_mass_grams"], 1)

        # Grand totals
        total_volume = sum(d["volume_cm3"] for d in detections)
        total_mass = sum(d["mass_grams"] for d in detections)

        t_end = time.time()

        return JSONResponse(content={
            "status": "success",
            "message": "Image analyzed successfully.",
            "detections": detections,
            "by_class": class_totals,
            "totals": {
                "detected_items": len(detections),
                "unique_classes": len(class_totals),
                "total_volume_cm3": round(total_volume, 1),
                "total_mass_grams": round(total_mass, 1),
            },
            "calibration": {
                "camera_distance_cm": CAMERA_DISTANCE_CM,
                "hfov_degrees": CAMERA_HFOV_DEG,
                "depth_category": depth_category.upper(),
                "k_depth_cm": k_depth_cm,
                "cm_per_pixel": round(cm_per_px, 5),
                "image_size": {"width": w, "height": h},
            },
            "timing": {
                "yolo_seconds": round(t_yolo_done - t_yolo, 3),
                "midas_seconds": round(t_midas_done - t_midas, 3),
                "total_seconds": round(t_end - t_start, 3),
            },
        })

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500,
        )



# ══════════════════════════════════════════════════════════════════════
#  LLM Meal Advice Endpoint
# ══════════════════════════════════════════════════════════════════════

class FoodItem(BaseModel):
    name: str
    grams: float
    protein: float  # grams
    carbs: float    # grams
    fats: float     # grams


class MealAdviceRequest(BaseModel):
    items: list[FoodItem]
    max_tokens: int = 200


MEAL_SYSTEM_PROMPT = (
    "You are a friendly nutritional assistant in a food tracking app. "
    "The user logs a meal and you comment briefly.\n\n"
    "Rules:\n"
    "- ONLY mention foods the user listed. Never invent foods.\n"
    "- Write 3-4 sentences TOTAL. No more.\n"
    "- First 1-2 sentences: a positive comment about the meal.\n"
    "- Last 1-2 sentences: one gentle suggestion (e.g. add a veggie, swap a fatty item).\n"
    "- Never use quotation marks around your response.\n"
    "- No calorie counts or macro numbers — the app shows those.\n"
    "- Be warm, casual, and brief. Under 60 words total."
)


def _build_meal_prompt(items: list[FoodItem]) -> str:
    """Build a structured user message from the meal items."""
    lines = ["Here is my meal:\n"]
    total_p, total_c, total_f, total_g = 0.0, 0.0, 0.0, 0.0

    for item in items:
        lines.append(
            f"- {item.name}: {item.grams:.0f}g "
            f"(protein {item.protein:.1f}g, carbs {item.carbs:.1f}g, fats {item.fats:.1f}g)"
        )
        total_g += item.grams
        total_p += item.protein
        total_c += item.carbs
        total_f += item.fats

    lines.append(
        f"\nTotal: {total_g:.0f}g — "
        f"protein {total_p:.1f}g, carbs {total_c:.1f}g, fats {total_f:.1f}g"
    )
    lines.append("\nGive me a brief, friendly comment on this meal.")
    return "\n".join(lines)


@app.post("/meal-advice")
async def meal_advice(req: MealAdviceRequest):
    """Analyse a logged meal and return brief nutritional advice from Llama 3.2."""
    if llm_model is None:
        return JSONResponse(
            content={
                "status": "error",
                "message": "Llama model not loaded. Check GGUF path on the Pi.",
            },
            status_code=500,
        )

    if not req.items:
        return JSONResponse(
            content={"status": "error", "message": "No food items provided."},
            status_code=400,
        )

    try:
        t_start = time.time()
        user_prompt = _build_meal_prompt(req.items)

        output = llm_model.create_chat_completion(
            messages=[
                {"role": "system", "content": MEAL_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=req.max_tokens,
            temperature=0.7,
            top_p=0.9,
        )

        t_end = time.time()
        reply = output["choices"][0]["message"]["content"]

        return JSONResponse(content={
            "status": "success",
            "advice": reply,
            "meal_summary": {
                "item_count": len(req.items),
                "total_protein_g": round(sum(i.protein for i in req.items), 1),
                "total_carbs_g": round(sum(i.carbs for i in req.items), 1),
                "total_fats_g": round(sum(i.fats for i in req.items), 1),
            },
            "tokens_used": output["usage"],
            "time_seconds": round(t_end - t_start, 2),
        })

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500,
        )
