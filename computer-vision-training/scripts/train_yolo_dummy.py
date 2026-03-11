from ultralytics import YOLO, settings
import os

# Automatically find the paths
DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
settings.update({"datasets_dir": DIR})  # Set the datasets directory to the parent of the current script

YAML_PATH = os.path.join(DIR, 'food.yaml')
RUNS_DIR = os.path.join(DIR, 'runs')

def main():
    print("Loading YOLO11 Small Segmentation model...")
    model = YOLO("yolo11s-seg.pt") 

    print("Starting training on GPU")

    results = model.train(
        data=YAML_PATH,
        epochs=1,      
        imgsz=640,       
        batch=8,         
        device=0,        
        workers=4,
        project=RUNS_DIR,         # Saves output cleanly in computer-vision-training/runs
        name="FoodInsSeg_DEMO_Run1" 
    )
    
    print("Training complete!")

if __name__ == "__main__":
    main()