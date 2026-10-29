/* Native scene compositing for opaque NPC textures. Backgrounds are untouched. */
(() => {
 'use strict';
 function attach(scene){
  scene.events.once('create',()=>{
   const actors=scene.children.list.filter(object=>object.npcData&&object.texture);
   const prepared=new Map();let live=true;
   scene.events.once('shutdown',()=>{live=false;});
   document.documentElement.dataset.characterRendering='loading';
   const work=actors.map(async actor=>{
    const key=actor.texture.key,original=actor.texture.getSourceImage();
    if(!original||key.endsWith('__transparent'))return;
    const visible=actor.visible;actor.setVisible(false);
    try{
     if(!prepared.has(key))prepared.set(key,(async()=>{
      // Phaser fetches images into blob URLs and may revoke them immediately.
      // Composite its already decoded image rather than loading that URL again.
      const surface=await LandmarkRenderer.surface(original);
      if(!live)return null;
      const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
      canvas.getContext('2d').drawImage(surface,0,0,canvas.width,canvas.height);
      const cleanKey=key+'__transparent';
      if(!scene.textures.exists(cleanKey))scene.textures.addCanvas(cleanKey,canvas);
      return cleanKey;
     })());
     const cleanKey=await prepared.get(key);
     if(live&&actor.scene&&cleanKey){actor.setTexture(cleanKey);actor.setData('transparentCharacter',true);}
    }catch(error){console.warn('NPC rendering:',key,error.message);}
    finally{if(live&&actor.scene)actor.setVisible(visible);}
   });
   Promise.all(work).then(()=>{if(live)document.documentElement.dataset.characterRendering='ready';});
  });
 }
 window.SceneCharacterRenderer={attach};
})();
