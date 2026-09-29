# 水墨神州 - 古建数字化游览平台

> **飞烟墨镜团队 (Feiyan Mojing Team)** | Inky China

一个以水墨风格为主题的中国古建筑数字化交互平台，包含3D古建浏览、全景漫游、文化游戏、数字人语音导览等功能模块。

---

## 项目概览

本项目以中国传统水墨美学为设计语言，融合 Three.js 3D 渲染、全景交互、AI 数字人等技术，打造沉浸式中国古建筑文化体验平台。涵盖全国各省代表性古建筑的数字化展示，包括建筑结构拆解、全景漫游、文化游戏和文创商城等模块。

---

## 目录结构

`
├── 2d/                          # Web 前端主目录
│   ├── index.html               # 首页入口（水墨风格主界面）
│   ├── app.py                   # Flask 后端服务（含用户系统）
│   ├── requirements.txt         # Python 依赖
│   ├── ancient_architecture.db  # SQLite 数据库
│   ├── digital_human.js         # AI 数字人语音对话模块
│   ├── games.html               # 神州游艺区（互动游戏入口）
│   ├── wenchuang.html           # 文创商城页面
│   │
│   ├── 【古建筑页面】              # 各古建筑展示页面
│   │   ├── bingmayong.html      # 秦始皇兵马俑
│   │   ├── budalagong.html      # 布达拉宫
│   │   ├── changcheng.html      # 长城
│   │   ├── foguangsi.html       # 佛光寺
│   │   ├── gugong.html          # 故宫
│   │   ├── huanghelou.html      # 黄鹤楼
│   │   ├── longmenshiku.html    # 龙门石窟
│   │   ├── penglaige.html       # 蓬莱阁
│   │   ├── shaolinsi.html       # 少林寺
│   │   ├── tengwangge.html      # 滕王阁
│   │   ├── tiantan.html         # 天坛
│   │   ├── yinxu.html           # 殷墟
│   │   ├── yueyanglou.html      # 岳阳楼
│   │   ├── zhaozhouqiao.html    # 赵州桥
│   │   ├── zhuozhengyuan.html   # 拙政园
│   │   ├── hongkong.html        # 香港
│   │   ├── macau.html           # 澳门
│   │   ├── shanghai.html        # 上海
│   │   ├── suitangluoyang.html  # 隋唐洛阳
│   │   ├── luoyangcheng_shijing.html  # 洛阳城实景
│   │   └── yinxu_*.html         # 殷墟系列（环北/皇家/墓葬/博物馆）
│   │
│   ├── yuntaishan/              # 云台山景区系列
│   │   ├── zhuyufeng.html       # 茱萸峰
│   │   ├── zhuyufeng_game.html  # 茱萸峰重阳登高游戏
│   │   ├── zhuyufeng_poem.html  # 茱萸峰诗词互动
│   │   ├── zhuyufeng_scene.html # 茱萸峰全景场景
│   │   ├── wanshansi.html       # 万善寺
│   │   ├── wanshansi_game.html  # 万善寺游戏
│   │   ├── wanshansi_scene.html # 万善寺全景场景
│   │   ├── zifanghu.html        # 子房湖
│   │   ├── zifanghu_chess.html  # 子房湖对弈游戏
│   │   ├── zifanghu_scene.html  # 子房湖全景场景
│   │   ├── diecaidong.html      # 叠彩洞
│   │   ├── hongshixia.html      # 红石峡
│   │   └── *_scene.html         # 各景点全景场景
│   │
│   ├── panorama/                # 全景漫游页面
│   │   ├── panorama_bingmayong.html   # 兵马俑全景
│   │   ├── panorama_chariot.html      # 铜车马全景
│   │   ├── panorama_museum.html       # 博物馆全景
│   │   ├── panorama_oracle.html       # 甲骨文全景
│   │   ├── panorama_shaolinsi.html    # 少林寺全景
│   │   ├── panorama_yahaomu.html      # 亚好墓全景
│   │   ├── structure_overview.html    # 建筑结构总览
│   │   └── foguangsi.html            # 佛光寺全景
│   │
│   ├── province/                # 全国各省建筑资源
│   │   ├── anhui/               # 安徽（徽光阁等）
│   │   ├── beijing/             # 北京（故宫、天坛等）
│   │   ├── henan/               # 河南（龙门石窟、少林寺等）
│   │   ├── shaanxi/             # 陕西（秦始皇陵等）
│   │   ├── shanxi/              # 山西（佛光寺等）
│   │   └── ... (全国34个省/市/自治区)
│   │   └── 每省包含：
│   │       ├── Architecture/    # 建筑素材（logo、location）
│   │       ├── Background/      # 背景图片
│   │       └── plate/           # 地图板块图片
│   │
│   ├── province_shentu/         # 神图省份地图素材
│   │
│   ├── F/                       # 古建筑 FBX 模型（中文命名）
│   ├── F_glb/                   # 古建筑 GLB 模型（数字编号）
│   ├── F_json/                  # 古建筑模型配置 JSON
│   │
│   ├── js/                      # JavaScript 公共脚本
│   ├── common/                  # 公共资源
│   ├── audio/                   # 音频资源（背景音乐、语音）
│   │   ├── beijing.mp3          # 北京地区音乐
│   │   ├── henan.mp3            # 河南地区音乐
│   │   ├── shaanxi.mp3          # 陕西地区音乐
│   │   ├── map_bgm.ogg          # 地图背景音乐
│   │   └── shaolinsi_real.mp3   # 少林寺实地录音
│   │
│   ├── video/                   # 视频资源
│   │   ├── index.mp4            # 首页背景视频
│   │   ├── fuhao_idle.mp4       # 妇好形象动画
│   │   ├── ditu/                # 省份地图视频
│   │   └── twg/                 # 滕王阁视频
│   │
│   ├── ditu/                    # 地图图片资源（各省）
│   └── *.png                    # 邮票、支付二维码、角色等图片资源
│
├── F/                           # 古建筑原始 FBX 模型（中文命名）
│   ├── 0/ 屋脊及脊饰层.fbx      # 屋顶装饰层
│   ├── 1/ 屋面瓦作层.fbx        # 屋面瓦片层
│   ├── 2/ 望板基层.fbx          # 望板基层
│   ├── 3/ 椽子层.fbx            # 椽子层
│   ├── 4/ 木构梁架层.fbx        # 木结构梁架层
│   ├── 5/ 檐口与天花层.fbx      # 檐口与天花板
│   ├── 6/ 斗拱层.fbx            # 斗拱层（核心构件）
│   ├── 7/ 门窗及围护层.fbx      # 门窗围护结构
│   ├── 8/ 柱网层.fbx            # 柱网层
│   └── 9/ 台基层.fbx            # 台基（地基）
│
├── test/                        # 测试模型文件（GLB/Max 格式）
├── yinxu_photo/                 # 殷墟实景照片
│   ├── bowuguan/                # 博物馆
│   ├── chema/                   # 车马坑
│   ├── fuhao/                   # 妇好墓
│   ├── jiagu/                   # 甲骨文
│   └── yahao/                   # 亚好墓
│
├── zhuyufeng_game.html          # 茱萸峰重阳登高独立游戏
├── zhuyufeng-denggao.png        # 茱萸峰登高活动图
├── _gen.py                      # 图片生成脚本
├── gen_images.py                # 图片批量生成工具
├── gen_proof.py                 # AIGC 生成证明
├── gen_aigc_proof.py            # AIGC 生成证明（增强版）
├── convert_fbx.py               # FBX 格式转换工具
└── convert_fbx_to_glb.py        # FBX 转 GLB 转换器
`

