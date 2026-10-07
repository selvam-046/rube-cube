from typing import Dict, Any, List

MOVE_METADATA = {
    'U': {
        'face_name': 'TOP FACE',
        'layer_name': 'Top Layer',
        'axis': 'y',
        'layer_coord': 1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the TOP layer from LEFT → RIGHT 90° clockwise',
        'turn_sign': -1
    },
    "U'": {
        'face_name': 'TOP FACE',
        'layer_name': 'Top Layer',
        'axis': 'y',
        'layer_coord': 1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the TOP layer from RIGHT → LEFT 90° anticlockwise',
        'turn_sign': 1
    },
    'U2': {
        'face_name': 'TOP FACE',
        'layer_name': 'Top Layer',
        'axis': 'y',
        'layer_coord': 1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the TOP layer 180° (turn twice)',
        'turn_sign': -2
    },

    'D': {
        'face_name': 'BOTTOM FACE',
        'layer_name': 'Bottom Layer',
        'axis': 'y',
        'layer_coord': -1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the BOTTOM layer from RIGHT → LEFT 90° clockwise',
        'turn_sign': 1
    },
    "D'": {
        'face_name': 'BOTTOM FACE',
        'layer_name': 'Bottom Layer',
        'axis': 'y',
        'layer_coord': -1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the BOTTOM layer from LEFT → RIGHT 90° anticlockwise',
        'turn_sign': -1
    },
    'D2': {
        'face_name': 'BOTTOM FACE',
        'layer_name': 'Bottom Layer',
        'axis': 'y',
        'layer_coord': -1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the BOTTOM layer 180° (turn twice)',
        'turn_sign': 2
    },

    'R': {
        'face_name': 'RIGHT FACE',
        'layer_name': 'Right Layer',
        'axis': 'x',
        'layer_coord': 1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the RIGHT layer clockwise 90° (turn away from you)',
        'turn_sign': -1
    },
    "R'": {
        'face_name': 'RIGHT FACE',
        'layer_name': 'Right Layer',
        'axis': 'x',
        'layer_coord': 1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the RIGHT layer anticlockwise 90° (turn towards you)',
        'turn_sign': 1
    },
    'R2': {
        'face_name': 'RIGHT FACE',
        'layer_name': 'Right Layer',
        'axis': 'x',
        'layer_coord': 1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the RIGHT layer 180° (turn twice)',
        'turn_sign': -2
    },

    'L': {
        'face_name': 'LEFT FACE',
        'layer_name': 'Left Layer',
        'axis': 'x',
        'layer_coord': -1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the LEFT layer clockwise 90° (turn towards you)',
        'turn_sign': 1
    },
    "L'": {
        'face_name': 'LEFT FACE',
        'layer_name': 'Left Layer',
        'axis': 'x',
        'layer_coord': -1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the LEFT layer anticlockwise 90° (turn away from you)',
        'turn_sign': -1
    },
    'L2': {
        'face_name': 'LEFT FACE',
        'layer_name': 'Left Layer',
        'axis': 'x',
        'layer_coord': -1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the LEFT layer 180° (turn twice)',
        'turn_sign': 2
    },

    'F': {
        'face_name': 'FRONT FACE',
        'layer_name': 'Front Layer',
        'axis': 'z',
        'layer_coord': 1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the FRONT face clockwise 90°',
        'turn_sign': -1
    },
    "F'": {
        'face_name': 'FRONT FACE',
        'layer_name': 'Front Layer',
        'axis': 'z',
        'layer_coord': 1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the FRONT face anticlockwise 90°',
        'turn_sign': 1
    },
    'F2': {
        'face_name': 'FRONT FACE',
        'layer_name': 'Front Layer',
        'axis': 'z',
        'layer_coord': 1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the FRONT face 180° (turn twice)',
        'turn_sign': -2
    },

    'B': {
        'face_name': 'BACK FACE',
        'layer_name': 'Back Layer',
        'axis': 'z',
        'layer_coord': -1,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': 'Rotate the BACK face clockwise 90°',
        'turn_sign': 1
    },
    "B'": {
        'face_name': 'BACK FACE',
        'layer_name': 'Back Layer',
        'axis': 'z',
        'layer_coord': -1,
        'direction': 'Anticlockwise',
        'degrees': 90,
        'arrow': '↺',
        'description': 'Rotate the BACK face anticlockwise 90°',
        'turn_sign': -1
    },
    'B2': {
        'face_name': 'BACK FACE',
        'layer_name': 'Back Layer',
        'axis': 'z',
        'layer_coord': -1,
        'direction': 'Double Turn',
        'degrees': 180,
        'arrow': '⟳',
        'description': 'Rotate the BACK face 180° (turn twice)',
        'turn_sign': 2
    }
}


def translate_move(move_str: str, step_number: int, total_steps: int) -> Dict[str, Any]:
    """
    Converts a raw Singmaster move into a rich instruction step.
    """
    clean_move = move_str.strip()
    meta = MOVE_METADATA.get(clean_move, {
        'face_name': f"{clean_move[0]} FACE",
        'layer_name': f"{clean_move[0]} Layer",
        'axis': 'y',
        'layer_coord': 0,
        'direction': 'Clockwise',
        'degrees': 90,
        'arrow': '↻',
        'description': f"Rotate {clean_move}",
        'turn_sign': -1
    })

    return {
        'step': step_number,
        'total_steps': total_steps,
        'move': clean_move,
        'face_name': meta['face_name'],
        'layer_name': meta['layer_name'],
        'axis': meta['axis'],
        'layer_coord': meta['layer_coord'],
        'direction': meta['direction'],
        'degrees': meta['degrees'],
        'arrow': meta['arrow'],
        'description': meta['description'],
        'turn_sign': meta['turn_sign']
    }


def translate_solution(moves: List[str]) -> List[Dict[str, Any]]:
    """
    Translates an entire list of moves into structured step objects.
    """
    total = len(moves)
    return [translate_move(m, i + 1, total) for i, m in enumerate(moves)]
