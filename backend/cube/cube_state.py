import random
from typing import List, Dict, Tuple
try:
    from solver.kociemba_core.facecube import FaceCube
    from solver.kociemba_core.cubiecube import CubieCube, moveCube
except ImportError:
    from ..solver.kociemba_core.facecube import FaceCube
    from ..solver.kociemba_core.cubiecube import CubieCube, moveCube

# Face mappings in standard Kociemba notation:
# 0: U (Up)
# 1: R (Right)
# 2: F (Front)
# 3: D (Down)
# 4: L (Left)
# 5: B (Back)

MOVE_NAME_TO_INDEX = {
    'U': 0,
    'R': 1,
    'F': 2,
    'D': 3,
    'L': 4,
    'B': 5
}

VALID_MOVES = [
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'L', "L'", 'L2',
    'R', "R'", 'R2',
    'F', "F'", 'F2',
    'B', "B'", 'B2'
]

SOLVED_CUBE_STRING = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'


class CubeState:
    """Logical cube state tracking 54 facelets synchronized with Kociemba's representation."""

    def __init__(self, facelet_string: str = SOLVED_CUBE_STRING):
        self.cubie = FaceCube(facelet_string).toCubieCube()

    def get_facelet_string(self) -> str:
        """Returns the 54-character Kociemba facelet string."""
        return self.cubie.toFaceCube().to_String()

    def get_face_grids(self) -> Dict[str, List[List[str]]]:
        """
        Returns a dictionary with faces 'U', 'R', 'F', 'D', 'L', 'B',
        each containing a 3x3 list of facelet letters.
        """
        s = self.get_facelet_string()
        return {
            'U': [[s[r * 3 + c] for c in range(3)] for r in range(3)],
            'R': [[s[9 + r * 3 + c] for c in range(3)] for r in range(3)],
            'F': [[s[18 + r * 3 + c] for c in range(3)] for r in range(3)],
            'D': [[s[27 + r * 3 + c] for c in range(3)] for r in range(3)],
            'L': [[s[36 + r * 3 + c] for c in range(3)] for r in range(3)],
            'B': [[s[45 + r * 3 + c] for c in range(3)] for r in range(3)],
        }

    def apply_move(self, move: str):
        """Applies a single Singmaster move (e.g. R, R', R2)."""
        move = move.strip()
        if not move:
            return

        base_face = move[0].upper()
        if base_face not in MOVE_NAME_TO_INDEX:
            raise ValueError(f"Invalid move: {move}")

        face_idx = MOVE_NAME_TO_INDEX[base_face]
        base_move_obj = moveCube[face_idx]

        if len(move) == 1:
            # 90 deg clockwise
            self.cubie.multiply(base_move_obj)
        elif move[1] == '2':
            # 180 deg
            self.cubie.multiply(base_move_obj)
            self.cubie.multiply(base_move_obj)
        elif move[1] in ("'", "i"):
            # 90 deg anticlockwise = 270 deg clockwise
            self.cubie.multiply(base_move_obj)
            self.cubie.multiply(base_move_obj)
            self.cubie.multiply(base_move_obj)
        else:
            raise ValueError(f"Unrecognized move suffix in {move}")

    def apply_moves(self, moves: List[str]):
        """Applies a sequence of moves."""
        for m in moves:
            self.apply_move(m)

    def is_solved(self) -> bool:
        """Returns True if all facelets on each face are identical."""
        s = self.get_facelet_string()
        return all(
            all(s[face_idx * 9 + i] == s[face_idx * 9 + 4] for i in range(9))
            for face_idx in range(6)
        )

    def reset(self):
        """Resets cube to solved state."""
        self.cubie = FaceCube(SOLVED_CUBE_STRING).toCubieCube()

    @staticmethod
    def generate_scramble(length: int = 20) -> List[str]:
        """
        Generates a standard WCA-style random scramble sequence of given length.
        Avoids redundant consecutive moves on the same face (e.g., R R')
        or redundant moves on opposite parallel faces (e.g., R L R).
        """
        faces = ['U', 'D', 'L', 'R', 'F', 'B']
        opposites = {
            'U': 'D', 'D': 'U',
            'L': 'R', 'R': 'L',
            'F': 'B', 'B': 'F'
        }
        modifiers = ['', "'", '2']

        scramble = []
        last_face = None
        second_last_face = None

        while len(scramble) < length:
            face = random.choice(faces)
            if face == last_face:
                continue
            if second_last_face == face and opposites[face] == last_face:
                continue

            modifier = random.choice(modifiers)
            scramble.append(f"{face}{modifier}")
            second_last_face = last_face
            last_face = face

        return scramble
