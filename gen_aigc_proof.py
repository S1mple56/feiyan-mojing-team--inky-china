# -*- coding: utf-8 -*-
"""
仿照《童翼智驱-AIGC辅助创作过程证明》生成《水墨神州-AIGC辅助创作过程证明》
"""

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
import os

# ==================== 颜色定义 ====================
INK_DARK = RGBColor(0x13, 0x0f, 0x10)     # 浓墨
INK_LIGHT = RGBColor(0x23, 0x18, 0x20)    # 淡墨
GOLD_DARK = RGBColor(0x8b, 0x69, 0x14)    # 古铜金
GOLD_MID = RGBColor(0xce, 0xae, 0x75)     # 暗金
GOLD_BRIGHT = RGBColor(0xff, 0xd7, 0x00)  # 亮金
PAPER_BG = RGBColor(0xf7, 0xf0, 0xdd)     # 宣纸色
WOOD = RGBColor(0x5a, 0x39, 0x22)         # 木纹色
WHITE = RGBColor(0xff, 0xff, 0xff)
GRAY = RGBColor(0x66, 0x66, 0x66)

def set_cell_shading(cell, color_hex):
    shading = cell._element.get_or_add_tcPr()
    shd = shading.makeelement(qn('w:shd'), {
        qn('w:val'): 'clear',
        qn('w:color'): 'auto',
        qn('w:fill'): color_hex
    })
    shading.append(shd)

def set_paragraph_bg(paragraph, color_hex):
    """设置段落底色"""
    pPr = paragraph._element.get_or_add_pPr()
    shd = pPr.makeelement(qn('w:shd'), {
        qn('w:val'): 'clear',
        qn('w:color'): 'auto',
        qn('w:fill'): color_hex
    })
    pPr.append(shd)

def add_styled_heading(doc, text, level=1, color=INK_DARK):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = color
        run.font.name = '黑体'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    return h

def add_body_text(doc, text, indent=True, bold=False, size=10.5, color=INK_LIGHT, space_after=6):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.name = '宋体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    run.font.color.rgb = color
    run.bold = bold
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = Pt(20)
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)
    return p

def add_section_title(doc, text):
    """添加带金色竖线标记的小节标题"""
    p = doc.add_paragraph()
    run = p.add_run(f'  {text}')
    run.font.size = Pt(14)
    run.bold = True
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.color.rgb = GOLD_DARK
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(8)
    # 添加底色
    set_paragraph_bg(p, 'F7F0DD')
    return p

def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style='List Bullet')
    p.clear()
    prefix = '  ' * level
    run = p.add_run(f'{prefix}{text}')
    run.font.size = Pt(10)
    run.font.name = '宋体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    run.font.color.rgb = INK_LIGHT
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = Pt(18)
    return p

def add_info_box(doc, text, bg_color='F7F0DD'):
    """添加信息框"""
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(10)
    run.font.name = '楷体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '楷体')
    run.font.color.rgb = WOOD
    run.italic = True
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = Pt(18)
    p.paragraph_format.left_indent = Cm(1)
    p.paragraph_format.right_indent = Cm(1)
    set_paragraph_bg(p, bg_color)
    return p

def add_phase_table(doc, rows_data):
    """添加开发阶段表格"""
    table = doc.add_table(rows=1, cols=3)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # 表头
    headers = ['阶段', '时间', '核心任务']
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ''
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.size = Pt(10)
        run.bold = True
        run.font.name = '黑体'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
        run.font.color.rgb = WHITE
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_shading(cell, '130F10')

    # 数据行
    for row_data in rows_data:
        row = table.add_row()
        for i, text in enumerate(row_data):
            cell = row.cells[i]
            cell.text = ''
            p = cell.paragraphs[0]
            run = p.add_run(text)
            run.font.size = Pt(9)
            run.font.name = '宋体'
            run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
            run.font.color.rgb = INK_LIGHT
            if i == 0:
                run.bold = True
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 设置列宽
    for row in table.rows:
        row.cells[0].width = Cm(3)
        row.cells[1].width = Cm(4)
        row.cells[2].width = Cm(10)

    return table


