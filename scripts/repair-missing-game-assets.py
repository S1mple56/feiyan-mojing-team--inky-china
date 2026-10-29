from pathlib import Path
import wave,math,random,struct
root=Path(__file__).resolve().parents[1]/'2d'
folder=root/'assets'/'sfx';folder.mkdir(parents=True,exist_ok=True)
random.seed(17)
for name,duration,freq in [('crack',.24,210),('forge',.42,740),('stone',.19,125)]:
    frames=[];rate=22050
    for i in range(int(rate*duration)):
        t=i/rate;env=math.exp(-t*(22 if name!='forge' else 12))
        noise=random.uniform(-1,1);harmonic=math.sin(2*math.pi*freq*t)+.35*math.sin(2*math.pi*freq*2.71*t)
        signal=((noise*.8+harmonic*.2) if name=='crack' else (harmonic*.8+noise*.2))*env*.23
        frames.append(struct.pack('<h',int(max(-1,min(1,signal))*32767)))
    with wave.open(str(folder/(name+'.wav')),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(b''.join(frames))
replacements={
 'province/henan/Architecture/location/page.png':'assets/game/paper.svg',
 'province/henan/Architecture/location/stone.png':'assets/game/earth-block.svg',
 'province/henan/Architecture/location/hole.png':'assets/game/excavation-hole.svg',
 **{'audio/'+n+'.mp3':'assets/sfx/'+n+'.wav' for n in ['crack','forge','stone']}}
for file in root.glob('*.html'):
    text=file.read_text(encoding='utf-8');before=text
    for old,new in replacements.items():text=text.replace(old,new)
    if text!=before:file.write_text(text,encoding='utf-8');print('Repaired game asset references:',file.name)
