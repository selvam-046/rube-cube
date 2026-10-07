const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE_URL}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

export async function scanFace(imageBase64, faceName) {
    const res = await fetch(`${API_BASE_URL}/scan-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, face_name: faceName })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to process face image.');
    }
    return res.json();
}

export async function validateCube(faces) {
    const res = await fetch(`${API_BASE_URL}/validate-cube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faces })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Validation failed.');
    }
    return res.json();
}

export async function solveCube(faces, kociembaString = null) {
    const payload = {};
    if (kociembaString) {
        payload.kociemba_string = kociembaString;
    } else if (faces) {
        payload.faces = faces;
    }

    const res = await fetch(`${API_BASE_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Solver failed to find solution.');
    }
    return res.json();
}

export async function fetchScramble(length = 20) {
    const res = await fetch(`${API_BASE_URL}/scramble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ length })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to generate scramble.');
    }
    return res.json();
}
