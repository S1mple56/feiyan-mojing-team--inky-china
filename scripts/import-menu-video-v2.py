from pathlib import Path
import sys,subprocess,shutil
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tmp/video-deps'))
import imageio_ffmpeg
tool=imageio_ffmpeg.get_ffmpeg_exe();assets=root/'2d/assets/main-menu'
source=Path(r'C:\Users\18780\Desktop\a3893c0930cac48f1d576271d8fa9aae.mp4')
shutil.copyfile(source,root/'tmp/main-menu/source-video-v2.mp4')
output=assets/'background-v2.mp4'
subprocess.run([tool,'-hide_banner','-loglevel','error','-y','-i',str(source),'-map','0:v:0','-map','0:a:0','-vf','delogo=x=1060:y=651:w=218:h=64:show=0','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
subprocess.run([tool,'-hide_banner','-loglevel','error','-y','-i',str(output),'-frames:v','1','-q:v','2',str(assets/'poster-v2.jpg')],check=True)
print('Imported new background video as H.264; original AAC music preserved.')
