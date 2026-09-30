from flask import Flask, render_template, Response, jsonify, send_from_directory, url_for
import cv2
import os
import time
from PIL import Image, ImageOps

app = Flask(__name__, template_folder='..')
frames_directory = os.path.join(app.root_path, 'frames')

# Buat folder jika belum ada
os.makedirs('static/results', exist_ok=True)
os.makedirs('frames', exist_ok=True)

camera = cv2.VideoCapture(0)
latest_frame = None
captured_images = []

def generate_frames():
    global latest_frame
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            frame = cv2.flip(frame, 1)
            latest_frame = frame.copy()
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/capture', methods=['POST'])
def capture():
    global latest_frame, captured_images
    if latest_frame is not None:
        captured_images.append(latest_frame.copy())
        return jsonify({"status": "success", "count": len(captured_images)})
    return jsonify({"status": "error", "message": "No frame available"}), 400

@app.route('/reset', methods=['POST'])
def reset():
    global captured_images
    captured_images = []
    return jsonify({"status": "reset"})

@app.route('/frame-library/<mode>')
def frame_library(mode):
    frame_size = (1280, 960) if mode == '4' else (1280, 1440) if mode == '6' else None
    if frame_size is None:
        return jsonify({"frames": []})

    frames = []
    for filename in sorted(os.listdir(frames_directory)):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg', '.jfif', '.webp')):
            continue
        filepath = os.path.join(frames_directory, filename)
        try:
            with Image.open(filepath) as frame:
                if frame.size == frame_size:
                    frames.append({
                        "name": filename,
                        "url": url_for('frame_file', filename=filename)
                    })
        except OSError:
            continue
    return jsonify({"frames": frames})

@app.route('/frames/<path:filename>')
def frame_file(filename):
    return send_from_directory(frames_directory, filename)

@app.route('/generate/<mode>', methods=['POST'])
def generate(mode):
    global captured_images
    if len(captured_images) != int(mode):
        return jsonify({"status": "error", "message": "Jumlah foto tidak sesuai!"}), 400

    # Convert BGR (OpenCV) to RGB (Pillow)
    pil_images = [
        ImageOps.fit(
            Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)),
            (640, 480),
            method=Image.Resampling.LANCZOS
        )
        for img in captured_images
    ]
    
    # Resolusi kamera standar 640x480
    if mode == '4':
        bg = Image.new('RGB', (1280, 960))
        bg.paste(pil_images[0], (0, 0))
        bg.paste(pil_images[1], (640, 0))
        bg.paste(pil_images[2], (0, 480))
        bg.paste(pil_images[3], (640, 480))
    elif mode == '6':
        bg = Image.new('RGB', (1280, 1440))
        bg.paste(pil_images[0], (0, 0))
        bg.paste(pil_images[1], (640, 0))
        bg.paste(pil_images[2], (0, 480))
        bg.paste(pil_images[3], (640, 480))
        bg.paste(pil_images[4], (0, 960))
        bg.paste(pil_images[5], (640, 960))

    # Simpan hasil
    filename = f"result_{int(time.time())}.jpg"
    filepath = f"static/results/{filename}"
    bg.save(filepath)
    
    captured_images = []
    return jsonify({"status": "success", "image_url": f"/static/results/{filename}"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)