import pyautogui
import time

while True:
    x, y = pyautogui.position()
    print(f"Mouse position: X={x}, Y={y}")
    time.sleep(0.1)  # Update every 100ms