from pathlib import Path
import re
from xml.sax.saxutils import escape
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER

ROOT = Path(__file__).resolve().parent
BASE = '水墨神州五大墨灵空间_详细计划说明书'
source = (ROOT / (BASE + '.md')).read_text(encoding='utf-8')
lines = source.splitlines()
blocks = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                rows.append(cells)
            i += 1
        blocks.append(('table', rows))
        continue
    if line.startswith('#'):
        level = len(line) - len(line.lstrip('#'))
        blocks.append(('heading', (level, line[level:].strip())))
    else:
        blocks.append(('paragraph', line))
    i += 1

# Word: editable headings, real tables, page fields and an automatic contents field.
doc = Document()
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21)
sec.top_margin, sec.bottom_margin = Cm(2), Cm(1.8)
sec.left_margin, sec.right_margin = Cm(2), Cm(2)
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']:
    style = doc.styles[name]
    style.font.name = 'Microsoft YaHei'
    style.element.rPr.rFonts.set(qn('w:eastAsia'), '微软雅黑')
normal = doc.styles['Normal']
normal.font.size = Pt(10.5)
normal.paragraph_format.line_spacing = 1.3
normal.paragraph_format.space_after = Pt(7)
for name, size in [('Heading 1', 18), ('Heading 2', 14), ('Heading 3', 11.5)]:
    st = doc.styles[name]
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor.from_string('204E50')
    st.paragraph_format.space_before = Pt(14)
    st.paragraph_format.space_after = Pt(8)
    st.paragraph_format.keep_with_next = True
header = sec.header.paragraphs[0]
header.text = '水墨神州 · 神州长卷寻墨记  |  详细计划说明书 V1.0'
header.runs[0].font.size = Pt(8)
header.runs[0].font.color.rgb = RGBColor.from_string('687878')
footer = sec.footer.paragraphs[0]
footer.alignment = 2
footer.add_run('第 ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)
footer.add_run(' 页')

cover_end = next(idx for idx, block in enumerate(blocks) if block == ('heading', (1, '一、原方案核心总结')))
for kind, value in blocks[:cover_end]:
    if kind == 'heading':
        lev, text = value
        p = doc.add_paragraph(text, 'Title' if lev == 1 else 'Subtitle')
        p.paragraph_format.space_before = Pt(42 if lev == 1 else 14)
    else:
        doc.add_paragraph(value)
doc.add_page_break()
doc.add_heading('内容导航', 1)
for kind, value in blocks[cover_end:]:
    if kind == 'heading' and value[0] == 1:
        doc.add_paragraph(value[1])
doc.add_paragraph('阅读方式：先看第一章把握原案，再按第三章逐关讨论；制作与验收参见第四至九章。来源页码见附录A，补充内容性质见附录B。')
doc.add_page_break()

for kind, value in blocks[cover_end:]:
    if kind == 'heading':
        lev, text = value
        if lev == 1 and text != '一、原方案核心总结':
            doc.add_page_break()
        doc.add_heading(text, min(lev, 3))
    elif kind == 'paragraph':
        p = doc.add_paragraph(value)
    else:
        rows = value
        table = doc.add_table(rows=1, cols=len(rows[0]))
        table.style = 'Table Grid'
        table.autofit = True
        for j, cell in enumerate(rows[0]): table.rows[0].cells[j].text = cell
        rep = OxmlElement('w:tblHeader'); table.rows[0]._tr.get_or_add_trPr().append(rep)
        for row in rows[1:]:
            cells = table.add_row().cells
            for j, cell in enumerate(row): cells[j].text = cell
        for ridx, row in enumerate(table.rows):
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.paragraph_format.space_after = Pt(4)
                    p.paragraph_format.line_spacing = 1.15
                    for run in p.runs:
                        run.font.size = Pt(9)
                        if ridx == 0:
                            run.bold = True
                            run.font.color.rgb = RGBColor(255,255,255)
                if ridx == 0:
                    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), '24585B'); cell._tc.get_or_add_tcPr().append(shd)
        doc.add_paragraph()
doc.save(ROOT / (BASE + '.docx'))

