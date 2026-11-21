import cv2
import requests
from deepface import DeepFace

API_BASE = "http://127.0.0.1:5001"
ADMIN_EMAIL = "keremvarli1@gmail.com"
ADMIN_PASS = "admin123"


def admin_token_al():
    resp = requests.post(
        f"{API_BASE}/api/auth/admin-login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data.get("success") or not data.get("token"):
        raise RuntimeError("Admin token alınamadı: " + str(data))
    return data["token"]


def kullanicilari_getir(token):
    resp = requests.get(
        f"{API_BASE}/api/users",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", [])


def yuz_vektoru_kaydet(token, user_id, descriptor):
    resp = requests.put(
        f"{API_BASE}/api/users/{user_id}/face",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"faceDescriptor": descriptor},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()


def main():
    try:
        token = admin_token_al()
        users = kullanicilari_getir(token)
    except Exception as e:
        print("✗ API bağlantı/yetki hatası:", e)
        return

    if not users:
        print("✗ Sistemde kayıtlı kullanıcı bulunamadı. Önce kullanıcı ekleyin.")
        return

    print("\n--- Kayıtlı Kullanıcılar ---")
    for idx, u in enumerate(users):
        vec_len = len(u.get("faceDescriptor") or [])
        print(f"{idx + 1}. {u.get('fullName')} ({u.get('email')}) [Vektör: {vec_len}]")

    try:
        secim = int(input("\nYüzü kaydedilecek kullanıcının numarasını gir: ")) - 1
        if secim < 0 or secim >= len(users):
            print("✗ Geçersiz seçim.")
            return
    except ValueError:
        print("✗ Lütfen sayı gir.")
        return

    secili_user = users[secim]
    user_id = secili_user["_id"]
    print(f"✓ Seçilen kullanıcı: {secili_user['fullName']} ({secili_user['email']})")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("✗ Kamera açılamadı.")
        return

    print("Kameraya bak. Yüzü kaydedip göndermek için 'c', çıkmak için 'q' tuşuna bas.")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            cv2.imshow("BioGate Yuz Kayit", frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("c"):
                print("⏳ Yüz vektörü çıkarılıyor...")
                try:
                    reps = DeepFace.represent(
                        img_path=frame,
                        model_name="VGG-Face",
                        enforce_detection=True,
                    )
                    descriptor = reps[0]["embedding"]
                    if not any(abs(x) > 1e-9 for x in descriptor):
                        print("✗ Geçersiz (tamamı sıfır) vektör üretildi, tekrar dene.")
                        continue

                    sonuc = yuz_vektoru_kaydet(token, user_id, descriptor)
                    print("✓", sonuc.get("message", "Yüz verisi kaydedildi."))
                    break
                except ValueError:
                    print("✗ Yüz net algılanamadı, kameraya biraz daha yaklaş ve tekrar 'c' bas.")
                except Exception as e:
                    print("✗ Kayıt hatası:", e)

            elif key == ord("q"):
                print("İşlem iptal edildi.")
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()