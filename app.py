import os
import whisper
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# --- CONFIGURATION ---
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"mp4", "avi", "mov", "mkv"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# 1. ALLOW LARGER FILES (e.g., 500 MB)
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 2. USE 'BASE' MODEL FIRST
# 'medium' is slow on CPU. 'base' is much faster for testing connection.
# You can change back to "medium" later if you have a GPU or need higher accuracy.
print("--- SYSTEM: Loading Whisper Model (Base)... ---")
model = whisper.load_model("base")
print("--- SYSTEM: Model Loaded Successfully! Waiting for requests... ---")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/transcribe", methods=["POST"])
def transcribe_video():
    print("\n--- REQUEST: Received upload request ---")

    if "video" not in request.files:
        print("ERROR: No video part in request")
        return jsonify({"error": "No video file part"}), 400

    file = request.files["video"]

    if file.filename == "":
        print("ERROR: No filename selected")
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        print(f"STATUS: Saving file to {filepath}...")
        file.save(filepath)
        print("STATUS: File saved. Starting Whisper transcription...")

        try:
            # Run Whisper Transcription
            # This line blocks the server until finished
            result = model.transcribe(filepath)
            transcribed_text = result["text"]

            print(
                f"SUCCESS: Transcription complete! Length: {len(transcribed_text)} chars"
            )
            print(f"TEXT PREVIEW: {transcribed_text[:50]}...")

            # Clean up
            os.remove(filepath)

            return jsonify({"text": transcribed_text})
        except Exception as e:
            print(f"ERROR during transcription: {str(e)}")
            return jsonify({"error": str(e)}), 500

    print("ERROR: Invalid file type")
    return jsonify({"error": "File type not allowed"}), 400


if __name__ == "__main__":
    # threaded=True allows the server to handle multiple requests (helpful for loading)
    app.run(debug=True, port=5000, threaded=True)
