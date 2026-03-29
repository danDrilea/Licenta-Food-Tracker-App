from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import base64

app = FastAPI(title="AI Food Tracker API")

@app.get("/")
async def root():
    return {"message": "Raspberry Pi Server is Live!"}

@app.post("/analyze-food")
async def analyze_food(photo: UploadFile = File(...)):
    try:
        image_bytes = await photo.read()

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        return JSONResponse(content={
            "status": "success",
            "message": "Image processed successfully",
            "original_filename": photo.filename,
            "image_base64": encoded_image 
        })

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)}, 
            status_code=500
        )
