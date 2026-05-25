import os
import io
import base64
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from llama_cpp import Llama

app = FastAPI(title="AI Food Tracker API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (POST, GET, etc.)
    allow_headers=["*"], # Allows all headers
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(BASE_DIR, "..", "computer-vision-training", "trainedModel", "best.pt")

# Calea către modelul tău din subfolderul 'llama' (relativă la pi-server)
LLM_PATH = os.path.join(BASE_DIR, "llama", "Llama-3.2-3B-Instruct-Q4_K_M.gguf")

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

# Load YOLO model at startup
model = None
if os.path.exists(WEIGHTS_PATH):
    model = YOLO(WEIGHTS_PATH)
else:
    print(f"Warning: YOLO model weights not found at {WEIGHTS_PATH}")

# Load Llama model at startup
llm = None
if os.path.exists(LLM_PATH):
    print(f"[INFO] Se încarcă LLM-ul din: {LLM_PATH} ...")
    # n_ctx=512 este suficient pentru teste și mesaje nutriționale scurte
    llm = Llama(model_path=LLM_PATH, n_ctx=512, verbose=False)
    print("[SUCCESS] Llama a fost încărcat cu succes în RAM!")
else:
    print(f"[ERROR] Nu am găsit fișierul .gguf la calea: {LLM_PATH}")

@app.get("/")
async def root():
    return {
        "message": "Raspberry Pi Server is Live!",
        "model_loaded": model is not None,
        "llm_loaded": llm is not None
    }

@app.get("/llama-demo")
async def llama_demo(prompt: str = Query(..., description="Promptul trimis către Llama")):
    if llm is None:
        return JSONResponse(
            content={"status": "error", "message": "Modelul LLM nu este încărcat."},
            status_code=500
        )

    try:
        # Pachet de instrucțiuni mult mai strict pentru a evita textul lung și inutil
        formatted_prompt = (
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
            "Ești un asistent nutrițional inteligent și extrem de concis. "
            "Analizează alimentele utilizatorului și oferă un răspuns de MAXIMUM 3-4 propoziții în limba română. "
            "Fii direct, nu folosi introduceri lungi și academice.<|eot_id|>"
            "<|start_header_id|>user<|end_header_id|>\n\n"
            f"{prompt}<|eot_id|>"
            "<|start_header_id|>assistant<|end_header_id|>\n\n"
        )
        
        # CORECTAT: max_tokens mărit la 250 pentru a preveni tăierea textului
        response = llm(
            formatted_prompt,
            max_tokens=250,  # Destul spațiu pentru 3-4 propoziții complete
            temperature=0.4, # Temperatură joasă pentru păstrarea coerenței
            top_p=0.9,
            stop=["<|eot_id|>", "<|start_header_id|>", "</s>"]
        )
        
        answer = response["choices"][0]["text"].strip()
        
        return {
            "status": "success",
            "input_prompt": prompt,
            "llama_response": answer
        }
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": f"Eroare la generare: {str(e)}"},
            status_code=500
        )

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
