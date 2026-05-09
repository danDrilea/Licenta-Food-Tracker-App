from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware # 1. Import CORS
from ultralytics import YOLO
import io
from PIL import Image
import os
import base64

app = FastAPI(title="AI Food Tracker API")

# 2. Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (POST, GET, etc.)
    allow_headers=["*"], # Allows all headers
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "..", "computer-vision-training", "runs", "FoodInsSeg_L_v2", "weights", "best.pt")

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

# Load model at startup
model = None
if os.path.exists(WEIGHTS_PATH):
    model = YOLO(WEIGHTS_PATH)
else:
    print(f"Warning: Model weights not found at {WEIGHTS_PATH}")

@app.get("/")
async def root():
    return {
        "message": "Raspberry Pi Server is Live!",
        "model_loaded": model is not None
    }

@app.post("/analyze-food")
async def analyze_food(photo: UploadFile = File(...)):
    if model is None:
        return JSONResponse(
            content={"status": "error", "message": "Model not loaded. Check weights path."},
            status_code=500
        )

    try:
        # Read image
        image_bytes = await photo.read()
        image = Image.open(io.BytesIO(image_bytes))

        # Run prediction
        results = model.predict(source=image, conf=0.25, verbose=False)

        predictions = []
        annotated_image_b64 = None
        
        if len(results) > 0:
            result = results[0]
            
            # Extract predictions
            if result.boxes is not None:
                for box in result.boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"unknown_{cls_id}"
                    
                    predictions.append({
                        "food_item": name,
                        "confidence": round(conf, 4),
                    })

            # Get the annotated image (rendered with boxes/masks)
            plot_img = result.plot() 
            # Convert BGR to RGB for PIL
            plot_rgb = plot_img[..., ::-1] 
            annotated_pil = Image.fromarray(plot_rgb)
            
            # Save to buffer in JPEG format
            buffer = io.BytesIO()
            annotated_pil.save(buffer, format="JPEG")
            annotated_image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return JSONResponse(content={
            "status": "success",
            "message": "Image analyzed successfully",
            "predictions": predictions,
            "detected_count": len(predictions),
            "annotated_image": annotated_image_b64
        })

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)}, 
            status_code=500
        )
