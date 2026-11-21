import cv2
from deepface import DeepFace


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("✗ Kamera açılamadı.")
        return

    print("Kamera hazır. Yüz vektörü çıkarmak için 'c', çıkmak için 'q' tuşuna bas.")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            cv2.imshow("BioGate Yuz Vektor Testi", frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("c"):
                print("⏳ Yüz vektörü hesaplanıyor...")
                try:
                    embeddings = DeepFace.represent(
                        img_path=frame,
                        model_name="VGG-Face",
                        enforce_detection=True,
                    )
                    vec = embeddings[0]["embedding"]
                    print(f"✓ Vektör çıkarıldı! Boyut: {len(vec)}, İlk 5 değer: {vec[:5]}")
                except ValueError as e:
                    print("✗ Yüz algılanamadı veya net değil:", e)
                except Exception as e:
                    print("✗ Hata oluştu:", e)

            elif key == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()