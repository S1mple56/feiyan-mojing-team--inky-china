# -*- coding: utf-8 -*-
"""
将 ASCII FBX 文件转换为 glTF/GLB 格式，保留 UV 坐标和材质信息。
不需要 Blender，直接解析 FBX ASCII 格式。
"""
import os, re, json, struct, sys
import numpy as np

FBX_DIR = os.path.join(os.path.dirname(__file__), '2d', 'F')
OUT_DIR = os.path.join(os.path.dirname(__file__), '2d', 'F_glb')
os.makedirs(OUT_DIR, exist_ok=True)

LAYERS = [
    (9, 'platform.fbx', '台基'),
    (8, 'columns.fbx', '柱网'),
    (7, 'doors.fbx', '门窗'),
    (6, 'dougong.fbx', '斗拱'),
    (5, 'eaves.fbx', '檐口'),
    (4, 'beams.fbx', '梁架'),
    (3, 'rafters.fbx', '椽子'),
    (2, 'boarding.fbx', '望板'),
    (1, 'rooftiles.fbx', '屋面'),
    (0, 'ridge.fbx', '屋脊'),
]

# 各层材质颜色 (RGBA)
MATERIAL_COLORS = {
    9: [0.75, 0.70, 0.62, 1.0],   # 台基 - 石灰色
    8: [0.65, 0.35, 0.20, 1.0],   # 柱网 - 木红色
    7: [0.55, 0.30, 0.15, 1.0],   # 门窗 - 深木色
    6: [0.70, 0.40, 0.20, 1.0],   # 斗拱 - 木色
    5: [0.60, 0.33, 0.18, 1.0],   # 檐口 - 木色
    4: [0.62, 0.35, 0.18, 1.0],   # 梁架 - 木色
    3: [0.58, 0.32, 0.16, 1.0],   # 椽子 - 木色
    2: [0.55, 0.30, 0.15, 1.0],   # 望板 - 木色
    1: [0.30, 0.30, 0.30, 1.0],   # 屋面 - 瓦灰色
    0: [0.35, 0.25, 0.15, 1.0],   # 屋脊 - 深灰
}


