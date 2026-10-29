"""Create a video-only watermark repair; keep the user-supplied MP4 untouched."""
from pathlib import Path
import sys,subprocess,io,base64,json
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tmp/video-deps'))
sys.path.insert(0,str(root/'tmp/psd-deps'))
import imageio_ffmpeg
from psd_tools import PSDImage
assets=root/'2d/assets/main-menu'
tool=imageio_ffmpeg.get_ffmpeg_exe()
source=assets/'background.mp4';output=assets/'background-clean.mp4'
subprocess.run([tool,'-hide_banner','-loglevel','warning','-y','-i',str(source),'-map','0:v:0','-map','0:a?','-vf','delogo=x=1060:y=651:w=218:h=64:show=0','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
subprocess.run([tool,'-hide_banner','-loglevel','error','-y','-i',str(output),'-frames:v','1','-q:v','2',str(assets/'poster-clean.jpg')],check=True)
# The watermark crosses the original music label. Restore that native PSD
# control separately on the webpage after repairing its video area.
psd=PSDImage.open(r'C:\Users\18780\Desktop\水墨UI-墨游华夏.psd');layers=list(psd.descendants())
x,y,w,h=1589.76,977.4,278.4,81
svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">']
for index in [39,40]:
    layer=layers[index];image=layer.composite();buffer=io.BytesIO();image.save(buffer,format='PNG')
    encoded=base64.b64encode(buffer.getvalue()).decode('ascii')
    svg.append(f'<image x="{layer.left-x}" y="{layer.top-y}" width="{image.width}" height="{image.height}" href="data:image/png;base64,{encoded}"/>')
svg.append('</svg>');(assets/'music.svg').write_text(''.join(svg),encoding='utf-8')
print('Created repaired video, clean first-frame poster, and original PSD music control.')
