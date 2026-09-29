# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8")

from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"C:\Users\18780\Desktop\1234567\doc_images"
os.makedirs(OUT, exist_ok=True)

# Try to find a Chinese font
FONT_PATHS = [
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\simsun.ttc",
    r"C:\Windows\Fonts\kaiti.ttf",
]
FONT_PATH = None
for fp in FONT_PATHS:
    if os.path.exists(fp):
        FONT_PATH = fp
        break

if not FONT_PATH:
    print("No Chinese font found!")
    sys.exit(1)

print(f"Using font: {FONT_PATH}")

def font(size):
    return ImageFont.truetype(FONT_PATH, size)

# Colors
BG_DARK = (26, 26, 26)
BG_CARD = (35, 30, 25)
GOLD = (206, 174, 117)
GOLD_BRIGHT = (255, 215, 0)
INK = (19, 15, 16)
PAPER = (247, 240, 221)
WOOD = (90, 57, 34)
WHITE = (255, 255, 255)
RED = (180, 50, 50)
GREEN = (50, 140, 80)
BLUE = (50, 100, 180)
PURPLE = (120, 60, 160)

W, H = 1600, 900

def new_canvas(w=W, h=H):
    img = Image.new("RGB", (w, h), BG_DARK)
    draw = ImageDraw.Draw(img)
    # Add subtle gradient-like background
    for y in range(h):
        r = int(26 + 8 * (y / h))
        g = int(26 + 5 * (y / h))
        b = int(26 + 3 * (y / h))
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img, draw

def draw_rounded_rect(draw, xy, fill, outline=None, radius=12):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline)

def draw_box(draw, x, y, w, h, text, fill=BG_CARD, outline=GOLD, text_color=PAPER, font_size=20, bold=False):
    draw_rounded_rect(draw, (x, y, x+w, y+h), fill=fill, outline=outline, radius=10)
    f = font(font_size)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = x + (w - tw) // 2
    ty = y + (h - th) // 2
    draw.text((tx, ty), text, fill=text_color, font=f)

def draw_arrow(draw, x1, y1, x2, y2, color=GOLD, width=2):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    # arrowhead
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 10
    draw.polygon([
        (x2, y2),
        (int(x2 - size * math.cos(angle - 0.4)), int(y2 - size * math.sin(angle - 0.4))),
        (int(x2 - size * math.cos(angle + 0.4)), int(y2 - size * math.sin(angle + 0.4))),
    ], fill=color)

def draw_title(draw, text, y=30):
    f = font(36)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), text, fill=GOLD_BRIGHT, font=f)

def draw_subtitle(draw, text, y=80):
    f = font(20)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), text, fill=GOLD, font=f)

