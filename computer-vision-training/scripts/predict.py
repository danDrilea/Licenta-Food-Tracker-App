import os
import sys

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

    model = YOLO(WEIGHTS)
    results = model.predict(source=image_path, conf=0.25, save=True, verbose=True,
                            project=SAVE_DIR, name="run", exist_ok=True)

    for result in results:
        if result.boxes is not None:
            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                conf = round(float(box.conf[0].item()), 4)
                name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id)
                print(f"  {name} ({conf:.2f})")


if __name__ == "__main__":
    main()
