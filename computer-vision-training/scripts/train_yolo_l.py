from ultralytics import YOLO, settings
import os

# Automatically find the paths
DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
settings.update({"datasets_dir": DIR})

YAML_PATH = os.path.join(DIR, 'food_v2.yaml')
RUNS_DIR = os.path.join(DIR, 'runs')

def main():
    print("Loading YOLO11 Large Segmentation model...")
    model = YOLO("yolo11l-seg.pt")

    print("Starting training on GPU")

    results = model.train(
        data=YAML_PATH,

        # Duration & stopping
        epochs=200,
        patience=30,       # Early stop if no improvement for 30 epochs

        # Hardware
        imgsz=640,
        batch=-1,          # Auto-batch: finds max batch for available VRAM
        device=0,
        workers=4,

        # Learning rate
        cos_lr=True,       # Cosine LR schedule (smoother convergence)
        lr0=0.001,         # Lower initial LR for larger model
        lrf=0.1,           # Final LR = lr0 * lrf

        # Warmup
        warmup_epochs=5.0, # Longer warmup for large model

        # Augmentation
        mixup=0.15,        # Blend images (helps with overlapping foods)
        copy_paste=0.1,    # Copy-paste aug (great for instance segmentation)
        degrees=15.0,      # Rotation (plates aren't always level)
        scale=0.7,         # More aggressive scaling
        translate=0.2,     # More translation
        hsv_h=0.02,        # Hue variation
        hsv_s=0.8,         # Saturation variation
        hsv_v=0.5,         # Brightness variation
        close_mosaic=20,   # Disable mosaic for last 20 epochs (fine-tuning)
        erasing=0.3,       # Random erasing

        # Regularization
        dropout=0.1,       # Light dropout

        project=RUNS_DIR,
        name="FoodInsSeg_L_v2"
    )

    print("Training complete!")

if __name__ == "__main__":
    main()