# ============================================================
# Image 1: Project Technology Architecture Overview
# ============================================================
def gen_img1():
    img, draw = new_canvas()
    draw_title(draw, "图1  水墨神州 — 项目技术架构总览")
    draw_subtitle(draw, "中国古建筑文化遗产数字化互动平台")

    # Top layer - User
    draw_box(draw, 600, 130, 400, 55, "用户（浏览器）", fill=(60, 40, 25), outline=GOLD_BRIGHT, font_size=24)

    # Frontend modules
    y = 230
    labels = ["2D 地图沙盘", "3D 古建筑展示", "360° 全景漫游", "Phaser 游戏场景", "12 款互动小游戏", "AI 对话交互"]
    x_start = 50
    bw = 230
    gap = 15
    for i, label in enumerate(labels):
        x = x_start + i * (bw + gap)
        colors = [(80, 50, 30), (50, 70, 90), (70, 50, 80), (60, 80, 50), (90, 60, 50), (50, 60, 80)]
        draw_box(draw, x, y, bw, 45, label, fill=colors[i], outline=GOLD, font_size=18)

    # Arrows from user to frontend
    for i in range(6):
        x = x_start + i * (bw + gap) + bw // 2
        draw_arrow(draw, 800, 185, x, y, color=GOLD, width=1)

    # Middle - Backend
    y2 = 330
    draw_box(draw, 100, y2, 1400, 55, "Flask 后端服务（RESTful API）", fill=(45, 35, 25), outline=GOLD_BRIGHT, font_size=24)

    # Backend modules
    y3 = 430
    backend_labels = [
        ("用户认证", RED),
        ("AI 图像生成", PURPLE),
        ("AI 对话引擎", BLUE),
        ("图像识别", GREEN),
        ("积分系统", GOLD),
        ("奖励兑换", WOOD),
    ]
    for i, (label, color) in enumerate(backend_labels):
        x = 100 + i * 235
        draw_box(draw, x, y3, 210, 45, label, fill=(color[0]//3, color[1]//3, color[2]//3), outline=color, font_size=18)

    # AI Services
    y4 = 530
    draw_box(draw, 100, y4, 680, 50, "火山引擎 AI 平台", fill=(50, 25, 50), outline=PURPLE, font_size=22)
    draw_box(draw, 150, y4+60, 280, 40, "doubao-seedream 文生图", fill=(40, 20, 40), outline=PURPLE, font_size=16)
    draw_box(draw, 460, y4+60, 280, 40, "doubao-seed 大语言模型", fill=(40, 20, 40), outline=PURPLE, font_size=16)

    # Database
    draw_box(draw, 850, y4, 300, 50, "SQLite 数据库", fill=(25, 40, 25), outline=GREEN, font_size=22)
    db_tables = ["users", "user_items", "rewards", "user_rewards"]
    for i, t in enumerate(db_tables):
        draw_box(draw, 850, y4+60+i*38, 300, 34, t, fill=(20, 35, 20), outline=GREEN, font_size=14)

    # Resources
    draw_box(draw, 1220, y4, 280, 50, "多媒体资源 (300+)", fill=(40, 35, 25), outline=WOOD, font_size=20)
    res_labels = ["PNG/JPG 图像", "GLB 3D 模型", "MP4 视频", "音频素材"]
    for i, t in enumerate(res_labels):
        draw_box(draw, 1220, y4+60+i*38, 280, 34, t, fill=(35, 30, 20), outline=WOOD, font_size=14)

    # Arrows
    draw_arrow(draw, 800, 275, 800, y2, color=GOLD, width=2)
    draw_arrow(draw, 800, y2+55, 800, y3, color=GOLD, width=2)

    # Footer
    draw_subtitle(draw, "技术栈: HTML5 + CSS3 + JS | Three.js | Phaser | Pannellum | Flask | SQLite | 火山引擎 AI", y=H-40)

    img.save(os.path.join(OUT, "图1_项目技术架构总览.png"), quality=95)
    print("  图1 done")

# ============================================================
# Image 2: Four-Layer Architecture
# ============================================================
def gen_img2():
    img, draw = new_canvas()
    draw_title(draw, "图2  系统四层架构模型")

    layers = [
        ("表现层 Presentation Layer", "2D地图沙盘 | 3D模型展示 | 全景漫游 | 游戏场景 | AI对话面板", (80, 55, 35), GOLD_BRIGHT),
        ("业务逻辑层 Business Logic Layer", "用户认证 | AI调度 | 积分计算 | 信物管理 | 奖励兑换", (50, 45, 35), GOLD),
        ("数据服务层 Data Service Layer", "SQLite: users | user_items | rewards | user_rewards", (35, 45, 50), BLUE),
        ("资源存储层 Resource Storage Layer", "省份资源 | 全景图 | 3D模型 | 游戏素材 | 音视频", (35, 50, 40), GREEN),
    ]

    for i, (name, desc, color, oc) in enumerate(layers):
        y = 150 + i * 170
        # Main box
        draw_box(draw, 150, y, 1300, 80, name, fill=color, outline=oc, font_size=28)
        # Description
        f = font(18)
        bbox = draw.textbbox((0, 0), desc, font=f)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y + 95), desc, fill=PAPER, font=f)

        # Arrow between layers
        if i < 3:
            draw_arrow(draw, 800, y + 80, 800, y + 170, color=oc, width=2)
            f2 = font(14)
            draw.text((810, y + 110), "标准化接口", fill=GOLD, font=f2)

    # Side labels
    f = font(16)
    draw.text((30, 200), "高", fill=GOLD, font=f)
    draw.text((30, 230), "内", fill=GOLD, font=f)
    draw.text((30, 260), "聚", fill=GOLD, font=f)
    draw_arrow(draw, 50, 290, 50, 600, color=GOLD, width=1)
    draw.text((30, 610), "低", fill=GOLD, font=f)
    draw.text((30, 640), "耦", fill=GOLD, font=f)
    draw.text((30, 670), "合", fill=GOLD, font=f)

    img.save(os.path.join(OUT, "图2_四层架构模型.png"), quality=95)
    print("  图2 done")

