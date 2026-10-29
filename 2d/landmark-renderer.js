/* Render existing JPEG map textures on transparent canvas surfaces.
 * Source artwork is never rewritten. Interior dark masonry remains opaque.
 */
(() => {
 'use strict';
 const cache = new Map();
 function surface(src) {
  if(cache.has(src))return cache.get(src);
  const result=new Promise((resolve,reject)=>{
   const image=typeof src==='string'?new Image():src;
   const render=()=>{
    try{
     const scale=Math.min(1,1200/image.naturalWidth,1200/image.naturalHeight);
     const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
     const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
     const frame=ctx.getImageData(0,0,canvas.width,canvas.height),rgba=frame.data,w=canvas.width,h=canvas.height,n=w*h;
     const dark=rgba[0]+rgba[1]+rgba[2]<240;
     const candidate=new Uint8Array(n),firstRow=new Int32Array(h).fill(w),lastRow=new Int32Array(h).fill(-1),firstColumn=new Int32Array(w).fill(h);
     for(let y=0;y<h;y++){
      const left=(y*w)*4,right=(y*w+w-1)*4;
      // A few source icons have a pale paper/gray gradient instead of black.
      const edge=[0,1,2].map(c=>(rgba[left+c]+rgba[right+c])/2);
      for(let x=0;x<w;x++){
       const p=y*w+x,i=p*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
       const background=dark?Math.max(r,g,b)<38:(Math.max(Math.abs(r-edge[0]),Math.abs(g-edge[1]),Math.abs(b-edge[2]))<24||Math.min(r,g,b)>244);
       candidate[p]=background?1:0;
       if(!background){firstRow[y]=Math.min(firstRow[y],x);lastRow[y]=x;firstColumn[x]=Math.min(firstColumn[x],y);}
      }
     }
     // Keep doorways/shadows open to the bottom of an illustration. They are
     // bounded by architecture above and on both sides, unlike its backdrop.
     if(dark)for(let y=0;y<h;y++)for(let x=firstRow[y];x<=lastRow[y];x++)if(firstColumn[x]<y)candidate[y*w+x]=0;
     const queue=new Int32Array(n),seen=new Uint8Array(n);let head=0,tail=0;
     function visit(p){if(candidate[p]&&!seen[p]){seen[p]=1;queue[tail++]=p;}}
     for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}
     for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
     while(head<tail){const p=queue[head++],x=p%w;rgba[p*4+3]=0;if(x>0)visit(p-1);if(x<w-1)visit(p+1);if(p>=w)visit(p-w);if(p<n-w)visit(p+w);}
     ctx.putImageData(frame,0,0);canvas.dataset.background=dark?'dark':'light';resolve(canvas);
    }catch(error){reject(error);}
   };
   if(typeof src==='string'){image.onload=render;image.onerror=()=>reject(new Error('Landmark texture unavailable: '+src));image.src=src;}
   else render();
  });cache.set(src,result);result.catch(()=>cache.delete(src));return result;
 }
 async function mount(element,src,className='landmark-art'){
  if(element.querySelector('.'+className))return element.querySelector('.'+className);
  if(className==='landmark-art')element.dataset.artState='loading';
  let source;
  try{source=await surface(src);}catch(error){if(className==='landmark-art')element.dataset.artState='error';throw error;}
  if(element.querySelector('.'+className))return element.querySelector('.'+className);
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.className=className;canvas.setAttribute('aria-hidden','true');canvas.getContext('2d').drawImage(source,0,0);element.prepend(canvas);
  if(className==='landmark-art'){element.style.backgroundImage='none';element.dataset.artState='ready';}
  return canvas;
 }
 window.LandmarkRenderer={surface,mount};
})();
