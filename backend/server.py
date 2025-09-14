from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import face_recognition
import pandas as pd
from datetime import datetime
import os
import numpy as np

app = Flask(__name__)
CORS(app)  # allow frontend calls

# Directory containing known face images
known_faces_dir = 'known_faces'

# Load known faces and their names
known_faces = []
known_names = []
for p in os.listdir(known_faces_dir):
    if p.endswith('.jpg') or p.endswith('.png'):
        image = face_recognition.load_image_file(f"{known_faces_dir}/{p}")
        encodings = face_recognition.face_encodings(image)
        if encodings:
            known_faces.append(encodings[0])
            known_names.append(p.split('.')[0])

# Capture image from webcam (waits until SPACE is pressed)
def capture_image():
    cam = cv2.VideoCapture(0)
    captured_frame = None
    while True:
        ret, frame = cam.read()
        if not ret:
            print("Failed to grab frame")
            break
        cv2.imshow('Press Space to capture', frame)
        if cv2.waitKey(1) & 0xFF == ord(' '):  # capture on space
            captured_frame = frame
            break
    cam.release()
    cv2.destroyAllWindows()
    return captured_frame

# Recognize multiple faces
def recognize_faces(captured_image):
    face_locations = face_recognition.face_locations(captured_image)
    face_encodings = face_recognition.face_encodings(captured_image, face_locations)
    recognized_students = []

    for encoding in face_encodings:
        matches = face_recognition.compare_faces(known_faces, encoding)
        face_distances = face_recognition.face_distance(known_faces, encoding)

        if len(face_distances) == 0:
            continue

        best_match_index = np.argmin(face_distances)
        if matches[best_match_index] and face_distances[best_match_index] < 0.5:
            recognized_students.append(known_names[best_match_index])

    return recognized_students

# Mark attendance for recognized students
def mark_attendance(student_names, file='attendance.xlsx'):
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M:%S")

    try:
        df = pd.read_excel(file)
    except FileNotFoundError:
        df = pd.DataFrame(columns=["Name", "Date", "Time"])

    new_records = []
    for name in student_names:
        if not ((df['Name'] == name) & (df['Date'] == current_date)).any():
            new_records.append({"Name": name, "Date": current_date, "Time": current_time})

    if new_records:
        new_record_df = pd.DataFrame(new_records)
        df = pd.concat([df, new_record_df], ignore_index=True)
        df.to_excel(file, index=False)

# API route: trigger recognition + attendance
@app.route("/api/attendance/capture", methods=["POST"])
def capture_attendance():
    image = capture_image()
    if image is None:
        return jsonify({"success": False, "message": "No image captured"})

    recognized_names = recognize_faces(image)
    if not recognized_names:
        return jsonify({"success": False, "message": "No students recognized"})

    mark_attendance(recognized_names)

    return jsonify({"success": True, "students": recognized_names})

if __name__ == "__main__":
    app.run(port=5001)
