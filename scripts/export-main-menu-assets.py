"""Export existing PSD layer artwork; no image generation or source changes."""
from pathlib import Path
import sys,json,shutil,hashlib,base64,io
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tmp/psd-deps'))
from psd_tools import PSDImage
from PIL import Image

work=root/'tmp/main-menu';work.mkdir(parents=True,exist_ok=True)
assets=root/'2d/assets/main-menu';assets.mkdir(parents=True,exist_ok=True)
if not (work/'before-index.html').exists():
    shutil.copyfile(root/'2d/index.html',work/'before-index.html')
    before={p.relative_to(root/'2d').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'2d').rglob('*') if p.is_file() and p.suffix.lower() in ['.html','.js','.css']}
    (work/'before-code-hashes.json').write_text(json.dumps(before,indent=2),encoding='utf-8')
psd=PSDImage.open(r'C:\Users\18780\Desktop\水墨UI-墨游华夏.psd')
layers=list(psd.descendants())
manifest=[]
for name,indices,bounds in [('roam',[65],[854,509,1170,595]),('story',[55,61],[839,589,1174,675])]:
    x,y,right,bottom=bounds;canvas=Image.new('RGBA',(right-x,bottom-y),(0,0,0,0))
    for index in indices:
        layer=layers[index]
        image=layer.composite() if layer.is_group() else layer.topil()
        if image is None:raise RuntimeError('Unable to export layer '+layer.name)
        image=image.convert('RGBA');canvas.alpha_composite(image,(layer.left-x,layer.top-y))
    canvas.save(work/(name+'-raster-preview.png'))
    manifest.append({'name':name,'bounds':bounds,'layers':[layers[i].name for i in indices]})
    # Export the original vector border explicitly: PSD group raster compositing
    # omits its stroke, while its cached fill has only 33/255 opacity.
    shape=layers[68 if name=='roam' else 64]
    paths=[]
    def point(pair):return '{:.3f},{:.3f}'.format(pair[1]*1920-x,pair[0]*1080-y)
    for subpath in shape.vector_mask.paths:
        knots=list(subpath)
        if not knots:continue
        commands=['M'+point(knots[0].anchor)]
        for k in range(len(knots)):
            a,b=knots[k],knots[(k+1)%len(knots)]
            commands.append('C'+point(a.leaving)+' '+point(b.preceding)+' '+point(b.anchor))
        paths.append(' '.join(commands)+' Z')
    svg=['<svg xmlns="http://www.w3.org/2000/svg" width="'+str(right-x)+'" height="'+str(bottom-y)+'" viewBox="0 0 '+str(right-x)+' '+str(bottom-y)+'">']
    # PSD subtracts four ellipses from the base rectangle. Export the resulting
    # contour, rather than stroking the five operands as separate full circles.
    rect=list(shape.vector_mask.paths[0]);corners=[(k.anchor[1]*1920-x,k.anchor[0]*1080-y) for k in rect]
    left=min(p[0] for p in corners);right_edge=max(p[0] for p in corners);top=min(p[1] for p in corners);bottom_edge=max(p[1] for p in corners)
    ellipse=list(shape.vector_mask.paths[1]);ex=[k.anchor[1]*1920 for k in ellipse];ey=[k.anchor[0]*1080 for k in ellipse];rx=(max(ex)-min(ex))/2;ry=(max(ey)-min(ey))/2
    contour=f'M {left+rx},{top} H {right_edge-rx} A {rx},{ry} 0 0 0 {right_edge},{top+ry} V {bottom_edge-ry} A {rx},{ry} 0 0 0 {right_edge-rx},{bottom_edge} H {left+rx} A {rx},{ry} 0 0 0 {left},{bottom_edge-ry} V {top+ry} A {rx},{ry} 0 0 0 {left+rx},{top} Z'
    svg.append('<path d="'+contour+'" fill="#cba56e" fill-opacity="'+str(shape.fill_opacity/255)+'" stroke="#cba56e" stroke-width="1.63"/>')
    for index in ([69,67] if name=='roam' else [55,63]):
        layer=layers[index];image=layer.composite();buffer=io.BytesIO();image.save(buffer,format='PNG')
        svg.append('<image x="'+str(layer.left-x)+'" y="'+str(layer.top-y)+'" width="'+str(image.width)+'" height="'+str(image.height)+'" href="data:image/png;base64,'+base64.b64encode(buffer.getvalue()).decode('ascii')+'"/>')
    svg.append('</svg>');(assets/(name+'.svg')).write_text(''.join(svg),encoding='utf-8')
shutil.copyfile(work/'video-frame-0.jpg',assets/'poster.jpg')
shutil.copyfile(r'C:\Users\18780\Desktop\水墨主菜单背景视频.mp4',assets/'background.mp4')
(assets/'design-layout.json').write_text(json.dumps({'design':[1920,1080],'video':[1280,720],'exports':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False));print('Exported native PSD buttons and copied the original MP4.')
