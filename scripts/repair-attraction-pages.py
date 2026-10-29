from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]/'2d'
report=json.loads((root.parent/'tmp/provinces/audit-before.json').read_text(encoding='utf-8'))
fixes=[]
for p in report['list']:
 for spot in p['spots']:
  if not spot['page']:continue
  file=root/spot['page'];text=file.read_text(encoding='utf-8');before=text;name=spot['name']
  text=text.replace('https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js','vendor/phaser-3.55.2.min.js')
  if name!='少林寺' and '<title>古建游览 - 少林寺武宗禅影</title>' in text:
   text=text.replace('<title>古建游览 - 少林寺武宗禅影</title>',f'<title>古建游览 - {name}</title>')
   text=text.replace('少林清幽，宜静心打坐。',f'暂歇片刻，再继续探索{name}。')
   text=text.replace('禅武合一',f'{name} · 游历完成').replace('天下武功出少林。','本次游历的回声已收入行囊。').replace('感谢您见证这片中原佛国圣地。',f'感谢你走过{name}的这一程。').replace('禅宗祖庭·少林武学',f'{name} · 影像资料').replace('少林寺',name)
   fixes.append({'page':file.name,'issue':'mislabelled-shaolin-copy','name':name})
  # A different destination's movie is not this attraction's content.
  sources=re.findall(r'<source src="([^"]+)"[^>]*>',text)
  invalid=any(not (root/s).exists() or ('shaolinsi/' in s and name!='少林寺') for s in sources)
  if invalid and 'id="story-video"' in text:
   text=re.sub(r'<source src="([^"]+)"[^>]*>',lambda m:'' if not (root/m.group(1)).exists() or ('shaolinsi/' in m.group(1) and name!='少林寺') else m.group(0),text)
   text=text.replace('<video id="story-video"', '<p style="color:#d1c4a1;line-height:1.8;">本景点影像资料尚未开放，请继续场景游览。</p><video hidden data-unavailable="true" id="story-video"')
   text=text.replace('function playStoryVideo() {',"function playStoryVideo() {\n    if(document.getElementById('story-video')?.dataset.unavailable==='true'){document.getElementById('video-modal').style.display='block';isPaused=true;return;}\n")
   fixes.append({'page':file.name,'issue':'missing-or-wrong-story-video'})
  if text!=before:file.write_text(text,encoding='utf-8')
(root.parent/'tmp/provinces/content-repairs.json').write_text(json.dumps(fixes,ensure_ascii=False,indent=2),encoding='utf-8')
print('Content repairs:',len(fixes))
