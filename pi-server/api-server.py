from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import io
from PIL import Image
import os
import base64

app = FastAPI(title="AI Food Tracker API")

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "..", "computer-vision-training", "trainedModel", "best.pt")

# Class names as defined in the training script
CLASS_NAMES = [
    "candy", "egg tart", "french fries", "chocolate", "biscuit", "popcorn",
    "pudding", "ice cream", "cheese butter", "cake", "wine", "milkshake",
    "coffee", "juice", "milk", "tea", "almond", "red beans", "cashew",
    "dried cranberries", "soy", "walnut", "peanut", "egg", "apple", "date",
    "apricot", "avocado", "banana", "strawberry", "cherry", "blueberry",
    "raspberry", "mango", "olives", "peach", "lemon", "pear", "fig",
    "pineapple", "grape", "kiwi", "melon", "orange", "watermelon", "steak",
    "pork", "chicken duck", "sausage", "fried meat", "lamb", "sauce", "crab",
    "fish", "shellfish", "shrimp", "soup", "bread", "corn", "hamburg",
    "pizza", "hanamaki baozi", "wonton dumplings", "pasta", "noodles",
    "rice", "pie", "tofu", "eggplant", "potato", "garlic", "cauliflower",
    "tomato", "kelp", "seaweed", "spring onion", "rape", "ginger", "okra",
    "lettuce", "pumpkin", "cucumber", "white radish", "carrot", "asparagus",
    "bamboo shoots", "broccoli", "celery stick", "cilantro mint", "snow peas",
    "cabbage", "bean sprouts", "onion", "pepper", "green beans",
    "French beans", "king oyster mushroom", "shiitake", "enoki mushroom",
    "oyster mushroom", "white button mushroom", "salad", "other ingredients",
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
