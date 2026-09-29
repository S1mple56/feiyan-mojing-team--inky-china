import os, json, re

FBX_DIR = os.path.join(os.path.dirname(__file__), '2d', 'F')
OUT_DIR = os.path.join(os.path.dirname(__file__), '2d', 'F_json')
os.makedirs(OUT_DIR, exist_ok=True)

LAYERS = [
    (9, 'platform.fbx'), (8, 'columns.fbx'), (7, 'doors.fbx'),
    (6, 'dougong.fbx'),  (5, 'eaves.fbx'),   (4, 'beams.fbx'),
    (3, 'rafters.fbx'),  (2, 'boarding.fbx'), (1, 'rooftiles.fbx'),
    (0, 'ridge.fbx'),
]

def parse_fbx(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    all_verts = []
    all_faces = []

    # 匹配所有 Geometry 块中的 Vertices 和 PolygonVertexIndex
    geo_pattern = r'Geometry:\s*\d+,\s*"Geometry::[^"]*",\s*"Mesh"\s*\{'
    geo_starts = [m.end() for m in re.finditer(geo_pattern, content)]

    for start in geo_starts:
        # 在这个 Geometry 块中找 Vertices 和 PolygonVertexIndex
        # 限制搜索范围（到下一个 Geometry 或块结束）
        end = content.find('Geometry:', start + 10)
        if end == -1:
            end = len(content)
        block = content[start:end]

        v_match = re.search(r'Vertices:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)
        p_match = re.search(r'PolygonVertexIndex:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)

        if v_match and p_match:
            verts = [float(x) for x in v_match.group(1).replace('\n', '').split(',') if x.strip()]
            indices = [int(x) for x in p_match.group(1).replace('\n', '').split(',') if x.strip()]

            offset = len(all_verts) // 3
            all_verts.extend(verts)

            face = []
            for idx in indices:
                if idx < 0:
                    face.append(-(idx + 1) + offset)
                    all_faces.append(face)
                    face = []
                else:
                    face.append(idx + offset)

    return all_verts, all_faces

def normalize(verts):
    xs = verts[0::3]; ys = verts[1::3]; zs = verts[2::3]
    if not xs: return verts
    cx = (min(xs)+max(xs))/2; cy = (min(ys)+max(ys))/2; cz = (min(zs)+max(zs))/2
    sx = max(xs)-min(xs); sy = max(ys)-min(ys); sz = max(zs)-min(zs)
    s = max(sx, sy, sz, 0.001)
    scale = 10.0 / s
    return [((verts[i]-cx)*scale) if i%3==0 else ((verts[i]-cy)*scale) if i%3==1 else ((verts[i]-cz)*scale) for i in range(len(verts))]

for idx, fname in LAYERS:
    fbx_path = os.path.join(FBX_DIR, str(idx), fname)
    out_path = os.path.join(OUT_DIR, f'{idx}.json')
    if not os.path.exists(fbx_path):
        print(f'[ERR] not found: {fbx_path}')
        continue
    print(f'Parsing {fname}...', end=' ')
    try:
        verts, faces = parse_fbx(fbx_path)
        if not verts:
            print('NO DATA')
            continue
        verts = normalize(verts)
        with open(out_path, 'w') as f:
            json.dump({'v': verts, 'f': faces}, f)
        print(f'OK  verts={len(verts)//3} faces={len(faces)}')
    except Exception as e:
        print(f'ERR: {e}')

print('Done!')