# ============================================================
# Image 3: 2D Map Sandbox System
# ============================================================
def gen_img3():
    img, draw = new_canvas()
    draw_title(draw, "图3  2D 水墨风格中国地图沙盘系统")
    draw_subtitle(draw, "HTML5 + CSS3 + 原生 JavaScript")

    # Draw a simplified China map outline (very abstract)
    # Background
    draw_rounded_rect(draw, (100, 120, 1050, 780), fill=(30, 25, 20), outline=GOLD, radius=15)

    # Province dots/provinces
    provinces = [
        ("北京", 720, 250), ("上海", 880, 420), ("广东", 750, 650),
        ("四川", 520, 500), ("陕西", 600, 380), ("河南", 700, 400),
        ("湖北", 720, 470), ("湖南", 700, 530), ("山东", 800, 340),
        ("江苏", 840, 390), ("浙江", 860, 460), ("福建", 840, 530),
        ("云南", 480, 610), ("西藏", 280, 450), ("新疆", 250, 280),
        ("甘肃", 480, 340), ("内蒙古", 600, 230), ("黑龙江", 880, 160),
        ("吉林", 860, 210), ("辽宁", 830, 260), ("山西", 680, 330),
        ("安徽", 800, 430), ("江西", 790, 510), ("广西", 680, 640),
        ("贵州", 580, 560), ("重庆", 590, 470), ("天津", 770, 270),
        ("河北", 740, 290), ("海南", 720, 730), ("台湾", 880, 570),
        ("香港", 780, 680), ("澳门", 750, 680), ("宁夏", 560, 330),
        ("青海", 400, 370),
    ]
    for name, px, py in provinces:
        draw.ellipse((px-6, py-6, px+6, py+6), fill=GOLD, outline=GOLD_BRIGHT)
        f = font(12)
        draw.text((px+8, py-6), name, fill=PAPER, font=f)

    # Role selection panel
    draw_rounded_rect(draw, (1100, 120, 1550, 350), fill=(40, 30, 25), outline=GOLD, radius=10)
    f = font(22)
    draw.text((1150, 135), "角色选择", fill=GOLD_BRIGHT, font=f)
    roles = [("青年男性", 1150, 180), ("青年女性", 1150, 230), ("老者", 1150, 280)]
    for name, rx, ry in roles:
        draw_rounded_rect(draw, (rx, ry, rx+180, ry+40), fill=(50, 40, 30), outline=GOLD, radius=8)
        draw.text((rx+20, ry+8), name, fill=PAPER, font=font(18))

    # AI avatar panel
    draw_rounded_rect(draw, (1100, 380, 1550, 550), fill=(40, 30, 25), outline=PURPLE, radius=10)
    draw.text((1150, 395), "AI 头像定制", fill=PURPLE, font=font(22))
    draw.text((1130, 440), "上传照片 → 水墨Q版角色", fill=PAPER, font=font(16))
    draw_rounded_rect(draw, (1200, 480, 1400, 530), fill=(60, 30, 60), outline=PURPLE, radius=8)
    draw.text((1240, 492), "生成头像", fill=WHITE, font=font(18))

    # Navigation panel
    draw_rounded_rect(draw, (1100, 580, 1550, 780), fill=(40, 30, 25), outline=GREEN, radius=10)
    draw.text((1150, 595), "景点导航", fill=GREEN, font=font(22))
    spots = ["长城 → 3D漫游", "少林寺 → 全景", "兵马俑 → 游戏", "更多..."]
    for i, s in enumerate(spots):
        draw.text((1130, 640 + i * 32), s, fill=PAPER, font=font(16))

    img.save(os.path.join(OUT, "图3_地图沙盘系统.png"), quality=95)
    print("  图3 done")

