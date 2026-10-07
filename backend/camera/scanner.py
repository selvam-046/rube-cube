import cv2
import numpy as np
import base64
from typing import Dict, Any, Tuple, List, Optional
try:
    from camera.color_detector import ColorDetector
    from camera.perspective import find_cube_face_contour, four_point_transform
except ImportError:
    from .color_detector import ColorDetector
    from .perspective import find_cube_face_contour, four_point_transform

# High-contrast annotation color palettes
ANNOTATION_COLORS = {
    'white':  ((245, 245, 245), (20, 20, 20)),
    'yellow': (( 10, 220, 245), (20, 20, 20)),
    'red':    (( 25,  25, 225), (255, 255, 255)),
    'orange': (( 15, 125, 245), (255, 255, 255)),
    'blue':   ((225,  65,  20), (255, 255, 255)),
    'green':  (( 40, 195,  30), (20, 20, 20))
}

class FaceScanner:
    """
    Orchestrates face extraction, sticker sampling, color detection, and visual annotation.
    """

    @staticmethod
    def decode_image(image_bytes: bytes) -> np.ndarray:
        """Decodes raw image bytes or base64 into a BGR OpenCV numpy array."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from provided data.")
        return img

    @staticmethod
    def _smart_center_crop(image: np.ndarray, target_size: int) -> np.ndarray:
        """
        Smart fallback when no sharp quadrilateral contour was detected:
        Finds foreground edges or contrast center rather than blindly cropping 85%.
        """
        h, w = image.shape[:2]
        aspect = w / float(h)

        if 0.88 <= aspect <= 1.14:
            return cv2.resize(image, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)

        # Look for the center of edge activity
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        edges = cv2.Canny(blurred, 30, 100)

        # Compute centroid of edges
        pts = cv2.findNonZero(edges)
        if pts is not None and len(pts) > 50:
            x_pts = pts[:, 0, 0]
            y_pts = pts[:, 0, 1]
            med_x = int(np.median(x_pts))
            med_y = int(np.median(y_pts))
            q25_x, q75_x = np.percentile(x_pts, [20, 80])
            q25_y, q75_y = np.percentile(y_pts, [20, 80])
            spread_w = q75_x - q25_x
            spread_h = q75_y - q25_y
            crop_dim = int(max(spread_w, spread_h) * 1.25)
            crop_dim = max(180, min(crop_dim, min(h, w)))

            x1 = max(0, min(w - crop_dim, med_x - crop_dim // 2))
            y1 = max(0, min(h - crop_dim, med_y - crop_dim // 2))
            crop = image[y1:y1+crop_dim, x1:x1+crop_dim]
            if crop.size > 0:
                return cv2.resize(crop, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)

        # Standard central crop
        min_dim = min(h, w)
        crop_size = int(min_dim * 0.78)
        y_start = (h - crop_size) // 2
        x_start = (w - crop_size) // 2
        crop = image[y_start:y_start+crop_size, x_start:x_start+crop_size]
        return cv2.resize(crop, (target_size, target_size), interpolation=cv2.INTER_LANCZOS4)

    @staticmethod
    def process_face_image(image: np.ndarray, target_size: int = 300) -> Dict[str, Any]:
        """
        Processes a single camera frame or uploaded photo:
        1. Automatically detects cube face location anywhere in the photo.
        2. Rectifies perspective to target_size x target_size.
        3. Samples all 9 stickers with glare and seam rejection.
        4. Classifies each sticker using CIELAB and calibrated HSV.
        5. Returns detected colors, confidences, coordinates, and annotated image.
        """
        # Automatic cube face contour detection
        corners = find_cube_face_contour(image)
        detected_perspective = False
        face_img = None
        quad_coords = None

        if corners is not None:
            try:
                face_img = four_point_transform(image, corners, target_size)
                detected_perspective = True
                quad_coords = corners.tolist()
            except Exception:
                face_img = None

        if not detected_perspective or face_img is None:
            face_img = FaceScanner._smart_center_crop(image, target_size)

        # 3x3 grid sticker extraction
        grid_step = target_size // 3
        detected_grid = []
        confidences_grid = []
        annotated = face_img.copy()

        for r in range(3):
            row_colors = []
            row_confs = []
            for c in range(3):
                y1 = r * grid_step
                y2 = (r + 1) * grid_step
                x1 = c * grid_step
                x2 = (c + 1) * grid_step

                patch = face_img[y1:y2, x1:x2]
                color_name, median_rgb, confidence = ColorDetector.sample_patch(patch)
                row_colors.append(color_name)
                row_confs.append(round(confidence, 2))

                # Draw crisp grid annotation
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (30, 30, 30), 2)

                # Inner sampling boundary
                sy1 = y1 + int(grid_step * 0.32)
                sy2 = y1 + int(grid_step * 0.68)
                sx1 = x1 + int(grid_step * 0.32)
                sx2 = x1 + int(grid_step * 0.68)
                cv2.rectangle(annotated, (sx1, sy1), (sx2, sy2), (255, 255, 255), 1)

                # Color badge
                bg_color, text_color = ANNOTATION_COLORS.get(color_name, ((220, 220, 220), (0, 0, 0)))
                badge_center = (x1 + grid_step // 2, y1 + grid_step // 2)
                cv2.circle(annotated, badge_center, 15, bg_color, -1)
                cv2.circle(annotated, badge_center, 15, (0, 0, 0), 2)

                # Uppercase abbreviation label (e.g. W, Y, R, O, B, G)
                letter = color_name[0].upper()
                cv2.putText(
                    annotated, letter, (badge_center[0] - 6, badge_center[1] + 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, text_color, 2, cv2.LINE_AA
                )

            detected_grid.append(row_colors)
            confidences_grid.append(row_confs)

        flat_colors = [col for row in detected_grid for col in row]

        # Encode annotated image as high-quality JPEG
        _, buffer = cv2.imencode('.jpg', annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        annotated_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

        return {
            'grid': detected_grid,
            'colors': flat_colors,
            'confidences': confidences_grid,
            'annotated_image': annotated_base64,
            'perspective_detected': detected_perspective,
            'detected_quad': quad_coords
        }
