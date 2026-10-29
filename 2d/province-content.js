/* Existing province resources + honest previews for attractions without game pages. */
(() => {
 'use strict';
 const catalog=window.provinceContent,all=Object.entries(catalog).flatMap(([province,data])=>data.spots.map(spot=>({...spot,province})));
 const panel=document.getElementById('provinceContentPanel'),dialog=document.getElementById('provinceAttractionDialog');
 const byId=new Map(all.map(s=>[s.id,s]));
 let previewSequence=0;
 function highlight(id,active){
  document.getElementById(id)?.classList.toggle('is-highlighted',active);
  panel.querySelector(`[data-spot="${id}"]`)?.classList.toggle('is-highlighted',active);
 }
 function showPreview(province,spot){
  const data=catalog[province];if(!data)return;
  const sequence=++previewSequence;
  document.getElementById('attractionPreviewTitle').textContent=spot?spot.name:data.title+' · 省域图景';
  const image=document.getElementById('attractionPreviewImage');
  const figure=image.closest('figure');figure.querySelector('.landmark-preview-art')?.remove();image.style.display='';image.style.visibility='';figure.setAttribute('aria-busy','false');
  image.src=spot?(spot.scene||spot.icon):data.background;image.alt=spot?spot.name+'现有图景':data.title+'省域图景';
  if(spot&&!spot.scene){
   image.style.visibility='hidden';figure.setAttribute('aria-busy','true');
   const current=spot.id;figure.dataset.spot=current;
   LandmarkRenderer.surface(spot.icon).then(source=>{
    if(sequence!==previewSequence||figure.dataset.spot!==current||image.getAttribute('src')!==spot.icon)return;
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.className='landmark-preview-art';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',spot.name+'图标');canvas.getContext('2d').drawImage(source,0,0);image.style.display='none';image.after(canvas);
    figure.setAttribute('aria-busy','false');
   }).catch(error=>{if(sequence===previewSequence){image.style.visibility='';figure.setAttribute('aria-busy','false');}console.warn(error.message);});
  }else figure.dataset.spot='';
  document.getElementById('attractionPreviewCaption').textContent=spot?(spot.scene?'本景点现有场景图':'本景点现有图标；非完整游历场景'):data.title+' · 项目已收录的省域图景';
  document.getElementById('attractionPreviewNotice').textContent=spot?'此景点目前提供图景预览，独立游历与互动剧情尚未开放。可以查看已有素材，或返回本省继续选择其他景点。':'本板块目前提供省域图景，尚未配置可进入的景点。';
  document.getElementById('attractionProvinceContext').hidden=!spot;
  const context=document.getElementById('attractionProvinceImage');context.src=data.background;context.alt=data.title+'省域图景';
  if(!dialog.open)dialog.showModal();
 }
 function openSpot(id){const spot=byId.get(id);if(!spot)return;if(spot.page)location.href=spot.page;else showPreview(spot.province,spot);}
 function render(province){
  const data=catalog[province];if(!data)return;panel.replaceChildren();
  document.querySelectorAll('.landmark-spot.is-highlighted').forEach(element=>element.classList.remove('is-highlighted'));
  data.spots.forEach(spot=>{const element=document.getElementById(spot.id);if(element)LandmarkRenderer.mount(element,spot.icon).catch(error=>console.warn(error.message));});
  const title=document.createElement('h2');title.textContent=data.title+' · 游历目录';panel.append(title);
  const note=document.createElement('p'),available=data.spots.filter(s=>s.page).length;
  note.textContent=data.spots.length?`${data.spots.length} 处景点 · ${available} 处可进入游历 · ${data.spots.length-available} 处提供图景预览`:'本板块已收录省域图景，尚未配置可游历景点。';panel.append(note);
  if(data.spots.length){const list=document.createElement('div');list.className='province-spot-list';
   data.spots.forEach(spot=>{const button=document.createElement('button');button.className='province-spot-link';button.dataset.spot=spot.id;button.append(document.createTextNode(spot.name));const tag=document.createElement('small');tag.textContent=spot.page?'进入游历 →':'查看图景 · 游历待开放';button.append(tag);button.onclick=()=>openSpot(spot.id);['pointerenter','focus'].forEach(type=>button.addEventListener(type,()=>highlight(spot.id,true)));['pointerleave','blur'].forEach(type=>button.addEventListener(type,()=>highlight(spot.id,false)));list.append(button);});panel.append(list);
  }else{const button=document.createElement('button');button.className='province-overview-button';button.textContent='查看本省图景';button.onclick=()=>showPreview(province);panel.append(button);}
  const help=document.createElement('p');help.className='province-map-help';help.textContent='拖动地图，滚轮缩放；也可直接从目录进入景点。';panel.append(help);
 }
 all.forEach(spot=>{
  const element=document.getElementById(spot.id);if(!element)return;
  element.dataset.artState='pending';
  const label=document.createElement('span');label.className='landmark-label';label.append(document.createTextNode(spot.name));const status=document.createElement('small');status.textContent=spot.page?'进入游历':'图景预览';label.append(status);element.replaceChildren(label);
  ['pointerenter','focus'].forEach(type=>element.addEventListener(type,()=>highlight(spot.id,true)));
  ['pointerleave','blur'].forEach(type=>element.addEventListener(type,()=>highlight(spot.id,false)));
  element.setAttribute('role','link');element.tabIndex=0;element.setAttribute('aria-label',spot.name+(spot.page?'，进入游历':'，查看图景预览'));
  if(!spot.page)element.addEventListener('click',()=>openSpot(spot.id));
  element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSpot(spot.id);}});
 });
 document.getElementById('closeAttractionPreview').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 window.ProvinceUI={render,openSpot};
})();