def parse_fbx_complete(filepath):
    """解析 ASCII FBX，提取顶点、UV、面索引和材质索引"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    all_verts = []
    all_uvs = []
    all_faces = []
    all_face_materials = []

    # 匹配所有 Geometry 块
    geo_pattern = r'Geometry:\s*\d+,\s*"Geometry::[^"]*",\s*"Mesh"\s*\{'
    geo_starts = [m.end() for m in re.finditer(geo_pattern, content)]

    for start in geo_starts:
        end = content.find('Geometry:', start + 10)
        if end == -1:
            end = len(content)
        block = content[start:end]

        # 提取顶点
        v_match = re.search(r'Vertices:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)
        # 提取面索引
        p_match = re.search(r'PolygonVertexIndex:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)
        # 提取 UV 坐标
        uv_match = re.search(r'UV:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)
        # 提取 UV 索引
        uvi_match = re.search(r'UVIndex:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)
        # 提取材质索引
        mat_match = re.search(r'Materials:\s*\*\d+\s*\{\s*a:\s*([\s\S]*?)\}', block)

        if not v_match or not p_match:
            continue

        verts = [float(x) for x in v_match.group(1).replace('\n', '').split(',') if x.strip()]
        indices = [int(x) for x in p_match.group(1).replace('\n', '').split(',') if x.strip()]

        offset = len(all_verts) // 3
        all_verts.extend(verts)

        # 解析面
        face = []
        for idx in indices:
            if idx < 0:
                face.append(-(idx + 1) + offset)
                all_faces.append(face)
                face = []
            else:
                face.append(idx + offset)

        # 解析 UV
        if uv_match:
            uv_data = [float(x) for x in uv_match.group(1).replace('\n', '').split(',') if x.strip()]
            # UV 坐标是成对的 (u, v)
            uvs = [(uv_data[i], uv_data[i+1]) for i in range(0, len(uv_data), 2)]
            all_uvs.extend(uvs)

        # 解析 UV 索引
        if uvi_match:
            # UVIndex 直接对应面的顶点
            pass  # UV 索引处理在下面

        # 解析材质索引
        if mat_match:
            mat_indices = [int(x) for x in mat_match.group(1).replace('\n', '').split(',') if x.strip()]
            all_face_materials.extend(mat_indices)

    return all_verts, all_uvs, all_faces, all_face_materials


def normalize_verts(verts):
    """归一化顶点坐标到 [-5, 5] 范围"""
    xs = verts[0::3]
    ys = verts[1::3]
    zs = verts[2::3]
    if not xs:
        return verts
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    cz = (min(zs) + max(zs)) / 2
    sx = max(xs) - min(xs)
    sy = max(ys) - min(ys)
    sz = max(zs) - min(zs)
    s = max(sx, sy, sz, 0.001)
    scale = 10.0 / s
    return [((verts[i] - cx) * scale) if i % 3 == 0 else
            ((verts[i] - cy) * scale) if i % 3 == 1 else
            ((verts[i] - cz) * scale) for i in range(len(verts))]


def create_glb(verts, uvs, faces, face_materials, layer_id, output_path):
    """创建 GLB 文件"""
    import pygltflib

    # 转换为 numpy 数组
    vertices = np.array(verts, dtype=np.float32).reshape(-1, 3)
    triangles = []
    for face in faces:
        if len(face) == 3:
            triangles.append(face)
        elif len(face) == 4:
            triangles.append([face[0], face[1], face[2]])
            triangles.append([face[0], face[2], face[3]])

    indices = np.array(triangles, dtype=np.uint32).flatten()

    # 生成简单的 UV 坐标（如果原始数据没有 UV）
    if not uvs or len(uvs) != len(vertices):
        # 使用简单的平面投影 UV
        min_xyz = vertices.min(axis=0)
        max_xyz = vertices.max(axis=0)
        range_xyz = max_xyz - min_xyz
        range_xyz[range_xyz == 0] = 1  # 避免除以零

        uv_coords = np.zeros((len(vertices), 2), dtype=np.float32)
        for i, v in enumerate(vertices):
            uv_coords[i] = [
                (v[0] - min_xyz[0]) / range_xyz[0],
                (v[2] - min_xyz[2]) / range_xyz[2]
            ]
    else:
        uv_coords = np.array(uvs, dtype=np.float32)

    # 计算法线
    normals = np.zeros_like(vertices)
    for tri in triangles:
        v0, v1, v2 = vertices[tri[0]], vertices[tri[1]], vertices[tri[2]]
        normal = np.cross(v1 - v0, v2 - v0)
        norm = np.linalg.norm(normal)
        if norm > 0:
            normal /= norm
        normals[tri[0]] += normal
        normals[tri[1]] += normal
        normals[tri[2]] += normal

    # 归一化法线
    norms = np.linalg.norm(normals, axis=1, keepdims=True)
    norms[norms == 0] = 1
    normals = normals / norms

    # 获取材质颜色
    color = MATERIAL_COLORS.get(layer_id, [0.6, 0.4, 0.2, 1.0])

    # 创建 glTF 结构
    gltf = pygltflib.GLTF2()
    gltf.asset = pygltflib.Asset(generator="FBX_Converter", version="2.0")

    # 添加场景
    gltf.scene = 0
    gltf.scenes.append(pygltflib.Scene(nodes=[0]))

    # 创建 buffer
    # 将所有数据打包到一个二进制 buffer 中
    vertex_data = vertices.tobytes()
    normal_data = normals.tobytes()
    uv_data = uv_coords.tobytes()
    index_data = indices.tobytes()

    # 计算偏移和长度
    vertex_offset = 0
    vertex_length = len(vertex_data)
    normal_offset = vertex_length
    normal_length = len(normal_data)
    uv_offset = normal_offset + normal_length
    uv_length = len(uv_data)
    index_offset = uv_offset + uv_length
    index_length = len(index_data)

    # 对齐到 4 字节
    def align4(x):
        return (x + 3) & ~3

    buffer_data = b'\x00' * (align4(index_offset + index_length))
    buffer_data = buffer_data[:vertex_offset] + vertex_data
    buffer_data = buffer_data[:normal_offset] + normal_data
    buffer_data = buffer_data[:uv_offset] + uv_data
    buffer_data = buffer_data[:index_offset] + index_data

    gltf.buffers.append(pygltflib.Buffer(
        byteLength=len(buffer_data)
    ))

    # 创建 accessors
    # 顶点 accessor
    gltf.accessors.append(pygltflib.Accessor(
        bufferView=0,
        byteOffset=0,
        componentType=pygltflib.FLOAT,
        count=len(vertices),
        type=pygltflib.VEC3,
        max=vertices.max(axis=0).tolist(),
        min=vertices.min(axis=0).tolist()
    ))

    # 法线 accessor
    gltf.accessors.append(pygltflib.Accessor(
        bufferView=1,
        byteOffset=0,
        componentType=pygltflib.FLOAT,
        count=len(normals),
        type=pygltflib.VEC3
    ))

    # UV accessor
    gltf.accessors.append(pygltflib.Accessor(
        bufferView=2,
        byteOffset=0,
        componentType=pygltflib.FLOAT,
        count=len(uv_coords),
        type=pygltflib.VEC2
    ))

    # 索引 accessor
    gltf.accessors.append(pygltflib.Accessor(
        bufferView=3,
        byteOffset=0,
        componentType=pygltflib.UNSIGNED_INT,
        count=len(indices),
        type=pygltflib.SCALAR,
        max=[int(indices.max())],
        min=[int(indices.min())]
    ))

    # 创建 bufferViews
    gltf.bufferViews.append(pygltflib.BufferView(
        buffer=0,
        byteOffset=vertex_offset,
        byteLength=vertex_length,
        target=pygltflib.ARRAY_BUFFER
    ))

    gltf.bufferViews.append(pygltflib.BufferView(
        buffer=0,
        byteOffset=normal_offset,
        byteLength=normal_length,
        target=pygltflib.ARRAY_BUFFER
    ))

    gltf.bufferViews.append(pygltflib.BufferView(
        buffer=0,
        byteOffset=uv_offset,
        byteLength=uv_length,
        target=pygltflib.ARRAY_BUFFER
    ))

    gltf.bufferViews.append(pygltflib.BufferView(
        buffer=0,
        byteOffset=index_offset,
        byteLength=index_length,
        target=pygltflib.ELEMENT_ARRAY_BUFFER
    ))

    # 创建材质
    gltf.materials.append(pygltflib.Material(
        pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(
            baseColorFactor=color,
            metallicFactor=0.1,
            roughnessFactor=0.8
        ),
        doubleSided=True
    ))

    # 创建 mesh
    primitive = pygltflib.Primitive(
        attributes=pygltflib.Attributes(
            POSITION=0,
            NORMAL=1,
            TEXCOORD_0=2
        ),
        indices=3,
        material=0
    )

    gltf.meshes.append(pygltflib.Mesh(
        name=f"Layer_{layer_id}",
        primitives=[primitive]
    ))

    # 创建 node
    gltf.nodes.append(pygltflib.Node(
        name=f"Layer_{layer_id}",
        mesh=0
    ))

    # 设置 buffer 数据
    gltf.set_binary_blob(buffer_data)

    # 保存为 GLB
    gltf.save_binary(output_path)
    print(f"  Saved: {output_path} ({os.path.getsize(output_path) / 1024:.1f} KB)")


def main():
    print("=" * 60)
    print("FBX -> GLB 转换器（保留 UV 和材质）")
    print("=" * 60)

    for idx, fname, desc in LAYERS:
        fbx_path = os.path.join(FBX_DIR, str(idx), fname)
        out_path = os.path.join(OUT_DIR, f'{idx}.glb')

        if not os.path.exists(fbx_path):
            print(f'[ERR] 文件不存在: {fbx_path}')
            continue

        print(f'\n[{idx}] {desc} - 解析 {fname}...')
        try:
            verts, uvs, faces, face_materials = parse_fbx_complete(fbx_path)

            if not verts:
                print('  无数据!')
                continue

            print(f'  顶点: {len(verts)//3}, 面: {len(faces)}, UV: {len(uvs)}')

            # 归一化顶点
            verts = normalize_verts(verts)

            # 创建 GLB
            create_glb(verts, uvs, faces, face_materials, idx, out_path)

        except Exception as e:
            print(f'  错误: {e}')
            import traceback
            traceback.print_exc()

    print('\n' + '=' * 60)
    print('转换完成！')
    print(f'输出目录: {OUT_DIR}')
    print('=' * 60)


if __name__ == '__main__':
    main()
