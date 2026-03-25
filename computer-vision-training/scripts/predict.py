import os
import sys

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPTS_DIR)
WEIGHTS = os.path.join(BASE_DIR, "runs", "FoodInsSeg_Run1", "weights", "best.pt")
SAVE_DIR = os.path.join(BASE_DIR, "runs", "predict")

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
