import sys
from pathlib import Path

# Add backend directory to sys.path
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import numpy as np
from cube.cube_state import CubeState, SOLVED_CUBE_STRING
from solver.kociemba_solver import KociembaSolver
from cube.validator import CubeValidator
from camera.scanner import FaceScanner



def test_basic_move_invariants():
    """Test that applying a 90-degree turn 4 times returns to solved state."""
    moves_to_test = ['U', 'D', 'L', 'R', 'F', 'B']
    for m in moves_to_test:
        state = CubeState()
        for _ in range(4):
            state.apply_move(m)
        assert state.is_solved(), f"Applying {m} 4 times did not result in solved state."


def test_inverse_moves():
    """Test that a move followed by its inverse returns to solved state."""
    pairs = [
        ('R', "R'"),
        ('U', "U'"),
        ('F', "F'"),
        ('D', "D'"),
        ('L', "L'"),
        ('B', "B'"),
        ('U2', 'U2'),
        ('R2', 'R2')
    ]
    for m1, m2 in pairs:
        state = CubeState()
        state.apply_move(m1)
        state.apply_move(m2)
        assert state.is_solved(), f"Applying {m1} then {m2} did not result in solved state."


def test_sexy_move_commutator():
    """Test that the classic (R U R' U') commutator repeated 6 times restores the cube."""
    state = CubeState()
    sexy_move = ['R', 'U', "R'", "U'"]
    for _ in range(6):
        state.apply_moves(sexy_move)
    assert state.is_solved(), "(R U R' U') repeated 6 times must restore the cube."


def test_kociemba_scramble_and_solve():
    """Generate random scrambles, solve with Kociemba, and assert solution restores solved state."""
    solver = KociembaSolver()
    for scramble_len in [10, 15, 20]:
        state = CubeState()
        scramble = state.generate_scramble(scramble_len)
        state.apply_moves(scramble)

        moves, steps = solver.solve(state.get_facelet_string())
        assert len(moves) > 0
        assert len(steps) == len(moves)

        # Apply the solution to the scrambled state
        state.apply_moves(moves)
        assert state.is_solved(), f"Solution '{' '.join(moves)}' failed to solve scramble '{' '.join(scramble)}'."


def test_validator_with_valid_faces():
    """Valid solved faces dictionary should validate with 0 errors."""
    valid_faces = {
        'up': [['white'] * 3 for _ in range(3)],
        'right': [['red'] * 3 for _ in range(3)],
        'front': [['green'] * 3 for _ in range(3)],
        'down': [['yellow'] * 3 for _ in range(3)],
        'left': [['orange'] * 3 for _ in range(3)],
        'back': [['blue'] * 3 for _ in range(3)],
    }
    is_valid, err, kociemba_str = CubeValidator.validate_scanned_faces(valid_faces)
    assert is_valid is True
    assert err is None
    assert kociemba_str == SOLVED_CUBE_STRING


def test_validator_with_mismatched_counts():
    """If one color has 10 stickers and another has 8, validator must return False."""
    invalid_faces = {
        'up': [['white'] * 3 for _ in range(3)],
        'right': [['red'] * 3 for _ in range(3)],
        'front': [['green'] * 3 for _ in range(3)],
        'down': [['yellow'] * 3 for _ in range(3)],
        'left': [['orange'] * 3 for _ in range(3)],
        'back': [['blue'] * 3 for _ in range(3)],
    }
    # Turn one blue into red
    invalid_faces['back'][0][0] = 'red'

    is_valid, err, _ = CubeValidator.validate_scanned_faces(invalid_faces)
    assert is_valid is False
    assert "Each of the 6 colors must appear exactly 9 times" in err


def test_scanner_synthetic():
    """Test FaceScanner with synthetic 3x3 colored grid."""
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    # BGR values
    colors_bgr = [
        (240, 240, 240), (30, 30, 220), (220, 50, 20),
        (20, 220, 220), (30, 200, 30), (10, 120, 240),
        (240, 240, 240), (30, 30, 220), (30, 200, 30)
    ]
    for i, c in enumerate(colors_bgr):
        r, col = divmod(i, 3)
        img[r*100:(r+1)*100, col*100:(col+1)*100] = c

    res = FaceScanner.process_face_image(img)
    assert len(res['colors']) == 9
    assert res['grid'][0][0] == 'white'
    assert res['grid'][0][1] == 'red'
    assert res['grid'][0][2] == 'blue'
    assert res['grid'][1][0] == 'yellow'
    assert res['grid'][1][1] == 'green'
    assert res['grid'][1][2] == 'orange'
    assert res['annotated_image'].startswith('data:image/jpeg;base64,')


if __name__ == '__main__':
    print("Running Cube and Scanner unit tests...")
    test_basic_move_invariants()
    print("[OK] test_basic_move_invariants passed")
    test_inverse_moves()
    print("[OK] test_inverse_moves passed")
    test_sexy_move_commutator()
    print("[OK] test_sexy_move_commutator passed")
    test_kociemba_scramble_and_solve()
    print("[OK] test_kociemba_scramble_and_solve passed")
    test_validator_with_valid_faces()
    print("[OK] test_validator_with_valid_faces passed")
    test_validator_with_mismatched_counts()
    print("[OK] test_validator_with_mismatched_counts passed")
    test_scanner_synthetic()
    print("[OK] test_scanner_synthetic passed")
    print("\nAll 7 backend tests PASSED!")
