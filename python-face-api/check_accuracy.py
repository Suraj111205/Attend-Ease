import cv2
import numpy as np
import os
import random

def test_model_accuracy(faces_dir="faces", test_split=0.2):
    print(f"\n--- Starting LBPH Model Accuracy Test ---")
    print(f"[INFO] Using {test_split*100}% of images for testing, { (1-test_split)*100 }% for training.")
    
    if not os.path.exists(faces_dir):
        print(f"[ERROR] Directory '{faces_dir}' not found.")
        return

    # Prepare data storage
    all_faces = []
    all_labels = []
    label_map = {}
    current_label = 0

    # Collect ALL images first
    for person_rollno in os.listdir(faces_dir):
        person_folder = os.path.join(faces_dir, person_rollno)
        if not os.path.isdir(person_folder):
            continue

        if person_rollno not in label_map:
            label_map[person_rollno] = current_label
            current_label += 1

        for img_file in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_file)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            
            if img is not None:
                all_faces.append(img)
                all_labels.append(label_map[person_rollno])

    if len(all_faces) == 0:
        print("[ERROR] No face images found to train/test.")
        return

    # Shuffle data to ensure random split
    combined_data = list(zip(all_faces, all_labels))
    random.shuffle(combined_data)
    all_faces, all_labels = zip(*combined_data)

    # Split into Train / Test sets
    split_index = int(len(all_faces) * (1 - test_split))
    
    train_faces = all_faces[:split_index]
    train_labels = all_labels[:split_index]
    
    test_faces = all_faces[split_index:]
    test_labels = all_labels[split_index:]

    print(f"[INFO] Total Images: {len(all_faces)}")
    print(f"[INFO] Training Images: {len(train_faces)}")
    print(f"[INFO] Testing Images: {len(test_faces)}")

    if len(test_faces) == 0:
        print("[ERROR] Not enough images to create a test split. Try adding more photos per student.")
        return

    # Train the model identically to app.py
    print("\n[INFO] Training LBPH Model on 80% data...")
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(list(train_faces), np.array(train_labels))
    
    # Reverse label map for lookup: integer -> rollno
    label_reverse_map = {v: k for k, v in label_map.items()}

    # Run predictions on the 20% holdout test set
    print("[INFO] Running predictions on 20% holdout test dataset...\n")
    
    correct_predictions = 0
    total_predictions = len(test_faces)
    
    print("-" * 65)
    print(f"{'Actual Roll No':<18} | {'Predicted Roll No':<20} | {'Confidence':<12} | {'Result'}")
    print("-" * 65)

    for i in range(total_predictions):
        test_img = test_faces[i]
        actual_label = test_labels[i]
        actual_rollno = label_reverse_map[actual_label]

        predicted_label, confidence = recognizer.predict(test_img)
        predicted_rollno = label_reverse_map.get(predicted_label, "Unknown")
        
        is_correct = (predicted_rollno == actual_rollno)
        if is_correct:
            correct_predictions += 1
            result_str = "\033[92mPASS\033[0m" # Green PASS
        else:
            result_str = "\033[91mFAIL\033[0m" # Red FAIL

        print(f"{actual_rollno:<18} | {predicted_rollno:<20} | {int(confidence):<12} | {result_str}")

    print("-" * 65)
    
    # Calculate Final Accuracy
    accuracy_percentage = (correct_predictions / total_predictions) * 100
    
    print(f"\n--- Final Results ---")
    print(f"Correct Guesses: {correct_predictions}")
    print(f"Incorrect Guesses: {total_predictions - correct_predictions}")
    print(f"Total Test Images: {total_predictions}")
    print(f"MODEL ACCURACY: {accuracy_percentage:.2f}%")

if __name__ == "__main__":
    test_model_accuracy()
