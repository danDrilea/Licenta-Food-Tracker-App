from ultralytics.data.converter import convert_coco
import os

DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANNOTATIONS_DIR = os.path.join(DIR, 'FoodInsSeg', 'annotations')

def main():
    convert_coco(
        labels_dir=ANNOTATIONS_DIR,
        use_segments=True,  # Crucial for instance segmentation
        cls91to80=False     # Keep the original 103 food classes
    )
    print("Conversion completed successfully. Please move the generated 'labels' directory to the appropriate location in your dataset structure.")

if __name__ == "__main__":
    main()