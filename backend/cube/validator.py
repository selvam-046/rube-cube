from typing import Dict, List, Tuple, Optional
from collections import Counter
try:
    from solver.kociemba_core.tools import verify
    from cube.mapper import CubeMapper
except ImportError:
    from ..solver.kociemba_core.tools import verify
    from .mapper import CubeMapper

class CubeValidator:
    """
    Validates scanned cube data and Kociemba facelet representations.
    Provides detailed human-friendly error messages when a cube cannot be solved.
    """

    VERIFY_ERROR_MESSAGES = {
        0: "Cube is solvable.",
        -1: "Sticker count error: Cube does not have exactly 9 stickers of each face color.",
        -2: "Edge piece mismatch: Not all 12 edge pieces are present exactly once.",
        -3: "Edge flip error: A single edge piece appears flipped. Please check the lighting on edge stickers.",
        -4: "Corner piece mismatch: Not all 8 corner pieces are present exactly once.",
        -5: "Corner twist error: A single corner piece appears twisted. Please check corner sticker colors.",
        -6: "Permutation parity error: Two edges or two corners appear swapped. Please re-check scanned faces."
    }

    @staticmethod
    def validate_raw_colors(faces: Dict[str, List[List[str]]]) -> Tuple[bool, Optional[str], Optional[Dict[str, int]]]:
        """
        Validates sticker counts across the 6 faces.
        Returns: (is_valid, error_message, color_counts)
        """
        required_faces = ['front', 'right', 'back', 'left', 'up', 'down']
        for rf in required_faces:
            if rf not in faces and rf.capitalize() not in faces and rf[0].upper() not in faces:
                return False, f"Missing face: '{rf}'. All 6 faces must be scanned.", None

        # Flatten all 54 stickers
        all_colors = []
        for face_name in required_faces:
            grid = faces.get(face_name) or faces.get(face_name.capitalize()) or faces.get(face_name[0].upper())
            if isinstance(grid[0], list):
                for row in grid:
                    all_colors.extend([c.strip().lower() for c in row])
            else:
                all_colors.extend([c.strip().lower() for c in grid])

        if len(all_colors) != 54:
            return False, f"Expected 54 stickers total across 6 faces, but found {len(all_colors)}.", None

        counts = dict(Counter(all_colors))

        # Check unique center colors
        try:
            color_map = CubeMapper.build_color_mapping(faces)
        except ValueError as e:
            return False, str(e), counts

        # Check that there are 6 distinct colors with 9 stickers each
        invalid_counts = {c: count for c, count in counts.items() if count != 9}
        if invalid_counts:
            details = ", ".join(f"{c}: {cnt}" for c, cnt in counts.items())
            return False, (
                f"Each of the 6 colors must appear exactly 9 times. Current counts: [{details}]. "
                f"Please check and correct the highlighted stickers."
            ), counts

        return True, None, counts

    @staticmethod
    def validate_kociemba_string(kociemba_str: str) -> Tuple[bool, Optional[str], int]:
        """
        Uses Kociemba mathematical verification to ensure the cube state is physically solvable.
        Returns: (is_valid, error_message, error_code)
        """
        if len(kociemba_str) != 54:
            return False, f"Invalid length: expected 54 characters, got {len(kociemba_str)}", -1

        code = verify(kociemba_str)
        if code == 0:
            return True, None, 0

        msg = CubeValidator.VERIFY_ERROR_MESSAGES.get(code, f"Unknown verification error code: {code}")
        return False, msg, code

    @staticmethod
    def validate_scanned_faces(faces: Dict[str, List[List[str]]]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Complete validation pipeline for scanned faces.
        Returns: (is_valid, error_message, kociemba_string)
        """
        is_color_valid, color_err, counts = CubeValidator.validate_raw_colors(faces)
        if not is_color_valid:
            return False, color_err, None

        try:
            kociemba_str, _ = CubeMapper.faces_to_kociemba_string(faces)
        except Exception as e:
            return False, f"Color mapping error: {str(e)}", None

        is_math_valid, math_err, code = CubeValidator.validate_kociemba_string(kociemba_str)
        if not is_math_valid:
            return False, math_err, kociemba_str

        return True, None, kociemba_str
