from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

NODE_SERVER = os.getenv('NODE_SERVER', 'http://localhost:5001')

# Always resolve paths relative to this file, not the working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FACES_DIR = os.path.join(BASE_DIR, 'faces')

app = Flask(__name__)
CORS(app)

@app.route('/enroll', methods=['POST'])
def enroll_person():
    data = request.json
    rollno = data.get('rollno')
    image_data = data.get('image')

    if not rollno or not image_data:
        return jsonify({'message': 'Name or image data is missing'}), 400

    folder = os.path.join(FACES_DIR, rollno)
    os.makedirs(folder, exist_ok=True)

    try:
        try:
            img_bytes = base64.b64decode(image_data.split(',')[1])
            nparr = np.frombuffer(img_bytes, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            if img_np is None:
                raise ValueError("Image could not be decoded.")
        except Exception as e:
            return jsonify({'message': f'Invalid image format: {str(e)}'}), 400

        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        if face_cascade.empty():
            return "Server configuration error: haarcascade file not found", 500

        faces = face_cascade.detectMultiScale(img_np, 1.3, 5)

        if len(faces) == 0:
            return jsonify({'message': 'No face detected for enrollment. Please ensure your face is clearly visible.'}), 400

        count = len(os.listdir(folder)) + 1
        for (x, y, w, h) in faces:
            face = img_np[y:y+h, x:x+w]
            filename = os.path.join(folder, f"{rollno}_{count}.jpg")
            cv2.imwrite(filename, face)
            print(f"[INFO] Saved face: {filename}")
            count += 1

        return jsonify({'message': 'Enrollment complete'}), 200
    except Exception as e:
        print(f"Server Error during enrollment: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500

def train_model():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    faces = []
    labels: list[int] = []
    label_map: dict[str, int] = {}
    current_label: int = 0

    for person_rollno in os.listdir(FACES_DIR):
        person_folder = os.path.join(FACES_DIR, person_rollno)
        if not os.path.isdir(person_folder):
            continue

        if person_rollno not in label_map:
            label_map[person_rollno] = current_label
            current_label += 1  # type: ignore

        for img_file in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_file)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

            if img is None:
                continue

            faces.append(img)
            val = label_map.get(person_rollno)
            if val is not None:
                labels.append(val)

    if len(faces) == 0:
        raise ValueError("No face images found for training.")

    recognizer.train(faces, np.array(labels))
    return recognizer, {v: k for k, v in label_map.items()}

@app.route("/recognize", methods=["POST"])
def recognize():
    try:
        data = request.get_json()
        image_data = data["image"].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        recognizer, label_reverse_map = train_model()
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            face_img = gray[y:y+h, x:x+w]
            label, confidence = recognizer.predict(face_img)
            rollno = label_reverse_map.get(label, "Unknown")

            return jsonify({
                "rollno": rollno,
                "confidence": int(confidence)
            })

        return jsonify({"rollno": "No face detected"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/recognize-and-mark", methods=["POST"])
def recognize_and_mark():
    """
    Recognizes a face AND marks attendance for all conducted lectures today.
    Combines face recognition + bulk attendance marking in one call.
    """
    try:
        data = request.get_json()
        image_data = data["image"].split(",")[1]
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        recognizer, label_reverse_map = train_model()
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            face_img = gray[y:y+h, x:x+w]
            label, confidence = recognizer.predict(face_img)
            rollno = label_reverse_map.get(label, "Unknown")

            if rollno == "Unknown" or confidence > 80:
                return jsonify({"rollno": "Unknown", "confidence": int(confidence), "attendance": None})

            # Call Node.js to mark attendance for all conducted lectures
            try:
                mark_res = requests.post(
                    f"{NODE_SERVER}/api/attendance/mark-conducted",
                    json={"rollno": rollno},
                    timeout=5
                )
                mark_data = mark_res.json()
            except Exception as e:
                mark_data = {"message": f"Attendance server error: {str(e)}", "results": []}

            return jsonify({
                "rollno": rollno,
                "confidence": int(confidence),
                "attendance": mark_data
            })

        return jsonify({"rollno": "No face detected", "attendance": None})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    flask_port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host="0.0.0.0", port=flask_port, debug=False)
