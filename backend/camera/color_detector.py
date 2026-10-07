import cv2
import numpy as np
from typing import Tuple, Dict, Any, List

COLOR_NAMES = ['white', 'yellow', 'red', 'orange', 'blue', 'green']

# Calibrated CIELAB reference prototypes (L, a, b) in OpenCV range [0..255]
REFERENCE_LAB = {
    'white':  (235.0, 128.0, 128.0),
    'yellow': (215.0, 124.0, 212.0),
    'orange': (165.0, 176.0, 195.0),
    'red':    (115.0, 195.0, 172.0),
    'green':  (155.0,  70.0, 172.0),
    'blue':   ( 95.0, 160.0,  58.0)
}

class ColorDetector:
    """
    State-of-the-art Rubik's Cube sticker color classifier.
    Combines:
    - CIELAB perceptual color distance (Delta E)
    - Calibrated HSV hue boundaries
    - RGB channel spread and ratio checks
    - Glare & dark bezel rejection
    """

    @staticmethod
    def classify_pixel(bgr: np.ndarray, hsv: np.ndarray, lab: np.ndarray) -> Tuple[str, float]:
        """
        Classifies a single sticker color represented in BGR, HSV, and CIELAB.
        Returns: (color_name, confidence [0..1]).
        """
        b, g, r = float(bgr[0]), float(bgr[1]), float(bgr[2])
        H, S, V = float(hsv[0]), float(hsv[1]), float(hsv[2])
        L_val, a_val, b_val = float(lab[0]), float(lab[1]), float(lab[2])

        # Chroma distance from neutral gray/white in CIELAB
        # In OpenCV LAB, neutral gray has a=128, b=128
        chroma = np.sqrt((a_val - 128.0)**2 + (b_val - 128.0)**2)
        spread = max(r, g, b) - min(r, g, b)

        # 1. WHITE: Low chroma, low saturation, balanced channels, high brightness
        if (chroma < 26.0 and V > 80.0) or \
           (S < 45.0 and V > 85.0 and spread < 42.0) or \
           (chroma < 36.0 and V > 160.0 and spread < 36.0):
            conf = 0.96 if chroma < 20 else 0.88
            return 'white', conf

        # 2. BLUE: Dominant Blue channel, b_val low in LAB, or Hue in blue range
        if (b > r * 1.15 and b > g * 0.95 and b > 60) or \
           (b_val < 112.0 and b > 60) or \
           (85.0 <= H <= 135.0 and S > 40.0):
            return 'blue', 0.96

        # 3. YELLOW: High R and G, low B (high spread), b_val very high, a_val < 135
        if (22.0 <= H <= 36.0 and S > 35.0 and g > 0.60 * r) or \
           (b_val > 158.0 and a_val < 135.0 and g > 0.65 * r and r > 90.0 and spread > 50):
            return 'yellow', 0.96

        # 4. GREEN: Dominant Green channel, low a_val in LAB, or Hue in green range (H > 36)
        if (g > r * 1.05 and g > b * 1.05 and g > 60) or \
           (36.0 < H <= 86.0 and S > 35.0):
            return 'green', 0.96

        # 5. RED vs ORANGE distinction using LAB and Hue:
        # In LAB, Red has higher a* (redness) than b* (yellowness).
        # Orange has strong b* (yellowness, b* > a*).
        is_red_hue = (H < 9.5 or H >= 165.0)
        is_orange_hue = (9.5 <= H <= 24.0)

        # 5a. RED
        if (is_red_hue and S > 45.0) or \
           (r > 100.0 and g < 0.48 * r and b < 0.55 * r) or \
           (a_val > 155.0 and (a_val >= b_val - 12.0)):
            return 'red', 0.95

        # 5b. ORANGE
        if (is_orange_hue and S > 40.0) or \
           (b_val > 155.0 and 135.0 <= a_val <= 190.0 and g >= 0.35 * r and g <= 0.78 * r):
            return 'orange', 0.94

        # Fallback: CIELAB Delta E Euclidean distance to calibrated reference colors
        best_color = 'white'
        min_dist = float('inf')
        for name, ref_lab in REFERENCE_LAB.items():
            dL = (L_val - ref_lab[0]) * 0.7
            da = (a_val - ref_lab[1]) * 1.3
            db = (b_val - ref_lab[2]) * 1.3
            dist = np.sqrt(dL**2 + da**2 + db**2)
            if dist < min_dist:
                min_dist = dist
                best_color = name

        return best_color, 0.75

    @staticmethod
    def sample_patch(patch_bgr: np.ndarray) -> Tuple[str, Tuple[int, int, int], float]:
        """
        Samples the central 35% of a sticker patch.
        Filters out glare (specular white reflections) and dark bezel seams.
        """
        h, w, _ = patch_bgr.shape
        if h < 4 or w < 4:
            return 'white', (255, 255, 255), 0.5

        # Sample inner 35% region
        y1, y2 = int(h * 0.32), int(h * 0.68)
        x1, x2 = int(w * 0.32), int(w * 0.68)
        crop = patch_bgr[y1:y2, x1:x2]

        if crop.size == 0:
            return 'white', (255, 255, 255), 0.5

        # Flatten pixels to (N, 3)
        pixels = crop.reshape(-1, 3).astype(np.float32)

        # Filter out extreme glare (very bright + very low saturation) and extreme black seams
        hsv_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV).reshape(-1, 3)
        v_channel = hsv_crop[:, 2]
        s_channel = hsv_crop[:, 1]

        # Ignore pure black bezel pixels (V < 25)
        valid_mask = v_channel > 25

        # If we have colored pixels (S > 50), ignore glare pixels (S < 30 and V > 220)
        if np.any(valid_mask & (s_channel > 50)):
            valid_mask = valid_mask & ~((s_channel < 30) & (v_channel > 220))

        valid_pixels = pixels[valid_mask]
        if len(valid_pixels) == 0:
            valid_pixels = pixels

        # Take median for robustness against outliers
        median_b = int(np.median(valid_pixels[:, 0]))
        median_g = int(np.median(valid_pixels[:, 1]))
        median_r = int(np.median(valid_pixels[:, 2]))

        bgr_median = np.array([median_b, median_g, median_r], dtype=np.uint8)
        bgr_mat = bgr_median.reshape((1, 1, 3))
        hsv_mat = cv2.cvtColor(bgr_mat, cv2.COLOR_BGR2HSV)
        lab_mat = cv2.cvtColor(bgr_mat, cv2.COLOR_BGR2LAB)

        color_name, confidence = ColorDetector.classify_pixel(
            bgr_median, hsv_mat[0, 0], lab_mat[0, 0]
        )
        return color_name, (median_r, median_g, median_b), confidence
