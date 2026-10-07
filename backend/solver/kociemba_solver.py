from typing import List, Dict, Any, Tuple
try:
    from solver.kociemba_core.search import Search
    from solver.kociemba_core.tools import verify
    from solver.move_translator import translate_solution
except ImportError:
    from .kociemba_core.search import Search
    from .kociemba_core.tools import verify
    from .move_translator import translate_solution

SOLVED_CUBE = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

class KociembaSolver:
    """
    Two-Phase Rubik's Cube Solver based on Herbert Kociemba's algorithm.
    """

    def __init__(self):
        self.search = Search()

    def solve(self, facelet_string: str, max_depth: int = 22, timeout_seconds: int = 5) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Solves the cube defined by facelet_string.
        Returns: (raw_moves_list, translated_steps_list)
        """
        facelet_string = facelet_string.strip()

        # Check if already solved
        if facelet_string == SOLVED_CUBE:
            return [], []

        # Validate solvability first
        code = verify(facelet_string)
        if code != 0:
            raise ValueError(f"Cube state cannot be solved (verification code: {code}).")

        # Run Kociemba Two-Phase search
        raw_sol = self.search.solution(facelet_string, max_depth, timeout_seconds, False)

        if not raw_sol:
            return [], []

        # Parse moves (raw_sol is e.g. "R U R' U' F2 ")
        raw_moves = [m.strip() for m in raw_sol.strip().split() if m.strip()]

        # Filter out trivial redundant markers or empty items
        translated_steps = translate_solution(raw_moves)

        return raw_moves, translated_steps
