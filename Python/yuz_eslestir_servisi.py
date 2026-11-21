import base64
import math
import time
import cv2
import numpy as np
import requests
import socketio
from deepface import DeepFace
from flask import Flask, jsonify, request

API_BASE = "http://127.0.0.1:5001"
SOCKET_URL = "http://localhost:5001"
ADMIN_EMAIL = "keremvarli1@gmail.com"
ADMIN_PASS = "admin123"
THRESHOLD = 0.40
COOLDOWN_SEC = 5.0

app = Flask(__name__)
sio = socketio.Client()
cached_users = []
last_emit_time = 0.0


def cosine_distance(vec_a, vec_b):
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 1.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 1.0
    cosine_sim = max(-1.0, min(1.0, dot / (norm_a * norm_b)))
    return 1.0 - cosine_sim


def kullanicilari_yukle():
    global cached_users
    login_resp = requests.post(
        f"{API_BASE}/api/auth/admin-login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=10,
    )
    login_resp.raise_for_status()
    token = login_resp.json()["token"]

    users_resp = requests.get(
        f"{API_BASE}/api/users",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    users_resp.raise_for_status()
    users = users_resp.json().get("data", [])

    cached_users = [
        u for u in users
        if len(u.get("faceDescriptor") or []) > 0
        and any(abs(x) > 1e-9 for x in u.get("faceDescriptor"))
    ]
    print(f"✓ {len(cached_users)} adet kayıtlı yüz profili yüklendi.")


def frame_from_base64(data_url):
    if "," in data_url:
        _, encoded = data_url.split(",", 1)
    else:
        encoded = data_url
    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


@app.route("/match", methods=["POST"])
def match_face():
    global last_emit_time

    if not cached_users:
        try:
            kullanicilari_yukle()
        except Exception as e:
            return jsonify({"matched": False, "error": str(e)}), 500

    body = request.get_json(silent=True) or {}
    image_b64 = body.get("image")
    if not image_b64:
        return jsonify({"matched": False, "error": "Görüntü verisi eksik."}), 400

    frame = frame_from_base64(image_b64)
    if frame is None:
        return jsonify({"matched": False, "error": "Görüntü çözümlenemedi."}), 400

    try:
        reps = DeepFace.represent(
            img_path=frame,
            model_name="VGG-Face",
            enforce_detection=True,
            detector_backend="opencv",
        )
        live_vec = reps[0]["embedding"]

        best_user = None
        best_dist = 999.0
        for u in cached_users:
            dist = cosine_distance(live_vec, u["faceDescriptor"])
            if dist < best_dist:
                best_dist = dist
                best_user = u

        if best_user and best_dist <= THRESHOLD:
            now = time.time()
            payload = {
                "email": best_user["email"],
                "fullName": best_user["fullName"],
                "distance": round(best_dist, 4),
            }
            if sio.connected and (now - last_emit_time) >= COOLDOWN_SEC:
                sio.emit("python_face_detected", payload)
                last_emit_time = now

            return jsonify({
                "matched": True,
                "email": best_user["email"],
                "fullName": best_user["fullName"],
                "distance": round(best_dist, 4),
            })

        return jsonify({
            "matched": False,
            "distance": round(best_dist, 4) if best_user else None,
        })
    except ValueError:
        return jsonify({"matched": False, "reason": "no_face"})
    except Exception as e:
        return jsonify({"matched": False, "error": str(e)}), 500


if __name__ == "__main__":
    kullanicilari_yukle()
    try:
        sio.connect(SOCKET_URL)
        print("✓ Socket.io sunucusuna bağlandı.")
    except Exception as e:
        print("• Socket.io ilk bağlantı uyarısı:", e)
    app.run(host="127.0.0.1", port=5002, debug=False)