from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Any
import base64
import os
import sys

# Ensure backend directory is in sys.path for direct script and module execution
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from cube.cube_state import CubeState, SOLVED_CUBE_STRING
from cube.validator import CubeValidator
from solver.kociemba_solver import KociembaSolver
from camera.scanner import FaceScanner


app = FastAPI(title="AI Rubik's Cube Solver API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

solver = KociembaSolver()


class Base64ScanRequest(BaseModel):
    image: str
    face_name: Optional[str] = None


class FacesPayload(BaseModel):
    faces: Dict[str, Any]


class SolvePayload(BaseModel):
    faces: Optional[Dict[str, Any]] = None
    kociemba_string: Optional[str] = None


class ScramblePayload(BaseModel):
    length: Optional[int] = 20


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "rubiks-cube-solver-api"}


@app.post("/api/scan-face")
async def scan_face(payload: Base64ScanRequest):
    """
    Scans a cube face image from a base64 string.
    Uses OpenCV to rectify perspective, sample center stickers, classify colors, and annotate.
    """
    if not payload.image:
        raise HTTPException(status_code=400, detail="No image provided.")

    raw_b64 = payload.image
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        image_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    try:
        img = FaceScanner.decode_image(image_bytes)
        result = FaceScanner.process_face_image(img)
        if payload.face_name:
            result['face_name'] = payload.face_name
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")


@app.post("/api/scan-face-upload")
async def scan_face_upload(file: UploadFile = File(...), face_name: Optional[str] = Form(None)):
    """
    Alternative endpoint for direct multipart/form-data file uploads.
    """
    try:
        image_bytes = await file.read()
        img = FaceScanner.decode_image(image_bytes)
        result = FaceScanner.process_face_image(img)
        if face_name:
            result['face_name'] = face_name
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")


@app.post("/api/validate-cube")
def validate_cube(payload: FacesPayload):
    """
    Validates all 6 scanned faces for:
    - 54 total stickers
    - 9 of each color
    - 6 unique center stickers
    - Mathematical solvability in Kociemba group
    """
    faces = payload.faces
    is_valid, err_msg, kociemba_str = CubeValidator.validate_scanned_faces(faces)
    _, _, counts = CubeValidator.validate_raw_colors(faces)

    return {
        "valid": is_valid,
        "error": err_msg,
        "color_counts": counts,
        "kociemba_string": kociemba_str
    }


@app.post("/api/solve")
def solve_cube(payload: SolvePayload):
    """
    Solves a given cube state (from scanned faces or a 54-char Kociemba string).
    Returns move sequence and step-by-step human explanations.
    """
    kociemba_str = payload.kociemba_string

    if not kociemba_str and payload.faces:
        is_valid, err_msg, mapped_str = CubeValidator.validate_scanned_faces(payload.faces)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg or "Invalid cube state.")
        kociemba_str = mapped_str

    if not kociemba_str:
        raise HTTPException(status_code=400, detail="Must provide either 'faces' or 'kociemba_string'.")

    # Solvability check
    is_valid, math_err, _ = CubeValidator.validate_kociemba_string(kociemba_str)
    if not is_valid:
        raise HTTPException(status_code=400, detail=math_err)

    try:
        raw_moves, steps = solver.solve(kociemba_str)
        return {
            "success": True,
            "solution": " ".join(raw_moves),
            "moves": raw_moves,
            "move_count": len(raw_moves),
            "steps": steps,
            "kociemba_string": kociemba_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solver error: {str(e)}")


@app.post("/api/scramble")
def get_scramble(payload: Optional[ScramblePayload] = None):
    """
    Generates a valid random scramble sequence and calculates its solution.
    """
    length = payload.length if payload and payload.length else 20
    scramble_moves = CubeState.generate_scramble(length)

    state = CubeState()
    state.apply_moves(scramble_moves)
    scrambled_string = state.get_facelet_string()

    raw_moves, steps = solver.solve(scrambled_string)

    return {
        "scramble_moves": scramble_moves,
        "scramble_string": " ".join(scramble_moves),
        "facelet_string": scrambled_string,
        "face_grids": state.get_face_grids(),
        "solution_moves": raw_moves,
        "solution_steps": steps,
        "move_count": len(raw_moves)
    }


@app.post("/api/reset")
def reset_cube():
    """Returns the solved cube state."""
    state = CubeState()
    return {
        "facelet_string": SOLVED_CUBE_STRING,
        "face_grids": state.get_face_grids(),
        "is_solved": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
