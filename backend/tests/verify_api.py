import urllib.request
import json
import base64
import sys
import numpy as np
import cv2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:8000/api'

def main():
    # 1. Health check
    res = urllib.request.urlopen(f'{BASE_URL}/health')
    assert res.status == 200
    print('1. Health check: OK')

    # 2. Scramble
    payload = json.dumps({'length': 15}).encode('utf-8')
    req = urllib.request.Request(f'{BASE_URL}/scramble', data=payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    scramble_data = json.loads(res.read().decode('utf-8'))
    print(f'2. Scramble generated: {scramble_data["scramble_string"]}')
    print(f'   Solution found in {scramble_data["move_count"]} moves.')
    assert scramble_data['move_count'] > 0

    # 3. Solve
    solve_payload = json.dumps({'kociemba_string': scramble_data['facelet_string']}).encode('utf-8')
    solve_req = urllib.request.Request(f'{BASE_URL}/solve', data=solve_payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(solve_req)
    solve_data = json.loads(res.read().decode('utf-8'))
    print(f'3. Solve endpoint: OK (found {solve_data["move_count"]} moves)')
    print(f'   Step 1 description: {solve_data["steps"][0]["description"]}')
    assert solve_data['success'] is True

    # 4. Scan-Face with synthetic image
    img = np.zeros((300, 300, 3), dtype=np.uint8)
    img[:] = (30, 200, 30) # Green face
    _, buf = cv2.imencode('.jpg', img)
    b64 = 'data:image/jpeg;base64,' + base64.b64encode(buf).decode('utf-8')
    scan_payload = json.dumps({'image': b64, 'face_name': 'front'}).encode('utf-8')
    scan_req = urllib.request.Request(f'{BASE_URL}/scan-face', data=scan_payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(scan_req)
    scan_data = json.loads(res.read().decode('utf-8'))
    print(f'4. Scan-face endpoint: OK (detected center: {scan_data["grid"][1][1]})')
    assert scan_data['grid'][1][1] == 'green'

    # 5. Validate Cube
    valid_faces = {
        'up': [['white']*3 for _ in range(3)],
        'right': [['red']*3 for _ in range(3)],
        'front': [['green']*3 for _ in range(3)],
        'down': [['yellow']*3 for _ in range(3)],
        'left': [['orange']*3 for _ in range(3)],
        'back': [['blue']*3 for _ in range(3)],
    }
    val_payload = json.dumps({'faces': valid_faces}).encode('utf-8')
    val_req = urllib.request.Request(f'{BASE_URL}/validate-cube', data=val_payload, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(val_req)
    val_data = json.loads(res.read().decode('utf-8'))
    print(f'5. Validate-cube endpoint: OK (valid: {val_data["valid"]})')
    assert val_data['valid'] is True

    print('\n=== ALL FASTAPI ENDPOINTS VERIFIED AND WORKING 100% ===')

if __name__ == '__main__':
    main()
