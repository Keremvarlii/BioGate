import time
import cv2
import socketio

sio = socketio.Client()


@sio.event
def connect():
    print("✓ Node.js Socket.io sunucusuna bağlandı.")


@sio.event
def disconnect():
    print("✗ Socket.io bağlantısı koptu.")


def main():
    sio.connect("http://localhost:5001")
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("✗ Kamera açılamadı.")
        sio.disconnect()
        return

    print("Kamera açıldı. Test sinyali göndermek için 's', çıkmak için 'q' tuşuna bas.")
    last_emit = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            cv2.imshow("BioGate Kamera Testi", frame)
            key = cv2.waitKey(1) & 0xFF

            if key == ord("s") and (time.time() - last_emit) > 2.0:
                payload = {
                    "email": "keremvarli1@gmail.com",
                    "fullName": "Abdül Kerem Varlı",
                }
                sio.emit("python_face_detected", payload)
                print("→ Sinyal gönderildi:", payload)
                last_emit = time.time()

            elif key == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        sio.disconnect()


if __name__ == "__main__":
    main()