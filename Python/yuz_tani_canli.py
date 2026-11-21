import math
import time
import cv2
import requests
import socketio
from deepface import DeepFace

API_BASE = "http://127.0.0.1:5001"
SOCKET_URL = "http://localhost:5001"
ADMIN_EMAIL = "keremvarli1@gmail.com"
ADMIN_PASS = "admin123"
THRESHOLD = 0.40
COOLDOWN_SEC = 5.0


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


def kayitli_yuzleri_yukle():
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

    valid_users = []
    for u in users:
        desc = u.get("faceDescriptor") or []
        if len(desc) > 0 and any(abs(x) > 1e-9 for x in desc):
            valid_users.append(u)
    return valid_users


def main():
    try:
        users = kayitli_yuzleri_yukle()
    except Exception as e:
        print("✗ Kullanıcı yüz verileri alınamadı:", e)
        return

    if not users:
        print("✗ Veritabanında kayıtlı yüz vektörü olan kullanıcı yok. Önce yuz_kayit.py çalıştır.")
        return

    print(f"✓ {len(users)} adet kayıtlı yüz profili yüklendi.")

    sio = socketio.Client()
    sio.connect(SOCKET_URL)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("✗ Kamera açılamadı.")
        sio.disconnect()
        return

    print("Canlı yüz tanıma aktif. Çıkmak için 'q' tuşuna bas.")
    last_check = 0.0
    last_emit = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            now = time.time()
            # İşlemciyi yormamak için ~1.5 saniyede bir yüz taraması yap
            if now - last_check >= 1.5:
                last_check = now
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
                    for u in users:
                        dist = cosine_distance(live_vec, u["faceDescriptor"])
                        if dist < best_dist:
                            best_dist = dist
                            best_user = u

                    if best_user and best_dist <= THRESHOLD:
                        if now - last_emit >= COOLDOWN_SEC:
                            payload = {
                                "email": best_user["email"],
                                "fullName": best_user["fullName"],
                                "distance": round(best_dist, 4),
                            }
                            sio.emit("python_face_detected", payload)
                            last_emit = now
                            print(
                                f"✓ Yüz eşleşti: {best_user['fullName']} "
                                f"({best_user['email']}) | Mesafe: {best_dist:.3f}"
                            )
                    else:
                        print(f"• Tanınmayan yüz veya eşik üstü mesafe: {best_dist:.3f}")
                except ValueError:
                    pass
                except Exception as e:
                    print("✗ Analiz hatası:", e)

            cv2.imshow("BioGate Canli Yuz Tanima", frame)
            if (cv2.waitKey(1) & 0xFF) == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        sio.disconnect()


if __name__ == "__main__":
    main()