def create_aigc_proof():
    doc = Document()

    # 默认样式
    style = doc.styles['Normal']
    style.font.name = '宋体'
    style.font.size = Pt(10.5)
    style._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    style.paragraph_format.line_spacing = Pt(20)

    # ==================== 封面 ====================
    for _ in range(6):
        doc.add_paragraph()

    # 主标题
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run('水墨神州')
    run.font.size = Pt(36)
    run.bold = True
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.color.rgb = INK_DARK

    # 英文副标题
    sub_en = doc.add_paragraph()
    sub_en.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub_en.add_run('Chinese Ink Painting Divine Land')
    run.font.size = Pt(14)
    run.font.color.rgb = GOLD_DARK
    run.font.name = 'Times New Roman'

    # 中文副标题
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run('中国古代建筑文化数字交互平台')
    run.font.size = Pt(18)
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.color.rgb = GOLD_DARK

    doc.add_paragraph()

    # 框线标题
    box = doc.add_paragraph()
    box.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = box.add_run('AIGC 辅助创作过程证明')
    run.font.size = Pt(22)
    run.bold = True
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.color.rgb = INK_DARK

    doc.add_paragraph()

    # 信息行
    for line in [
        '技术栈：HTML5 + Phaser.js + Three.js + Flask + SQLite + 火山引擎AI',
        '项目作者：赵越',
        '文档版本：V1.0',
        '编写日期：2026 年 5 月'
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(line)
        run.font.size = Pt(11)
        run.font.name = '宋体'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
        run.font.color.rgb = GRAY

    doc.add_page_break()

    # ==================== 目录 ====================
    add_styled_heading(doc, '目  录', level=1)
    doc.add_paragraph()

    toc = [
        ('一、项目简介', 3),
        ('二、AIGC 工具引入', 3),
    ('三、应用场景与实践', 4),
        ('    3.1 设计稿生成', 4),
        ('    3.2 代码生成与调试', 4),
        ('    3.3 文档与图表生成', 4),
        ('    3.4 素材与资源制作', 4),
        ('四、AIGC 辅助开发过程', 5),
        ('    4.1 阶段一：技术选型与架构设计（2026 年 3 月）', 5),
        ('    4.2 阶段二：核心功能实现（2026 年 3 月—4 月）', 5),
        ('    4.3 阶段三：AI 能力集成（2026 年 4 月）', 5),
        ('    4.4 阶段四：场景开发与素材采集（2026 年 4 月）', 6),
        ('    4.5 阶段五：游戏化系统开发（2026 年 4 月—5 月）', 6),
        ('    4.6 阶段六：文档编写与项目完善（2026 年 5 月）', 6),
        ('五、关键技术点与 AIGC 参与', 7),
        ('    5.1 Verlet 布料物理引擎', 7),
        ('    5.2 多 AI 能力集成架构', 7),
        ('    5.3 Phaser.js 游戏场景系统', 7),
        ('六、AIGC 应用自评', 8),
        ('七、后续规划', 8),
    ]

    for item, page in toc:
        p = doc.add_paragraph()
        run = p.add_run(f'{item}')
        run.font.size = Pt(11)
        run.font.name = '宋体'
        run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
        if not item.startswith('    '):
            run.bold = True
        p.paragraph_format.space_after = Pt(2)

    doc.add_page_break()

    # ==================== 一、项目简介 ====================
    add_section_title(doc, '一、项目简介')

    add_body_text(doc, '在人工智能技术深度赋能各行各业的时代背景下，数字化技术为传统文化的传承与创新开辟了全新路径。'
        '本项目"水墨神州"是一款面向中国古代建筑文化的数字交互平台，以中国传统的水墨画美学风格为视觉基调，'
        '融合 AI 智能交互、沉浸式三维漫游与趣味化知识探索，构建了一个集教育性、互动性与娱乐性于一体的'
        '古建筑文化数字空间。')

    add_body_text(doc, '项目涵盖 AI 角色对话系统、2D 水墨风格地图沙盘、3D 古建筑三维模型展示、'
        '360° 全景漫游以及游戏化学习等核心模块，技术栈包括 HTML5、Phaser.js、Three.js、'
        'Flask 后端和 SQLite 数据库，并深度集成了火山引擎（字节跳动）的多种 AI 能力。')

    add_info_box(doc, '本开发日志与 AI 使用记录的整理，旨在说明项目从需求分析到最终落地的全过程中，'
        '各阶段如何借助 AI 辅助工具提升开发效率与创作质量，'
        '同时也是对项目开发实践的阶段性总结与回顾。')

    doc.add_page_break()

    # ==================== 二、AIGC 工具引入 ====================
    add_section_title(doc, '二、AIGC 工具引入')

    add_body_text(doc, '在项目启动初期，面对多技术栈融合（前端游戏引擎、3D 渲染、后端 API、AI 集成）的复杂需求，'
        '团队评估后决定引入 Claude Code（Anthropic 官方 CLI 工具）作为核心 AI 辅助开发工具。')

    add_body_text(doc, 'Claude Code 是一个基于大语言模型的智能编程助手，具备以下核心能力：', bold=True, indent=False)

    capabilities = [
        '代码生成：根据自然语言描述生成前端页面、后端 API、数据库设计等完整代码',
        '代码理解：分析现有代码结构，提供优化建议和问题诊断',
        '文档生成：自动生成技术架构图、API 文档、项目计划书',
        '调试辅助：定位 Bug、分析错误日志、提供修复方案',
        '架构设计：协助技术选型、系统架构设计、模块划分',
    ]
    for cap in capabilities:
        add_bullet(doc, cap)

    add_body_text(doc, '项目配置文件 .claude/settings.local.json 记录了 Claude Code 的使用痕迹，'
        '包括对 python 和 npm install 命令的自动授权配置（修改时间：2026-05-23 23:44），'
        '证明 AI 辅助工具已深度融入项目的日常开发流程。')

    doc.add_page_break()

    # ==================== 三、应用场景与实践 ====================
    add_section_title(doc, '三、应用场景与实践')

    add_body_text(doc, 'AI 赋能创作与开发——贯穿全流程。在本项目中，Claude Code 深度参与了'
        '从前期设计构思、中期代码实现到后期文档编写的完整开发流程，成为项目推进的重要助力。'
        '以下是对 AI 工具具体应用场景的详细说明。')

    # 3.1 设计稿生成
    add_styled_heading(doc, '3.1 设计稿生成', level=2)

    add_body_text(doc, '功能模块设计：在项目开发的前期阶段，利用 Claude Code 生成界面设计方向。'
        '本项目需要设计水墨风格的 UI 系统，包含色彩规范、字体选择、按钮样式等多个维度。'
        '通过向 AI 描述"水墨画风格 + 古建筑元素 + 金色点缀"的设计需求，'
        'AI 辅助生成了统一的 CSS 变量体系：')

    add_info_box(doc, '/* AI 辅助设计的 CSS 变量体系 */\n'
        '--ink-1: #130f10（浓墨）  --ink-2: #231820（淡墨）\n'
        '--gold-1: #ceae75（暗金） --gold-2: #ffd700（亮金）\n'
        '--paper: #f7f0dd（宣纸色）--wood: #5a3922（木纹色）\n'
        '字体：KaiTi（楷体）为主，STKaiti 为备选')

    add_body_text(doc, '同时，AI 辅助规划了 34 个省份的标准化资源目录结构，'
        '每个省份包含 plate/（名牌）、Background/（背景）、Architecture/logo/（景点图标）'
        '等统一子目录，确保了 200+ 张素材资源的有序组织。')

    # 3.2 代码生成
    add_styled_heading(doc, '3.2 代码生成与调试', level=2)

    add_body_text(doc, '前端场景代码生成：本项目包含 20+ 个景点 HTML 页面，每个页面都是一个完整的 Phaser.js 游戏场景。'
        '在开发过程中，通过向 Claude Code 描述需求（如"创建一个兵马俑场景，包含NPC对话、'
        '沙盘系统、迷宫探索和 AI 图片生成"），AI 能够生成包含完整游戏逻辑的代码框架，'
        '开发者在此基础上进行个性化调整和优化。')

    add_body_text(doc, '后端 API 开发：Flask 后端的 10 个 RESTful API 端点中，'
        '部分接口的初始代码由 Claude Code 生成，包括用户认证（PBKDF2 密码哈希）、'
        '积分奖励系统、UUID 兑换码生成等。AI 生成的代码遵循了安全最佳实践，'
        '如使用 werkzeug 的密码哈希而非明文存储。')

    add_body_text(doc, 'Bug 调试与修复：项目保留了 3 个迭代修复脚本（run_fix1.py、run_fix2.py、run_fix3.py），'
        '这些脚本用于解决 HTML 页面中的 UI 组件冲突问题。'
        'Claude Code 在此过程中辅助分析正则表达式匹配模式，精确移除目标 HTML 区块。')

    # 3.3 文档
    add_styled_heading(doc, '3.3 文档与图表生成', level=2)

    add_body_text(doc, '技术架构图生成：项目包含 10 张技术架构图，全部由 Claude Code 辅助生成的 '
        'gen_images.py（679 行 Python 代码）使用 PIL/Pillow 库程序化绘制。'
        '这 10 张图涵盖了项目架构总览、四层模型、地图系统、3D 展示、AI 集成、'
        '游戏化系统、数据库 ER 图、UI 体系、创新点和发展路线图。')

    add_body_text(doc, '项目计划书：29 页的技术项目计划书（水墨神州_项目计划书_技术部分.docx，'
        '11,302 字）在 Claude Code 辅助下完成初稿，随后在 WPS Office 中人工审校和完善。'
        '_gen.py（82 行）实现了图片到 Word 文档的自动化插入流程。')

    # 3.4 素材
    add_styled_heading(doc, '3.4 素材与资源制作', level=2)

    add_body_text(doc, '游戏内容批量注入：add_games.py（542 行）是一个复杂的批量代码注入脚本，'
        '用于向 games.html 中注入 8 个新的文化小游戏（银牌试毒、太和殿脊兽、畅音阁、'
        '宫门关、曲水流觞、明帝王图、九九消寒图、皇子课表）。'
        'Claude Code 辅助生成了正则表达式匹配逻辑和 HTML 模板代码。')

    add_body_text(doc, '3D 模型处理：项目中的 .glb 3D 模型文件由原始 .max 工程文件转换而来，'
        'Claude Code 辅助编写了 Three.js 的 GLTFLoader 加载代码和 Google model-viewer 集成代码。')

    doc.add_page_break()

    # ==================== 四、AIGC 辅助开发过程 ====================
    add_section_title(doc, '四、AIGC 辅助开发过程')

    add_info_box(doc, '由于开发过程中会同时推进多项任务，各阶段的工作在时间上存在一定重叠，'
        '整体上以阶段性目标的达成为划分依据。')

    # 阶段一
    add_styled_heading(doc, '4.1 阶段一：技术选型与架构设计（2026 年 3 月）', level=2)

    add_body_text(doc, '本阶段的核心目标是确定技术选型和整体架构方案。'
        '项目需求涵盖 2D 地图、3D 模型、AI 交互、游戏化学习等多个维度，'
        '技术栈选择直接影响后续开发效率和最终效果。')

    add_body_text(doc, 'Claude Code 在此阶段的主要工作：', bold=True, indent=False)
    for item in [
        '分析项目需求，推荐 Phaser.js（2D 游戏引擎）+ Three.js（3D 渲染）+ Flask（后端）的技术组合',
        '生成项目目录结构规划，包括 34 个省份的标准化资源目录',
        '设计 SQLite 数据库表结构（4 张表：users、user_items、rewards、user_rewards）',
        '生成 CSS 视觉规范（水墨色系变量体系）',
    ]:
        add_bullet(doc, item)

    add_phase_table(doc, [
        ['技术选型', '2026 年 3 月上旬', '确定 Phaser.js + Three.js + Flask + SQLite 技术栈'],
        ['架构设计', '2026 年 3 月中旬', '前后端分离架构、数据库设计、API 规划'],
        ['素材规划', '2026 年 3 月下旬', '34 省份资源目录结构、音视频素材清单'],
    ])

    doc.add_paragraph()

    # 阶段二
    add_styled_heading(doc, '4.2 阶段二：核心功能实现（2026 年 3 月—4 月）', level=2)

    add_body_text(doc, '本阶段聚焦于平台的核心技术模块开发，是整个项目技术含量最高的阶段。')

    add_body_text(doc, '关键技术实现：', bold=True, indent=False)
    for item in [
        'Verlet 布料物理引擎（index.html 第 776-999+ 行）：主菜单渲染为三维悬挂卷轴，'
        '使用 Verlet 积分法模拟布料物理，Three.js Raycaster 实现鼠标交互',
        '多屏 SPA 架构：主页、AI 导游、角色选择、AI 定制、地图浏览、省份详情等 6 个屏幕',
        'Flask 后端：10 个 RESTful API 端点，用户认证、积分系统、背包系统、奖励兑换',
        '火山引擎 AI 集成：文生图、LLM 对话、图像风格迁移、视觉识别 4 种 AI 能力',
    ]:
        add_bullet(doc, item)

    add_body_text(doc, 'AI 使用场景及完成情况：Claude Code 在此阶段深度参与了代码编写，'
        '包括 Verlet 物理引擎的粒子系统和约束求解算法、Flask API 的路由设计和数据库操作、'
        'AI 模型的 API 调用封装等。同时结合项目需求进行了多项创新探索。')

    add_phase_table(doc, [
        ['物理引擎', '2026 年 3 月', 'Verlet 积分法布料模拟、粒子系统、约束求解'],
        ['主页开发', '2026 年 3-4 月', '多屏 SPA 架构、卷轴菜单、角色选择系统'],
        ['后端开发', '2026 年 4 月', 'Flask API、SQLite 数据库、用户认证'],
        ['AI 集成', '2026 年 4 月', '火山引擎 4 种 AI 能力接入'],
    ])

    doc.add_paragraph()

    # 阶段三
    add_styled_heading(doc, '4.3 阶段三：AI 能力集成（2026 年 4 月）', level=2)

    add_body_text(doc, '本阶段的重点是将火山引擎 AI 平台的多种能力集成到项目中，实现智能化交互体验。')

    add_body_text(doc, 'Claude Code 辅助实现的 AI 功能：', bold=True, indent=False)
    for item in [
        '/api/generate-warrior：文生图接口，使用 doubao-seedream-4-0 模型生成兵马俑风格图片',
        '/api/chat：角色扮演对话接口，使用 doubao-seed-2-0-pro 模型扮演秦始皇',
        '/api/generate-avatar：图像风格迁移，将用户照片转为水墨风格头像',
        '/api/teleport：视觉识别接口，识别建筑照片并触发场景传送',
    ]:
        add_bullet(doc, item)

    add_info_box(doc, 'AI 角色扮演对话功能的 Prompt 设计是本阶段的难点之一。'
        '需要让 AI 以古文风格扮演秦始皇，同时保持回答的准确性和趣味性。'
        'Claude Code 辅助设计了 System Prompt 和对话上下文管理逻辑。')

    # 阶段四
    add_styled_heading(doc, '4.4 阶段四：场景开发与素材采集（2026 年 4 月）', level=2)

    add_body_text(doc, '本阶段进入大规模的景点场景开发，同时进行了实地素材采集。')

    add_body_text(doc, '2026 年 4 月 11 日，项目作者前往河南安阳殷墟遗址实地采风，'
        '拍摄了 7 张高质量照片（总计约 38MB），涵盖妇好墓、亚好墓、甲骨文、'
        '车马坑、殷墟博物馆等核心景点。这些照片被直接用于 yinxu.html 等页面中的'
        'NPC 对话背景和场景展示，确保了项目素材的真实性和原创性。')

    add_body_text(doc, 'Claude Code 在此阶段辅助生成了多个景点页面的代码框架，'
        '包括兵马俑（870 行）、少林寺（658 行）、殷墟（1104 行）等复杂场景。')

    add_phase_table(doc, [
        ['殷墟采风', '2026 年 4 月 11 日', '实地拍摄 7 张照片，覆盖 5 个核心景点'],
        ['3D 模型导入', '2026 年 4 月 13-15 日', '10 个 .glb 模型文件导入，最大 1GB'],
        ['景点页面', '2026 年 4 月', '20+ 个 HTML 景点页面开发'],
        ['全景查看器', '2026 年 4-5 月', 'Pannellum 全景 + Three.js 3D 查看器'],
    ])

    doc.add_paragraph()

    # 阶段五
    add_styled_heading(doc, '4.5 阶段五：游戏化系统开发（2026 年 4 月—5 月）', level=2)

    add_body_text(doc, '本阶段完善了游戏化学习系统，增加了 8 个新的文化小游戏，'
        '并优化了积分和奖励系统的用户体验。')

    add_body_text(doc, 'Claude Code 的主要贡献：', bold=True, indent=False)
    for item in [
        '生成 add_games.py（542 行）批量注入脚本，一次性添加 8 个新游戏',
        '优化 games.html（1765 行）的游戏中心页面',
        '完善积分系统的数据库事务和兑换码生成逻辑',
        '修复 UI 组件冲突（run_fix1/2/3.py）',
    ]:
        add_bullet(doc, item)

    # 阶段六
    add_styled_heading(doc, '4.6 阶段六：文档编写与项目完善（2026 年 5 月）', level=2)

    add_body_text(doc, '本阶段的重点转向文档编写和项目整体完善。')

    add_body_text(doc, 'Claude Code 辅助生成了：', bold=True, indent=False)
    for item in [
        'gen_images.py（679 行）：程序化绘制 10 张技术架构图',
        '_gen.py（82 行）：自动化图片插入 Word 文档',
        '项目计划书初稿（29 页，11,302 字）',
        '证明材料文档（14 个章节的证据整理）',
    ]:
        add_bullet(doc, item)

    add_info_box(doc, '文档工具链的开发体现了"用代码解决文档问题"的工程化思维。'
        'gen_images.py 的 679 行代码可以在 0.5 秒内生成 10 张风格一致的架构图，'
        '远比手工绘图高效且可复现。')

    doc.add_page_break()

    # ==================== 五、关键技术点 ====================
    add_section_title(doc, '五、关键技术点与 AIGC 参与')

    add_body_text(doc, '本部分介绍开发过程中遇到的主要技术问题，'
        '以及 Claude Code 在辅助分析问题和推动创新方面所发挥的作用。')

    # 5.1
    add_styled_heading(doc, '5.1 Verlet 布料物理引擎', level=2)

    add_body_text(doc, '问题描述：如何让主菜单呈现出"悬挂卷轴随风飘动"的水墨画效果？'
        '市面上没有现成的解决方案，需要从零实现物理模拟。')

    add_body_text(doc, 'Claude Code 辅助分析问题，理解布料物理模拟的核心算法：', bold=True, indent=False)
    for item in [
        'Verlet 积分法：无需显式存储速度，通过当前位置和上一位置差分计算',
        '约束求解：相邻粒子间的距离约束，迭代松弛法求解',
        '外力模拟：重力（恒定向下）+ 风力（随机水平扰动）',
        '边界固定：顶部粒子固定模拟木质卷轴杆',
    ]:
        add_bullet(doc, item)

    add_body_text(doc, '在 Claude Code 生成的基础框架上，团队对风力参数、粒子密度、'
        '约束迭代次数等进行了反复调试，最终实现了流畅自然的卷轴飘动效果。')

    # 5.2
    add_styled_heading(doc, '5.2 多 AI 能力集成架构', level=2)

    add_body_text(doc, '问题描述：如何在一个平台中集成 4 种不同的 AI 能力'
        '（文生图、LLM 对话、图像风格迁移、视觉识别），并保持统一的调用接口？')

    add_body_text(doc, 'Claude Code 辅助设计了统一的 AI 调用层：', bold=True, indent=False)
    for item in [
        '统一使用火山引擎 API 网关（ark.cn-beijing.volces.com）',
        '通过 HTTP POST + Bearer Token 认证调用不同模型',
        '前端统一使用 fetch API 调用后端代理，避免跨域和密钥暴露',
        '错误处理和超时机制的统一实现',
    ]:
        add_bullet(doc, item)

    # 5.3
    add_styled_heading(doc, '5.3 Phaser.js 游戏场景系统', level=2)

    add_body_text(doc, '问题描述：如何让 20+ 个景点页面共享统一的游戏框架（对话、背包、沙盘、迷宫），'
        '同时保持各自的特色内容？')

    add_body_text(doc, 'Claude Code 辅助建立了标准化的游戏场景模板：', bold=True, indent=False)
    for item in [
        '统一的 Phaser.js 3.55.2 游戏配置（场景、物理、输入）',
        '可复用的对话系统组件（NPC 多轮对话、选项分支）',
        '标准化的背包系统（文物收集、物品管理、积分累计）',
        '模块化的沙盘和迷宫系统（可按景点定制内容）',
    ]:
        add_bullet(doc, item)

    doc.add_page_break()

    # ==================== 六、AIGC 应用自评 ====================
    add_section_title(doc, '六、AIGC 应用自评')

    add_body_text(doc, '本项目的 AIGC 工具使用模式可概括为：知识驱动型辅助开发。'
        '即以项目需求为导向，以开发团队的专业知识为核心，'
        '借助 AI 工具加速实现和优化创新。')

    add_body_text(doc, '对核心代码的理解与把控：', bold=True, indent=False)
    for item in [
        'Verlet 布料物理引擎的核心算法（积分、约束、外力）由团队理解原理后实现，'
        'AI 辅助生成初始框架，团队进行参数调优和效果打磨',
        'Flask 后端的 API 设计和数据库操作逻辑由团队把控，AI 辅助生成样板代码',
        '所有 AI 生成的代码均经过人工审查和测试，确保符合项目需求',
    ]:
        add_bullet(doc, item)

    add_body_text(doc, '技术决策与创新的主导性：', bold=True, indent=False)
    for item in [
        '技术选型（Phaser.js + Three.js + Flask）基于团队对项目需求的分析判断',
        '水墨风格 UI 设计（CSS 变量体系）体现团队的美学追求',
        '4 种 AI 能力的集成方案由团队设计，AI 辅助实现',
        '34 省份资源体系的标准化目录结构由团队规划',
    ]:
        add_bullet(doc, item)

    add_body_text(doc, '效率提升与质量保障的平衡：', bold=True, indent=False)
    for item in [
        'AI 辅助生成的代码作为起点，团队在此基础上进行优化和完善',
        'gen_images.py（679 行）程序化生成架构图，效率远超手工绘图',
        'add_games.py（542 行）批量注入游戏代码，保证了代码风格一致性',
        '关键业务逻辑（用户认证、积分兑换）由团队亲自实现和测试',
    ]:
        add_bullet(doc, item)

    doc.add_page_break()

    # ==================== 七、后续规划 ====================
    add_section_title(doc, '七、后续规划')

    add_body_text(doc, '基于当前的项目成果和技术积累，后续工作将围绕以下方向展开：')

    add_styled_heading(doc, '功能拓展', level=2)
    for item in [
        '完善剩余省份的景点内容，实现 34 省份全覆盖',
        '增加更多文化小游戏（目标：20+ 个），丰富游戏化学习体验',
        '优化 AI 对话系统，支持更自然的多轮对话和情感表达',
        '开发移动端适配版本，支持手机和平板访问',
    ]:
        add_bullet(doc, item)

    add_styled_heading(doc, '技术深化', level=2)
    for item in [
        '探索 WebGL 着色器实现水墨画实时渲染效果',
        '研究 WebXR 技术，实现 VR/AR 沉浸式古建筑游览',
        '优化 3D 模型加载性能，支持更大规模的场景展示',
        '引入 RAG（检索增强生成）技术，提升 AI 对话的知识准确性',
    ]:
        add_bullet(doc, item)

    add_styled_heading(doc, 'AIGC 深化应用', level=2)
    for item in [
        '探索 AI 自动生成景点解说文案和对话脚本',
        '利用 AI 图像生成技术辅助制作更多省份的特色素材',
        '研究 AI 驱动的个性化学习路径推荐',
        '探索 AI 代码审查和自动化测试的集成',
    ]:
        add_bullet(doc, item)

    # 尾声
    doc.add_paragraph()
    add_info_box(doc, '回顾整个项目周期，AIGC 技术已深度融入设计、编码、测试、文档编写等各个环节，'
        '成为驱动开发效率与创新突破的关键力量。但始终不变的核心理念是：'
        '人的创造力主导方向，AI 是加速器而非替代者。')

    add_body_text(doc, '面向未来，团队将持续追踪前沿技术演进，不断深化 AI 与古建筑文化数字化的融合创新，'
        '力求打造出兼具深厚文化内涵与卓越技术水平的标杆项目。')

    # 签名
    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run('项目作者：赵越\n2026 年 5 月')
    run.font.size = Pt(12)
    run.font.name = '宋体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    run.font.color.rgb = INK_DARK

    # 保存
    output = '水墨神州-AIGC辅助创作过程证明.docx'
    doc.save(output)
    print(f'文档已生成：{output}')
    print(f'文件大小：{os.path.getsize(output) / 1024:.1f} KB')

if __name__ == '__main__':
    create_aigc_proof()