# ============================================================
# Image 4: 3D Architecture Display
# ============================================================
def gen_img4():
    img, draw = new_canvas()
    draw_title(draw, "图4  三维古建筑模型展示与建筑解剖系统")
    draw_subtitle(draw, "Three.js r128 + GLTFLoader + PointerLockControls")

    # 3D viewport
    draw_rounded_rect(draw, (50, 120, 1050, 780), fill=(20, 18, 15), outline=GOLD, radius=10)

    # Draw a simplified pagoda structure
    cx = 550
    # Base
    draw.polygon([(cx-150, 700), (cx+150, 700), (cx+120, 680), (cx-120, 680)], fill=(80, 60, 40), outline=GOLD)
    # Levels of pagoda
    levels = [(680, 600, 120), (600, 520, 100), (520, 440, 80), (440, 370, 60), (370, 310, 40)]
    for (bottom, top, half_w) in levels:
        # Roof
        draw.polygon([(cx-half_w-20, bottom), (cx+half_w+20, bottom), (cx+half_w, top+20), (cx-half_w, top+20)], fill=(100, 40, 30), outline=GOLD)
        # Body
        draw.rectangle((cx-half_w+10, top+20, cx+half_w-10, bottom), fill=(60, 50, 35), outline=GOLD)

    # Spire
    draw.line([(cx, 310), (cx, 250)], fill=GOLD_BRIGHT, width=3)
    draw.ellipse((cx-8, 242, cx+8, 258), fill=GOLD_BRIGHT)

    # Explosion view arrows
    draw.text((cx+170, 660), "基座", fill=GOLD, font=font(16))
    draw.text((cx+170, 560), "一层", fill=GOLD, font=font(16))
    draw.text((cx+170, 480), "二层", fill=GOLD, font=font(16))
    draw.text((cx+170, 400), "三层", fill=GOLD, font=font(16))

    # Right panel - info card
    draw_rounded_rect(draw, (1100, 120, 1550, 400), fill=(35, 28, 22), outline=GOLD, radius=10)
    draw.text((1150, 140), "建筑解剖（爆炸图）", fill=GOLD_BRIGHT, font=font(24))
    items = [
        "屋顶: 悬山/歇山/庑殿",
        "斗拱: 承重与装饰构件",
        "立柱: 木结构主体支撑",
        "基座: 台基与须弥座",
        "彩绘: 和玺/旋子/苏式",
    ]
    for i, item in enumerate(items):
        draw.text((1130, 190 + i * 38), item, fill=PAPER, font=font(18))

    # Tech panel
    draw_rounded_rect(draw, (1100, 430, 1550, 780), fill=(35, 28, 22), outline=BLUE, radius=10)
    draw.text((1150, 450), "技术实现", fill=BLUE, font=font(22))
    techs = [
        "Three.js r128 渲染引擎",
        "GLTFLoader 加载 GLB 模型",
        "PBR 物理材质渲染",
        "PointerLockControls 漫游",
        "CSS 3D Transform 爆炸图",
        "环境光 + 方向光 + 点光源",
        "渐入动画加载过渡",
    ]
    for i, t in enumerate(techs):
        draw.text((1130, 500 + i * 36), t, fill=PAPER, font=font(16))

    img.save(os.path.join(OUT, "图4_三维建筑展示系统.png"), quality=95)
    print("  图4 done")

