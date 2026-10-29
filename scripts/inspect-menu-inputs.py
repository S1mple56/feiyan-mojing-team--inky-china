from pathlib import Path
from PIL import Image, ImageDraw
import cv2, json, struct

root=Path(__file__).resolve().parents[1]
out=root/'tmp'/'main-menu';out.mkdir(parents=True,exist_ok=True)
psd=Path(r'C:\Users\18780\Desktop\水墨UI-墨游华夏.psd')
video=Path(r'C:\Users\18780\Desktop\水墨主菜单背景视频.mp4')
try:
    im=Image.open(str(psd));print('PSD:',im.mode,im.size);im.convert('RGB').save(str(out/'psd-composite.jpg'))
except Exception as error:
    print('PSD composite decoder:',str(error))
capture=cv2.VideoCapture(str(video));fps=capture.get(cv2.CAP_PROP_FPS);count=capture.get(cv2.CAP_PROP_FRAME_COUNT);width=capture.get(cv2.CAP_PROP_FRAME_WIDTH);height=capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
print('Video:',width,height,'fps',fps,'frames',count,'seconds',count/fps)
frames=[]
for i,t in enumerate([0,1,max(0,count/fps/2),max(0,count/fps-.2)]):
    capture.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,frame=capture.read()
    if ok:
        frame=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB));frame.save(str(out/('video-frame-'+str(i)+'.jpg')));frames.append(frame)
capture.release()
sheet=Image.new('RGB',(1280,720),'#222')
for i,frame in enumerate(frames):frame.thumbnail((640,360));sheet.paste(frame,((i%2)*640,(i//2)*360))
sheet.save(str(out/'video-contact.jpg'))

# Read PSD layer records for original names, visibility and exact design bounds.
data=psd.read_bytes();pos=26
def u32(at):return struct.unpack_from('>I',data,at)[0]
for _ in range(2):length=u32(pos);pos+=4+length
section_length=u32(pos);pos+=4
info_length=u32(pos);pos+=4
layers=[]
if info_length:
    count=abs(struct.unpack_from('>h',data,pos)[0]);pos+=2
    for index in range(count):
        top,left,bottom,right=struct.unpack_from('>4i',data,pos);pos+=16
        channels=struct.unpack_from('>H',data,pos)[0];pos+=2+channels*6
        signature,blend,opacity,clipping,flags,filler=struct.unpack_from('>4s4s4B',data,pos);pos+=12
        extra=u32(pos);pos+=4;end=pos+extra
        length=u32(pos);pos+=4+length
        length=u32(pos);pos+=4+length
        length=data[pos];name=data[pos+1:pos+1+length].decode('gb18030',errors='replace');pos+=((length+1+3)//4)*4
        kind=None
        while pos+12<=end:
            sig=data[pos:pos+4];key=data[pos+4:pos+8];size=u32(pos+8);payload=pos+12
            if sig not in [b'8BIM',b'8B64']:break
            if key==b'luni':n=u32(payload);name=data[payload+4:payload+4+n*2].decode('utf-16-be',errors='replace')
            if key==b'lsct':kind=u32(payload)
            pos=payload+size+(size%2)
        layers.append({'index':index,'name':name,'bounds':[left,top,right,bottom],'visible':not bool(flags&2),'opacity':opacity,'section':kind})
        pos=end
(out/'psd-layers.json').write_text(json.dumps(layers,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(layers,ensure_ascii=False,indent=2))
