# 写实角色素材与改编说明

- 真人扫描头部：**Infinite, 3D Head Scan by Lee Perry-Smith**，基于 Triplegangers / Infinite Realities 的扫描作品。
- 许可：[CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/)。原始许可全文保存在 `scan/LICENSE.txt`。
- 下载来源：[Three.js r128 · LeePerrySmith](https://github.com/mrdoob/three.js/tree/r128/examples/models/gltf/LeePerrySmith)。包括头部几何、颜色贴图和切线空间法线贴图。原始文件名分别为 `LeePerrySmith.glb`、`Map-COL.jpg`、`Infinite-Level_02_Tangent_SmoothUV.jpg`。
- 本项目改编：裁去扫描胸像的肩部，按角色比例缩放头部，替换渲染材质，组合程序化衣装、发型、眼部与关节动画；这些并非扫描原作者提供的完整角色。扫描人脸不是定制的中国古风人物面貌，也未包含面部表情绑定。
- 服装、躯体、发型、手部与关节动作：项目程序化生成。
- GLTFLoader：Three.js r128，MIT License；原始来源为 https://github.com/mrdoob/three.js/blob/r128/examples/js/loaders/GLTFLoader.js 。加载器已保存为本地文件，不依赖在线 CDN。

模型与贴图由本机提供，不把人物或玩家数据发送到外部服务。后续可在保留角色根节点与交互接口的情况下替换为经授权的完整骨骼角色。