# ============================================================
# Image 5: AI Technology Architecture
# ============================================================
def gen_img5():
    img, draw = new_canvas()
    draw_title(draw, "图5  人工智能技术集成架构")
    draw_subtitle(draw, "火山引擎 doubao-seedream + doubao-seed")

    # Four AI modules
    modules = [
        ("点土成兵", "AI 兵马俑生成", "文生图 API", RED, 100),
        ("悟道", "AI 角色扮演对话", "大语言模型 API", BLUE, 450),
        ("传送阵", "AI 图像识别", "多模态 Vision API", GREEN, 800),
        ("头像定制", "水墨风格迁移", "文生图 API", PURPLE, 1150),
    ]

    for name, desc, api, color, x in modules:
        # Module box
        draw_rounded_rect(draw, (x, 140, x+300, 350), fill=(color[0]//4, color[1]//4, color[2]//4), outline=color, radius=12)
        draw.text((x+60, 155), name, fill=WHITE, font=font(28))
        draw.text((x+30, 200), desc, fill=PAPER, font=font(18))
        draw_rounded_rect(draw, (x+20, 250, x+280, 300), fill=(color[0]//6, color[1]//6, color[2]//6), outline=color, radius=8)
        draw.text((x+50, 262), api, fill=color, font=font(16))

    # Flask backend
    draw_box(draw, 200, 420, 1200, 60, "Flask 后端服务 — API 调度中枢", fill=(45, 35, 25), outline=GOLD_BRIGHT, font_size=26)

    # Arrows from modules to Flask
    for _, _, _, color, x in modules:
        draw_arrow(draw, x+150, 350, x+150, 420, color=color, width=2)

    # Volcengine AI Platform
    draw_rounded_rect(draw, (200, 540, 1400, 750), fill=(40, 20, 40), outline=PURPLE, radius=15)
    draw.text((550, 555), "火山引擎 AI 平台", fill=GOLD_BRIGHT, font=font(30))

    # Two models
    draw_box(draw, 280, 620, 480, 50, "doubao-seedream-4-0 文生图模型", fill=(50, 25, 50), outline=PURPLE, font_size=20)
    draw_box(draw, 840, 620, 480, 50, "doubao-seed-2-0-pro 大语言模型", fill=(25, 35, 50), outline=BLUE, font_size=20)

    draw.text((350, 690), "图像生成 · 风格迁移 · 图像编辑", fill=PAPER, font=font(16))
    draw.text((900, 690), "角色扮演 · 对话交互 · 视觉理解", fill=PAPER, font=font(16))

    # Arrows
    draw_arrow(draw, 800, 480, 800, 540, color=PURPLE, width=2)

    # Auth
    draw.text((600, 770), "认证方式: Bearer Token  |  网关: ark.cn-beijing.volces.com", fill=GOLD, font=font(16))

    img.save(os.path.join(OUT, "图5_AI技术集成架构.png"), quality=95)
    print("  图5 done")

# ============================================================
# Image 6: Gamification System
# ============================================================
def gen_img6():
    img, draw = new_canvas()
    draw_title(draw, "图6  游戏化教育系统 — 12 款文化主题互动游戏")
    draw_subtitle(draw, "寓教于乐 · 传统文化与游戏机制深度融合")

    games = [
        ("吉祥菜名对对碰", "Memory 翻牌", "饮食文化", (180, 100, 50)),
        ("探秘古建拼图", "九宫格华容道", "建筑认知", (140, 130, 80)),
        ("福气连连消", "三消 (5关卡)", "民俗符号", (180, 60, 60)),
        ("日新九宫格", "井字棋 AI", "儒学精神", (140, 130, 100)),
        ("银牌试毒", "扫雷变体", "宫廷文化", (100, 130, 100)),
        ("太和殿的脊兽", "排序拖拽", "建筑装饰", (180, 130, 50)),
        ("畅音阁", "Simon记忆", "京剧文化", (160, 50, 50)),
        ("宫门关", "时机判断", "宫廷守卫", (160, 90, 50)),
        ("曲水流觞", "古诗接句", "诗词文化", (60, 100, 150)),
        ("明帝王图", "认牌记忆", "帝王知识", (140, 110, 70)),
        ("九九消寒图", "点染交互", "节气民俗", (150, 80, 120)),
        ("皇子的课表", "拖拽排序", "教育制度", (70, 90, 140)),
    ]

    cols = 4
    bw, bh = 340, 140
    gap = 30
    x_start = (W - cols * bw - (cols-1) * gap) // 2
    y_start = 130

    for i, (name, mech, culture, color) in enumerate(games):
        col = i % cols
        row = i // cols
        x = x_start + col * (bw + gap)
        y = y_start + row * (bh + gap)

        draw_rounded_rect(draw, (x, y, x+bw, y+bh), fill=(color[0]//4, color[1]//4, color[2]//4), outline=color, radius=12)

        # Number badge
        draw.ellipse((x+10, y+10, x+40, y+40), fill=color)
        draw.text((x+17, y+13), str(i+1), fill=WHITE, font=font(18))

        # Game name
        draw.text((x+50, y+12), name, fill=WHITE, font=font(22))
        # Mechanism
        draw.text((x+50, y+48), mech, fill=PAPER, font=font(16))
        # Culture
        draw_rounded_rect(draw, (x+50, y+80, x+50+len(culture)*18+20, y+110), fill=(color[0]//6, color[1]//6, color[2]//6), outline=color, radius=6)
        draw.text((x+60, y+86), culture, fill=color, font=font(16))

    img.save(os.path.join(OUT, "图6_游戏化教育系统.png"), quality=95)
    print("  图6 done")

# ============================================================
# Image 7: Database ER Diagram
# ============================================================
def gen_img7():
    img, draw = new_canvas(W, 800)
    draw_title(draw, "图7  数据库 ER 关系图")
    draw_subtitle(draw, "SQLite 四表设计 · 外键关联 · 事务安全")

    # Users table
    x, y = 100, 150
    draw_rounded_rect(draw, (x, y, x+320, y+220), fill=(50, 35, 25), outline=GOLD_BRIGHT, radius=10)
    draw.text((x+100, y+10), "users 用户表", fill=GOLD_BRIGHT, font=font(22))
    fields = ["id (PK, AUTO)", "username (UNIQUE)", "password (HASH)", "points (INT)"]
    for i, f in enumerate(fields):
        draw.text((x+20, y+50+i*36), f, fill=PAPER, font=font(16))
        draw.line([(x+10, y+48+i*36), (x+310, y+48+i*36)], fill=(60, 50, 40))

    # user_items table
    x2, y2 = 550, 150
    draw_rounded_rect(draw, (x2, y2, x2+320, y2+260), fill=(35, 45, 50), outline=BLUE, radius=10)
    draw.text((x2+60, y2+10), "user_items 信物表", fill=BLUE, font=font(22))
    fields2 = ["id (PK, AUTO)", "user_id (FK → users)", "item_name (TEXT)", "item_desc (TEXT)", "acquired_at (TS)", "UNIQUE(user_id, item)"]
    for i, f in enumerate(fields2):
        draw.text((x2+20, y2+50+i*36), f, fill=PAPER, font=font(16))
        draw.line([(x2+10, y2+48+i*36), (x2+310, y2+48+i*36)], fill=(40, 55, 60))

    # rewards table
    x3, y3 = 100, 450
    draw_rounded_rect(draw, (x3, y3, x3+320, y3+260), fill=(25, 45, 30), outline=GREEN, radius=10)
    draw.text((x3+70, y3+10), "rewards 奖励表", fill=GREEN, font=font(22))
    fields3 = ["id (PK, AUTO)", "name (TEXT)", "description (TEXT)", "required_points (INT)", "stock (INT)", "type (TEXT)"]
    for i, f in enumerate(fields3):
        draw.text((x3+20, y3+50+i*36), f, fill=PAPER, font=font(16))
        draw.line([(x3+10, y3+48+i*36), (x3+310, y3+48+i*36)], fill=(30, 55, 35))

    # user_rewards table
    x4, y4 = 550, 480
    draw_rounded_rect(draw, (x4, y4, x4+350, y4+220), fill=(45, 30, 45), outline=PURPLE, radius=10)
    draw.text((x4+50, y4+10), "user_rewards 兑换表", fill=PURPLE, font=font(22))
    fields4 = ["id (PK, AUTO)", "user_id (FK → users)", "reward_id (FK → rewards)", "redeem_code (UUID)", "redeemed_at (TS)"]
    for i, f in enumerate(fields4):
        draw.text((x4+20, y4+50+i*36), f, fill=PAPER, font=font(16))
        draw.line([(x4+10, y4+48+i*36), (x4+340, y4+48+i*36)], fill=(55, 35, 55))

    # FK arrows
    draw_arrow(draw, 420, 230, 550, 230, color=GOLD, width=3)
    draw.text((450, 210), "FK", fill=GOLD_BRIGHT, font=font(16))
    draw_arrow(draw, 260, 370, 260, 450, color=GOLD, width=3)
    draw.text((270, 400), "FK", fill=GOLD_BRIGHT, font=font(16))
    draw_arrow(draw, 420, 560, 550, 560, color=GOLD, width=3)
    draw.text((450, 540), "FK", fill=GOLD_BRIGHT, font=font(16))

    # Security note
    draw_rounded_rect(draw, (1000, 150, 1550, 500), fill=(40, 30, 25), outline=RED, radius=10)
    draw.text((1050, 170), "安全设计", fill=RED, font=font(24))
    secs = [
        "PBKDF2 密码加盐哈希",
        "参数化查询防 SQL 注入",
        "PRAGMA foreign_keys = ON",
        "try-except-finally 事务",
        "rollback 异常回滚",
        "唯一约束防重复数据",
    ]
    for i, s in enumerate(secs):
        draw.text((1030, 220+i*40), s, fill=PAPER, font=font(18))

    img.save(os.path.join(OUT, "图7_数据库ER图.png"), quality=95)
    print("  图7 done")

# ============================================================
# Image 8: UI Color System
# ============================================================
def gen_img8():
    img, draw = new_canvas()
    draw_title(draw, "图8  水墨风格 UI 视觉体系")
    draw_subtitle(draw, "中国传统水墨画色彩规范 · CSS 变量体系")

    # Color palette
    colors_data = [
        ("墨色系", [("--ink-1", (19,15,16)), ("--ink-2", (35,24,32))], "背景主色"),
        ("金色系", [("--gold-1", (206,174,117)), ("--gold-2", (255,215,0)), ("--gold-3", (139,105,20))], "边框·重点文字"),
        ("宣纸色", [("--paper", (247,240,221))], "卡片背景"),
        ("木质色", [("--wood", (90,57,34))], "按钮主色"),
    ]

    y = 140
    for name, swatches, usage in colors_data:
        draw.text((100, y), name, fill=GOLD_BRIGHT, font=font(22))
        x = 280
        for var_name, rgb in swatches:
            draw_rounded_rect(draw, (x, y, x+120, y+50), fill=rgb, outline=GOLD, radius=8)
            draw.text((x+5, y+55), var_name, fill=PAPER, font=font(13))
            draw.text((x+5, y+75), f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}", fill=GOLD, font=font(13))
            x += 160
        draw.text((x+20, y+15), usage, fill=PAPER, font=font(18))
        y += 110

    # Button styles
    y_btn = 600
    draw.text((100, y_btn), "按钮样式规范", fill=GOLD_BRIGHT, font=font(22))

    # Normal button
    draw_rounded_rect(draw, (100, y_btn+40, 350, y_btn+90), fill=(126,74,34), outline=GOLD, radius=6)
    draw.text((150, y_btn+52), "默认状态", fill=WHITE, font=font(20))

    # Hover button
    draw_rounded_rect(draw, (400, y_btn+37, 650, y_btn+93), fill=(184,116,55), outline=GOLD_BRIGHT, radius=6)
    draw.text((450, y_btn+49), "悬浮状态", fill=WHITE, font=font(20))
    draw.text((400, y_btn+100), "translateY(-2px)", fill=GOLD, font=font(14))
    draw.text((400, y_btn+120), "发光阴影", fill=GOLD, font=font(14))

    # Font
    draw.text((750, y_btn+40), "字体: KaiTi (楷体)", fill=PAPER, font=font(20))
    draw.text((750, y_btn+70), "备选: STKaiti (华文楷体)", fill=PAPER, font=font(16))

    # Gradient background
    draw.text((100, y_btn+160), "背景: 多层径向渐变叠加 → 模拟水墨晕染", fill=GOLD, font=font(18))

    # Layout
    draw.text((100, y_btn+200), "布局: CSS Grid auto-fit + minmax | Flexbox | @media 响应式断点", fill=GOLD, font=font(18))

    img.save(os.path.join(OUT, "图8_水墨风格UI体系.png"), quality=95)
    print("  图8 done")

# ============================================================
# Image 9: Innovation Highlights
# ============================================================
def gen_img9():
    img, draw = new_canvas()
    draw_title(draw, "图9  系统四大创新点总览")

    innovations = [
        ("多维技术融合", "因场景制宜的技术选型", "Three.js | Phaser | Pannellum | 原生JS", GOLD_BRIGHT, 100),
        ("AI+文化教育", "大模型深度嵌入教育场景", "角色扮演 | 图像识别 | 风格迁移 | Prompt工程", PURPLE, 340),
        ("游戏化学习", "文化主题与游戏机制耦合", "12款游戏 | 多认知维度 | 积分激励 | 关卡递进", GREEN, 580),
        ("轻量化部署", "零成本快速部署运行", "开源免费 | SQLite | Flask | CDN | 零配置", BLUE, 820),
    ]

    for name, subtitle, details, color, x in innovations:
        # Main circle-ish box
        draw_rounded_rect(draw, (x, 140, x+460, 320), fill=(color[0]//5, color[1]//5, color[2]//5), outline=color, radius=20)
        draw.text((x+120, 155), name, fill=WHITE, font=font(30))
        draw.text((x+80, 200), subtitle, fill=PAPER, font=font(20))
        draw_rounded_rect(draw, (x+30, 245, x+430, 300), fill=(color[0]//8, color[1]//8, color[2]//8), outline=color, radius=8)
        draw.text((x+50, 258), details, fill=color, font=font(15))

    # Bottom summary
    draw_rounded_rect(draw, (100, 390, 1500, 500), fill=(40, 35, 28), outline=GOLD_BRIGHT, radius=15)
    draw.text((200, 410), "核心价值: 以极低技术成本实现丰富的文化遗产数字化教育体验", fill=GOLD_BRIGHT, font=font(24))
    draw.text((250, 455), "38 页面 | 300+ 资源 | 12 游戏 | 7 全景 | 34 省份 | 4 AI 功能", fill=PAPER, font=font(18))

    # Comparison
    draw_rounded_rect(draw, (100, 530, 750, 760), fill=(50, 30, 30), outline=RED, radius=12)
    draw.text((200, 545), "传统方案", fill=RED, font=font(24))
    traditional = ["高成本商业软件授权", "专业设备与客户端安装", "独立数据库服务器运维", "专业技术团队维护"]
    for i, t in enumerate(traditional):
        draw.text((140, 590+i*38), t, fill=PAPER, font=font(17))

    draw_rounded_rect(draw, (850, 530, 1500, 760), fill=(30, 50, 35), outline=GREEN, radius=12)
    draw.text((950, 545), "本项目方案", fill=GREEN, font=font(24))
    modern = ["全部开源免费技术栈", "浏览器即可访问体验", "SQLite 零运维数据库", "数分钟完成部署上线"]
    for i, t in enumerate(modern):
        draw.text((890, 590+i*38), t, fill=PAPER, font=font(17))

    img.save(os.path.join(OUT, "图9_创新点总览.png"), quality=95)
    print("  图9 done")

# ============================================================
# Image 10: Technology Roadmap
# ============================================================
def gen_img10():
    img, draw = new_canvas(W, 800)
    draw_title(draw, "图10  技术发展路线图")
    draw_subtitle(draw, "渐进式迭代 · 每阶段产出可运行版本")

    # Timeline
    y_line = 350
    draw.line([(100, y_line), (1500, y_line)], fill=GOLD, width=4)

    # Phase markers
    phases = [
        (200, "短期", "0-6 个月", RED, [
            "全景场景扩展至 20+",
            "3D 模型库丰富",
            "移动端优化",
            "积分商城完善",
        ]),
        (600, "中期", "6-18 个月", BLUE, [
            "Flask → FastAPI 迁移",
            "WebSocket 多人互动",
            "TTS 语音合成",
            "水墨风格实时渲染",
        ]),
        (1000, "长期", "18+ 个月", GREEN, [
            "文化遗产知识图谱",
            "WebXR 增强现实",
            "AIGC 场景自动生成",
            "全国覆盖开放平台",
        ]),
    ]

    for px, name, period, color, items in phases:
        # Circle on timeline
        draw.ellipse((px-15, y_line-15, px+15, y_line+15), fill=color, outline=WHITE)
        # Phase name
        draw.text((px-30, y_line-55), name, fill=color, font=font(26))
        draw.text((px-45, y_line+25), period, fill=PAPER, font=font(16))

        # Items box
        box_y = y_line + 60
        draw_rounded_rect(draw, (px-150, box_y, px+150, box_y+200), fill=(color[0]//5, color[1]//5, color[2]//5), outline=color, radius=10)
        for i, item in enumerate(items):
            draw.text((px-130, box_y+15+i*42), item, fill=PAPER, font=font(16))

    # Progress arrow
    draw_arrow(draw, 100, 650, 1500, 650, color=GOLD_BRIGHT, width=3)
    draw.text((700, 665), "持续迭代演进", fill=GOLD_BRIGHT, font=font(20))

    # Bottom note
    draw_rounded_rect(draw, (200, 710, 1400, 780), fill=(40, 35, 28), outline=GOLD, radius=10)
    draw.text((280, 725), "可行性基础: WebGL/WebXR 浏览器支持 | AI 模型能力提升与成本下降 | 开源社区活跃迭代", fill=PAPER, font=font(18))

    img.save(os.path.join(OUT, "图10_技术发展路线图.png"), quality=95)
    print("  图10 done")

# ============================================================
# Run all
# ============================================================
print("Generating images...")
gen_img1()
gen_img2()
gen_img3()
gen_img4()
gen_img5()
gen_img6()
gen_img7()
gen_img8()
gen_img9()
gen_img10()
print("All images saved to: " + OUT)
