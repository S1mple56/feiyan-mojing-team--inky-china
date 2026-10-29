"""Recover the less-compressed picture while retaining the current soundtrack."""
from pathlib import Path
import sys,subprocess,json,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tmp/video-deps'))
import imageio_ffmpeg
tool=imageio_ffmpeg.get_ffmpeg_exe();assets=root/'2d/assets/main-menu'
picture=Path(r'C:\Users\18780\Desktop\水墨主菜单背景视频.mp4')
music=Path(r'C:\Users\18780\Desktop\a3893c0930cac48f1d576271d8fa9aae.mp4')
output=assets/'background-hq.mp4'
subprocess.run([tool,'-hide_banner','-loglevel','error','-y','-i',str(picture),'-i',str(music),'-map','0:v:0','-map','1:a:0','-map_metadata','1','-vf','delogo=x=1060:y=651:w=218:h=64:show=0,unsharp=5:5:0.25:3:3:0','-c:v','libx264','-crf','15','-preset','slow','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
subprocess.run([tool,'-hide_banner','-loglevel','error','-y','-i',str(output),'-frames:v','1','-q:v','1',str(assets/'poster-hq.jpg')],check=True)
def audio_hash(file):
    data=subprocess.check_output([tool,'-v','error','-i',str(file),'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'])
    return hashlib.sha256(data).hexdigest()
assert audio_hash(output)==audio_hash(music),'current soundtrack must remain unchanged'
def frames(file):
    data=subprocess.check_output([tool,'-v','error','-i',str(file),'-vf',"select='eq(n,0)+eq(n,24)+eq(n,84)+eq(n,145)+eq(n,168)',crop=1280:650:0:0",'-fps_mode','vfr','-f','rawvideo','-pix_fmt','gray','pipe:1'])
    return np.frombuffer(data,np.uint8).astype(np.float32)
reference=frames(picture)
comparison={}
for name,file in [('previous',assets/'background-v2.mp4'),('improved',output)]:
    mse=float(np.mean((frames(file)-reference)**2));comparison[name]=round(float(10*np.log10(255**2/mse)),3)
assert comparison['improved']>comparison['previous'],'retain more of the higher-quality source detail'
report={'sourcePicture':str(picture),'sourceMusic':str(music),'output':str(output),'resolution':[1280,720],'frames':169,'audioUnchanged':True,'sourceFidelityPSNR':comparison,'bytes':output.stat().st_size}
(root/'tmp/main-menu/quality-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