---

## 功能模块

### 1. 水墨古建浏览
- 以水墨画风格呈现中国经典古建筑
- 支持 3D 模型交互展示（Three.js 渲染）
- 古建筑分层结构拆解（台基→柱网→斗拱→梁架→椽子→瓦作→屋脊）

### 2. 全景漫游
- 沉浸式 360° 全景体验
- 覆盖兵马俑、铜车马、少林寺、佛光寺等多个场景
- 建筑结构互动总览

### 3. 互动游戏
- **茱萸峰重阳登高**：像素风爬山小游戏
- **子房湖对弈**：传统文化棋类游戏
- **万善寺**：景区互动探索
- **神州游艺区**：游戏合集入口

### 4. AI 数字人导览
- 语音对话交互
- 智能景点讲解
- 多语言支持

### 5. 文创商城
- 水墨风格文创产品展示
- 邮票、明信片、书籍、织锦等系列

### 6. 全国古建地图
- 覆盖全国 34 个省/市/自治区
- 各省代表性古建筑展示
- 点击地图板块进入对应省份页面

---

## 快速开始

### 环境要求

- Python 3.8+
- 浏览器（Chrome / Edge / Firefox 推荐）

### 安装与运行

`ash
# 克隆仓库
git clone https://github.com/S1mple56/feiyan-mojing-team--inky-china.git
cd feiyan-mojing-team--inky-china

# 安装依赖
cd 2d
pip install -r requirements.txt

# 启动后端服务
python app.py
`

浏览器访问 http://localhost:5000 即可进入首页。

### 直接浏览前端

大部分 HTML 页面可直接双击在浏览器中打开，无需启动后端服务：

`
打开 2d/index.html          → 首页
打开 2d/games.html          → 游戏区
打开 2d/wenchuang.html      → 文创商城
打开 2d/gugong.html         → 故宫展示
打开 2d/panorama/...        → 全景漫游
`

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端渲染 | Three.js (r128)、HTML5 Canvas |
| 后端服务 | Flask、Flask-CORS |
| 数据库 | SQLite |
| 3D 模型 | GLB / FBX 格式 |
| 设计风格 | 中国水墨画风格 |

---

## 项目结构说明

| 文件/目录 | 说明 |
|-----------|------|
| 2d/F/ | 古建筑 FBX 原始模型（英文命名，按建筑层次编号 0-9） |
| 2d/F_glb/ | 古建筑 GLB 压缩模型（用于 Web 端加载） |
| 2d/F_json/ | 模型配置 JSON 文件 |
| F/ | 古建筑 FBX 原始模型（中文命名） |
| 	est/ | 测试用 3D 模型文件 |
| yinxu_photo/ | 殷墟遗址实景照片 |
| pp.py | Flask 后端主程序 |
| digital_human.js | AI 数字人对话模块 |
| ncient_architecture.db | 古建筑数据库 |

---

## 古建筑分层结构

本项目的古建筑 3D 模型按照中国传统建筑结构进行了分层拆解：

| 编号 | 层级 | 说明 |
|------|------|------|
| 0 | 屋脊及脊饰层 | 屋顶装饰构件 |
| 1 | 屋面瓦作层 | 瓦片铺设层 |
| 2 | 望板基层 | 望板基础结构 |
| 3 | 椽子层 | 支撑屋面的椽子 |
| 4 | 木构梁架层 | 主体木结构框架 |
| 5 | 檐口与天花层 | 檐口装饰与天花 |
| 6 | 斗拱层 | 中国传统建筑核心构件 |
| 7 | 门窗及围护层 | 门窗与围护结构 |
| 8 | 柱网层 | 支撑柱网 |
| 9 | 台基层 | 建筑地基 |

---

## 许可证

本项目为飞烟墨镜团队作品。

---

*水墨神州 — 以数字之美，承千年古建之魂*
