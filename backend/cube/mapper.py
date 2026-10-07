from typing import Dict, List, Tuple, Optional
from collections import Counter
try:
    from solver.kociemba_core.tools import verify
except ImportError:
    from ..solver.kociemba_core.tools import verify

# Standard Western color scheme center colors
DEFAULT_CENTER_COLORS = {
    'U': 'white',
    'R': 'red',
    'F': 'green',
    'D': 'yellow',
    'L': 'orange',
    'B': 'blue'
}

class CubeMapper:
    """
    Maps scanned face color arrays to Kociemba facelet string (U, R, F, D, L, B).
    Uses center sticker of each face to determine the color-to-face mapping.
    """

    @staticmethod
    def build_color_mapping(faces: Dict[str, List[List[str]]]) -> Dict[str, str]:
        """
        Extracts center sticker color from each of the 6 faces (Front, Right, Back, Left, Up, Down)
        and builds a map: color_name -> Kociemba face code ('U', 'R', 'F', 'D', 'L', 'B').
        """
        # Center sticker of a 3x3 face is at [1][1] or index 4
        face_name_to_kociemba = {
            'up': 'U',
            'right': 'R',
            'front': 'F',
            'down': 'D',
            'left': 'L',
            'back': 'B'
        }

        color_to_code = {}
        for face_name, kociemba_code in face_name_to_kociemba.items():
            grid = faces.get(face_name.lower()) or faces.get(face_name.capitalize()) or faces.get(kociemba_code)
            if not grid:
                raise ValueError(f"Missing scanned face data for: {face_name}")
            
            # Support both 3x3 nested list or flat 9-item list
            if isinstance(grid[0], list):
                center_color = grid[1][1].strip().lower()
            else:
                center_color = grid[4].strip().lower()

            if center_color in color_to_code:
                raise ValueError(
                    f"Duplicate center color detected: '{center_color}' appears on both "
                    f"face '{color_to_code[center_color]}' and face '{kociemba_code}'."
                )
            color_to_code[center_color] = kociemba_code

        return color_to_code

    @staticmethod
    def faces_to_kociemba_string(faces: Dict[str, List[List[str]]]) -> Tuple[str, Dict[str, str]]:
        """
        Converts 6 face color grids into the standard 54-character Kociemba string.
        Returns: (kociemba_string, color_to_code_map)
        Order of output: U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
        """
        color_map = CubeMapper.build_color_mapping(faces)

        order = ['up', 'right', 'front', 'down', 'left', 'back']
        face_code_order = ['U', 'R', 'F', 'D', 'L', 'B']

        facelet_chars = []
        for face_name in order:
            grid = faces.get(face_name) or faces.get(face_name.capitalize()) or faces.get(face_name[0].upper())
            flat_face = []
            if isinstance(grid[0], list):
                for row in grid:
                    flat_face.extend(row)
            else:
                flat_face = list(grid)

            for color in flat_face:
                c_norm = color.strip().lower()
                if c_norm not in color_map:
                    raise ValueError(
                        f"Unrecognized color '{c_norm}' on face '{face_name}'. "
                        f"Valid recognized center colors are: {list(color_map.keys())}"
                    )
                facelet_chars.append(color_map[c_norm])

        return "".join(facelet_chars), color_map