# PDF: embedded Chinese fonts, repeatable table headers and explicit chapter breaks.
pdfmetrics.registerFont(TTFont('SimSun', r'C:\Windows\Fonts\simsun.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('SimHei', r'C:\Windows\Fonts\simhei.ttf'))
pdfmetrics.registerFontFamily('SimSun', normal='SimSun', bold='SimHei', italic='SimSun', boldItalic='SimHei')
teal = colors.HexColor('#24585B')
styles = {
    'body': ParagraphStyle('body', fontName='SimSun', fontSize=10.2, leading=16.8, spaceAfter=8, wordWrap='CJK'),
    'h1': ParagraphStyle('h1', fontName='SimHei', fontSize=18, leading=25, spaceAfter=16, textColor=teal, keepWithNext=True, wordWrap='CJK'),
    'h2': ParagraphStyle('h2', fontName='SimHei', fontSize=13.2, leading=20, spaceBefore=10, spaceAfter=9, textColor=teal, keepWithNext=True, wordWrap='CJK'),
    'h3': ParagraphStyle('h3', fontName='SimHei', fontSize=11, leading=18, spaceBefore=7, spaceAfter=7, keepWithNext=True, wordWrap='CJK'),
    'cell': ParagraphStyle('cell', fontName='SimSun', fontSize=8.5, leading=13.5, wordWrap='CJK'),
    'headcell': ParagraphStyle('headcell', fontName='SimHei', fontSize=8.7, leading=13.5, textColor=colors.white, wordWrap='CJK'),
    'title': ParagraphStyle('title', fontName='SimHei', fontSize=27, leading=38, textColor=teal, spaceAfter=20, wordWrap='CJK'),
    'subtitle': ParagraphStyle('subtitle', fontName='SimHei', fontSize=18, leading=27, spaceAfter=28, wordWrap='CJK'),
}
def para(s, style='body'): return Paragraph(escape(s), styles[style])
story = [Spacer(1, 52)]
for kind, value in blocks[:cover_end]:
    if kind == 'heading': story.append(para(value[1], 'title' if value[0] == 1 else 'subtitle'))
    else: story.append(para(value))
story.append(PageBreak())
story.append(para('内容导航', 'h1'))
for kind, value in blocks[cover_end:]:
    if kind == 'heading' and value[0] == 1: story.append(para(value[1]))
story.append(Spacer(1,18))
story.append(para('阅读方式：先看第一章把握原案，再按第三章逐关讨论；制作与验收参见第四至九章。来源页码见附录A，补充内容性质见附录B。'))
story.append(PageBreak())
width = 481.89
for kind, value in blocks[cover_end:]:
    if kind == 'heading':
        level, text = value
        if level == 1 and text != '一、原方案核心总结': story.append(PageBreak())
        story.append(para(text, 'h' + str(min(level,3))))
    elif kind == 'paragraph': story.append(para(value))
    else:
        rows = value
        n = len(rows[0])
        if rows[0][0] == '编号': ratios = [0.12, 0.24, 0.33, 0.31]
        elif n == 6: ratios = [0.10,0.17,0.23,0.13,0.23,0.14]
        elif n == 4: ratios = [0.18,0.26,0.28,0.28]
        elif n == 3: ratios = [0.19,0.37,0.44]
        else: ratios = [1/n]*n
        data = [[para(cell, 'headcell' if idx == 0 else 'cell') for cell in row] for idx,row in enumerate(rows)]
        t = Table(data, colWidths=[width*r for r in ratios], repeatRows=1, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),teal),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F3F7F6'), colors.white]),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#CAD7D4')),
            ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
        ]))
        story += [t, Spacer(1,11)]

def page_decor(c, d):
    c.saveState()
    pw, ph = d.pagesize
    if d.page > 1:
        c.setFont('SimSun',8)
        c.setFillColor(colors.HexColor('#687878'))
        c.drawString(56.7,ph-33,'水墨神州 · 神州长卷寻墨记  |  详细计划说明书 V1.0')
        c.setStrokeColor(colors.HexColor('#CEDAD6'))
        c.line(56.7,ph-40,pw-56.7,ph-40)
    c.setFont('SimSun',8)
    c.setFillColor(colors.HexColor('#687878'))
    c.drawRightString(pw-56.7,28,f'第 {d.page} 页')
    c.restoreState()

pdf = SimpleDocTemplate(str(ROOT/(BASE+'.pdf')), pagesize=(595.28,841.89), rightMargin=56.7, leftMargin=56.7, topMargin=58, bottomMargin=45, title='水墨神州五大墨灵空间 详细计划说明书', author='项目策划整理')
pdf.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
print('Generated:', BASE + '.docx', BASE + '.pdf')
print('Source characters:', len(source))
