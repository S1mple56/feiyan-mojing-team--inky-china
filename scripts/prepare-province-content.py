from pathlib import Path
from urllib.parse import unquote
import json,re
root=Path(__file__).resolve().parents[1]/'2d'
report=json.loads((root.parent/'tmp/provinces/audit-before.json').read_text(encoding='utf-8'))
changes=[]
for province in report['list']:
    for spot in province['spots']:
        if spot['id']=='spot-xilituzhao':
            spot['icon']='province/neimenggu/Architecture/logo/xilituzhao.jpg';spot['iconExists']=True
        name=spot['id'].removeprefix('spot-')
        folder=root/'province'/province['id']/'Architecture'/'location'
        candidates=[folder/('bg_'+name+ext) for ext in ['.jpg','.png','.JPG']]
        spot['scene']=next((p.relative_to(root).as_posix() for p in candidates if p.exists()),None)
        if not spot['pageExists']:spot['page']=None
    province['preview']=next((p.relative_to(root).as_posix() for p in (root/'province_shentu').iterdir() if p.stem.lower()==province['id']),province['background'])
data={p['id']:{'title':p['title'],'background':p['background'],'preview':p['preview'],'spots':[{k:s[k] for k in ['id','name','icon','page','scene']} for s in p['spots']]} for p in report['list']}
(root/'province-content-data.js').write_text("/* 仅列出现有资源与已制作页面；图景预览不等同于完整游历。 */\nwindow.provinceContent = "+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
pages={s['page'] for p in report['list'] for s in p['spots'] if s['page']}
for name in sorted(pages):
    file=root/name;text=file.read_text(encoding='utf-8')
    def fix(m):
        quote,old=m.group(1),m.group(2)
        if old.startswith(('http','data:','/')) or '${' in old:return m.group(0)
        path=file.parent/unquote(old)
        if path.exists():return m.group(0)
        new=str(Path(old).with_suffix('.jpg')).replace('\\','/')
        if path.suffix.lower()=='.png' and (file.parent/unquote(new)).exists():
            changes.append({'page':name,'old':old,'new':new});return quote+new+quote
        return m.group(0)
    text=re.sub(r"(['\"])([^'\"\n]+\.(?:png|jpg|jpeg|webp|mp3|mp4|glb))\1",fix,text)
    text=text.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','three.min.js')
    file.write_text(text,encoding='utf-8')
(root.parent/'tmp/provinces/resource-repairs.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2),encoding='utf-8')
print('Catalog:',len(data),'provinces,',sum(len(p['spots']) for p in data.values()),'attractions')
print('Repaired references in existing attraction pages:',len(changes))
