import cv2
import numpy as np
from typing import Tuple, Optional, List

def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 coordinates as: [top-left, top-right, bottom-right, bottom-left].
    """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]  # bottom-right has largest sum

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right has smallest difference
    rect[3] = pts[np.argmax(diff)]  # bottom-left has largest difference

    return rect

def four_point_transform(image: np.ndarray, pts: np.ndarray, target_size: int = 300) -> np.ndarray:
    """
    Applies perspective warp to extract a top-down square view of target_size x target_size.
    """
    rect = order_points(pts)
    dst = np.array([
        [0, 0],
        [target_size - 1, 0],
        [target_size - 1, target_size - 1],
        [0, target_size - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (target_size, target_size), flags=cv2.INTER_LANCZOS4)
    return warped

def _score_quad_candidate(approx: np.ndarray, img_gray: np.ndarray, img_area: float) -> float:
    """
    Scores a 4-point contour based on:
    - Orthogonality (corners close to 90 degrees)
    - Aspect ratio (close to 1:1 square)
    - Internal edge texture (Rubik's cube has high internal grid-seam edge density)
    - Reasonable size in frame
    """
    area = cv2.contourArea(approx)
    if area < 0.01 * img_area or area > 0.98 * img_area:
        return -1.0

    # Check corner angles
    angles = []
    for i in range(4):
        p1 = approx[i]
        p2 = approx[(i + 1) % 4]
        p3 = approx[(i + 2) % 4]
        v1 = p1 - p2
        v2 = p3 - p2
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 < 5 or norm2 < 5:
            return -1.0
        cos_theta = np.abs(np.dot(v1, v2) / (norm1 * norm2 + 1e-6))
        angles.append(cos_theta)

    # 90 degrees -> cos_theta == 0
    orthogonality = max(0.0, 1.0 - float(np.mean(angles)))
    if orthogonality < 0.45:
        return -1.0

    # Aspect ratio of bounding box
    x, y, w, h = cv2.boundingRect(approx)
    if w <= 0 or h <= 0:
        return -1.0
    aspect = min(w, h) / float(max(w, h))
    if aspect < 0.65:
        return -1.0

    # Internal edge content (excluding the outer 12% perimeter)
    y_in1 = y + int(h * 0.12)
    y_in2 = y + int(h * 0.88)
    x_in1 = x + int(w * 0.12)
    x_in2 = x + int(w * 0.88)

    sub_inner_gray = img_gray[y_in1:y_in2, x_in1:x_in2]
    if sub_inner_gray.size == 0:
        return -1.0

    inner_edges = cv2.Canny(sub_inner_gray, 35, 110)
    inner_density = float(np.sum(inner_edges > 0)) / float(inner_edges.size + 1e-6)

    # A 3x3 cube face MUST have internal grid lines separating the stickers.
    # A single sticker is solid and has ~0 internal edges.
    if inner_density < 0.004 and area < 0.35 * img_area:
        return -1.0

    # Size factor: favors cubes that are reasonably visible
    size_ratio = area / img_area
    size_score = np.clip(size_ratio / 0.35, 0.2, 1.5)

    score = (orthogonality * 3.0) + (aspect * 3.0) + (inner_density * 8.0) + size_score
    return score

def _detect_from_sticker_clusters(image: np.ndarray, img_gray: np.ndarray) -> Optional[np.ndarray]:
    """
    Detects Rubik's cube face by finding clusters of small square-like sticker contours.
    """
    img_area = float(image.shape[0] * image.shape[1])
    blurred = cv2.GaussianBlur(img_gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 15, 3
    )

    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    stickers = []

    for c in contours:
        area = cv2.contourArea(c)
        # Sticker area is typically 0.1% to 12% of the image
        if 0.001 * img_area < area < 0.12 * img_area:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.04 * peri, True)
            if 4 <= len(approx) <= 6:
                x, y, w, h = cv2.boundingRect(c)
                asp = min(w, h) / float(max(w, h))
                if asp > 0.70:
                    stickers.append((x + w / 2.0, y + h / 2.0, area, x, y, w, h))

    if len(stickers) >= 4:
        # Group stickers that have similar area (within 3x of each other)
        areas = [s[2] for s in stickers]
        median_area = float(np.median(areas))
        valid_stickers = [s for s in stickers if 0.35 * median_area <= s[2] <= 2.8 * median_area]

        if len(valid_stickers) >= 4:
            pts = np.array([[s[0], s[1]] for s in valid_stickers], dtype=np.float32)
            hull = cv2.convexHull(pts)
            peri = cv2.arcLength(hull, True)
            approx = cv2.approxPolyDP(hull, 0.04 * peri, True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                return approx.reshape(4, 2)
            elif len(hull) >= 4:
                # Minimum area bounding rotated rect
                rect = cv2.minAreaRect(hull)
                box = cv2.boxPoints(rect)
                return box.astype(np.float32)

    return None

def find_cube_face_contour(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Finds the 4 corners of the cube face using:
    1. Multi-scale edge & adaptive threshold quad candidate evaluation.
    2. Sticker cluster detection.
    3. Saliency / contrast fallback.
    Returns 4 corner points [TL, TR, BR, BL] if found, else None.
    """
    h, w = image.shape[:2]
    img_area = float(h * w)
    img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    best_approx = None
    best_score = -1.0

    # Try multiple thresholding methods and block sizes
    threshold_configs = [
        # (method, block_size, C)
        (cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 11, 2),
        (cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 21, 3),
        (cv2.ADAPTIVE_THRESH_MEAN_C, 15, 3),
        (cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 31, 4),
    ]

    blurred = cv2.GaussianBlur(img_gray, (5, 5), 0)

    for method, block_size, c_val in threshold_configs:
        thresh = cv2.adaptiveThreshold(
            blurred, 255, method, cv2.THRESH_BINARY, block_size, c_val
        )
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        for c in contours:
            area = cv2.contourArea(c)
            if area < 0.015 * img_area or area > 0.96 * img_area:
                continue

            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.035 * peri, True)

            if len(approx) == 4 and cv2.isContourConvex(approx):
                pts = approx.reshape(4, 2)
                score = _score_quad_candidate(pts, img_gray, img_area)
                if score > best_score:
                    best_score = score
                    best_approx = pts

    # Also try Canny edge detector with morphological closing
    canny = cv2.Canny(blurred, 40, 120)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed = cv2.morphologyEx(canny, cv2.MORPH_CLOSE, kernel)
    canny_contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in canny_contours:
        area = cv2.contourArea(c)
        if area < 0.02 * img_area or area > 0.96 * img_area:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.035 * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            pts = approx.reshape(4, 2)
            score = _score_quad_candidate(pts, img_gray, img_area)
            if score > best_score:
                best_score = score
                best_approx = pts

    if best_approx is not None and best_score > 3.0:
        return best_approx

    # Strategy 2: Sticker cluster detection
    cluster_box = _detect_from_sticker_clusters(image, img_gray)
    if cluster_box is not None:
        return cluster_box

    return best_approx
