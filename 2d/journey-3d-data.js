/* 空间坐标、固定任务与机关。建筑为风格化记忆空间，不是测绘复原。 */
'use strict';
const journey3D = [
    { id:'yellow-crane', mood:'暮照 · 江声', color:0xe9b980, fog:0x89979b, sky:0xa9b6bb, spawn:[0,0,12], seal:'楼不为留人',
      tasks:[
        {title:'读回信件',desc:'登上楼阁，找回题壁、屏风与栏杆旁的三片信纸。',result:'三片信纸合为一封信。近岸树影、远处帆影与江面暮色，连成了送信的方向。',nodes:[
          {label:'题壁信纸',pos:[-4,0,3],kind:'paper'}, {label:'屏风信纸',pos:[4,4.2,2],kind:'paper'}, {label:'栏杆信纸',pos:[-3,8.4,3],kind:'paper',puzzle:'rotate',clue:'让三片信纸上的墨迹朝上，重新拼回同一封信。',symbols:['树','帆','暮']}]},
        {title:'找到渡口',desc:'循信中的景物开窗：近岸树影 → 远处帆影 → 江面暮色。',result:'三处窗景的光汇成一条路。墨雾散开，渡口在江边显现。',nodes:[
          {label:'近岸树影窗',pos:[6,0,0],kind:'window',puzzle:'frame',target:28,symbol:'树影'},
          {label:'远处帆影窗',pos:[6,4.2,0],kind:'window',puzzle:'frame',target:62,symbol:'帆影'},
          {label:'江面暮色窗',pos:[6,8.4,0],kind:'window',puzzle:'frame',target:81,symbol:'暮色'}]},
        {title:'完成告别',desc:'下楼循光路来到渡口。读出祝愿、交还信件，再点亮岸灯。',result:'“你往前走，我会记得这一程。”船终于离岸。这一次，时间没有倒退。',nodes:[
          {label:'送行人',pos:[18,0,13],kind:'person',words:'我总说找不到路，其实是怕信送出去，他就再也不会回来。\n\n你读出信末的祝愿。送行人终于松开了手。'},
          {label:'渡口旅人',pos:[23,0,14],kind:'person',words:'这是给我的信？……这份祝愿，我会带在身边。请替我谢谢他。'},
          {label:'渡口岸灯',pos:[27,0,13],kind:'lamp'}]}
      ]},
    { id:'zhaozhou',mood:'水雾 · 灯影',color:0xc2d7d4,fog:0x7e9b9e,sky:0xb4c9ca,spawn:[-25,0,8],seal:'桥要让人过去',tasks:[
        {title:'找到修桥记录',desc:'从桥头行囊找到草图，再沿刻痕补回缺页。',result:'草图补全：左岸、拱顶、右岸。桥下的记忆终于有了顺序。',nodes:[{label:'桥头旧行囊',pos:[-24,0,4],kind:'chest'},{label:'桥面刻痕',pos:[-17,0,6],kind:'stone'},{label:'草图缺页',pos:[-11,0,7],kind:'paper',puzzle:'sequence',symbols:['左岸','拱顶','右岸'],clue:'草图上的箭头从左岸起，经拱顶，落到右岸。'}]},
        {title:'接通两岸',desc:'在桥下复位记忆拱石，让虚影中的通路重新稳固。',result:'桥面逐段变为实体。石缝里的信匣终于露了出来。',nodes:[{label:'左岸拱石',pos:[-9,0,6],kind:'stone',puzzle:'rotate',symbols:['左','拱','石']},{label:'拱顶承托石',pos:[0,0,6],kind:'stone',puzzle:'rotate',symbols:['承','托','合']},{label:'右岸拱石',pos:[9,0,6],kind:'stone',puzzle:'rotate',symbols:['右','拱','石']}]},
        {title:'读出未尽的约定',desc:'取出信匣里的家书与感谢，把它们交给守桥老人。',result:'老人读出了亲人的笔迹，也读到了许多被照亮的生命。等待可以继续照顾过路的人。',nodes:[{label:'石缝信匣',pos:[12,0,7],kind:'chest',words:'家书里写着未说完的牵挂。几封感谢信记录着年轻人如何为遇险者引路。没有一封，替他承诺归期。'},{label:'守桥老人',pos:[-23,0,2],kind:'person',words:'原来他照亮过这么多人的路。\n\n这盏灯，先替他照着路吧。'}]},
        {title:'把灯移到中央',desc:'带着老人的渡灯走上桥，把光留在两岸之间。',result:'灯影落入水面，两岸的雾慢慢散去。脚步声由远及近，桥终于通向了人间。',nodes:[{label:'老人交出的渡灯',pos:[-21,0,3],kind:'lamp'},{label:'桥中央灯架',pos:[0,5,0],kind:'lamp'}]}
    ]},
    {id:'zhuozheng',mood:'青雨 · 四时',color:0xd1dab0,fog:0x91aaa0,sky:0xbbcec1,spawn:[0,0,19],seal:'留一扇窗',tasks:[
        {title:'认出四幅景',desc:'走过回廊，把局部画与窗外树影、水岸、亭角和山石对应。',result:'四幅景连成游览顺序：树影、水岸、亭角、山石。重复回廊里出现了差异。',nodes:[{label:'树影画',pos:[-14,0,10],kind:'paper'},{label:'水岸画',pos:[-14,0,0],kind:'paper'},{label:'亭角画',pos:[14,0,0],kind:'paper'},{label:'山石画',pos:[14,0,10],kind:'paper',puzzle:'sequence',symbols:['树影','水岸','亭角','山石'],clue:'沿画上的水痕：树影起笔，经过水岸，抬头见亭角，最后落在山石。'}]},
        {title:'找到真正的路径',desc:'调整回廊屏风，用框景找回被遮住的水院路径。',result:'屏风不再遮住视线，假山后的水闸显露。回廊终于不再重复。',nodes:[{label:'回廊框景',pos:[-12,0,-9],kind:'window',puzzle:'frame',target:43,symbol:'亭角'},{label:'水院屏风',pos:[12,0,-9],kind:'window',puzzle:'frame',target:70,symbol:'山石'}]},
        {title:'让四季归位',desc:'开启水闸，再把四时画放回正确的位置。',result:'水开始流动，春雨、夏声、秋叶和冬影在不同庭院里重新出现。',nodes:[{label:'假山水闸',pos:[0,0,-15],kind:'stone',puzzle:'rotate',symbols:['开','水','流']},{label:'四时画座',pos:[0,0,-9],kind:'chest',puzzle:'sequence',symbols:['春雨','夏声','秋叶','冬影'],clue:'让时间依自然的次序经过：春、夏、秋、冬。'}]},
        {title:'完成新的画',desc:'拾起水院里的秋叶，把变化留进画师的春景。',result:'画师落下最后一笔：“下次来，也许会有另一种好看。”园门在流水声中打开。',nodes:[{label:'水院秋叶',pos:[5,0,9],kind:'leaf'},{label:'画师与未完的画',pos:[-7,0,16],kind:'person',words:'我总想留住当年最好的春天。可你放进来的这片秋叶，也是我从未画过的美。\n\n留一扇窗，让时间经过。'}]}
    ]},
    {id:'yinxian',mood:'木鸣 · 微光',color:0xe6c292,fog:0x839493,sky:0xaabdb8,spawn:[0,0,13],seal:'无名亦承托',tasks:[
        {title:'读懂工具痕迹',desc:'对照入口工具、木料和操作台上的检查记号。',result:'师傅留下的顺序是先立支柱、再接横梁、最后复核连接。',nodes:[{label:'入口工具标记',pos:[-4,0,4],kind:'tool'},{label:'中层木料',pos:[4,4.2,2],kind:'wood'},{label:'操作台检查图',pos:[-3,4.2,-2],kind:'paper',puzzle:'sequence',symbols:['支柱','横梁','连接'],clue:'从竖向支撑开始，再接水平构件，最后检查接合。'}]},
        {title:'完成承托任务',desc:'在操作台恢复简化连接，让上行的楼梯稳定下来。',result:'连接合拢，梁柱的虚影逐渐稳定。上层的微光不再遥远。',nodes:[{label:'承托操作台',pos:[0,4.2,3],kind:'wood',puzzle:'rotate',symbols:['柱','梁','合']},{label:'上层连接',pos:[3,8.4,3],kind:'wood',puzzle:'rotate',symbols:['承','托','稳']}]},
        {title:'找到自己的名字',desc:'沿光找到营造账册，把散落的工作记录归位。',result:'账册将学徒的工作与塔中位置连在一起。他从来不是“什么也没做成”。',nodes:[{label:'营造账册',pos:[-3,8.4,-2],kind:'chest'},{label:'修补记录',pos:[0,8.4,1],kind:'paper',puzzle:'sequence',symbols:['检查','修补','复核'],clue:'账册记录着完整工作：先检查，再修补，最后复核。'}]},
        {title:'留下最后一次修补',desc:'回到入口，补好最早遗漏的一处连接，再把工具交给后来者。',result:'“这一处，我补好了。”学徒把账册留在塔中，许多无名匠人的工作回声在梁柱间响起。',nodes:[{label:'入口遗漏连接',pos:[4,0,4],kind:'wood',puzzle:'rotate',symbols:['留','补','承']},{label:'小学徒',pos:[-3,0,9],kind:'person',words:'我以为要到塔顶，才会知道师傅有没有记得我。\n\n原来每一次检查和修补，都留在了这里。账册留下，工具交给后来的人。'}]}
    ]},
    {id:'tulou',mood:'万家 · 一灯',color:0xf1c28b,fog:0x6c858b,sky:0x8cabb5,spawn:[0,0,25],seal:'此处是归处',tasks:[
        {title:'送还工具',desc:'拾起门边工具，循修补痕迹找到它的主人。',result:'第一扇门打开。住户修好灯架，交出一只待补的灯笼。',nodes:[{label:'门边修补工具',pos:[-8,0,19],kind:'tool'},{label:'一号门住户',pos:[-16,0,10],kind:'person',words:'这是我的工具，谢谢你。灯架终于能修好了。\n\n请把这只灯笼补好，再交给隔壁那户人家。'}]},
        {title:'修补灯笼',desc:'沿环廊找回纹样，为第二户补好灯笼。',result:'第二户点亮了灯。灯架的夹层里，藏着一封未送达的家书。',nodes:[{label:'环廊灯笼纹样',pos:[-18,0,-5],kind:'paper',puzzle:'rotate',symbols:['团','圆','灯']},{label:'二号门灯架',pos:[-9,0,-16],kind:'lamp',words:'灯光透过新补的纹样，映出了夹层里的家书。信封写着三号门的名字。'}]},
        {title:'传递家书',desc:'沿门牌与声音送达家书，让迟来的感谢重新开口。',result:'“原来你一直记得。”几扇门相继打开，住户带着灯走向院落。',nodes:[{label:'三号门收信人',pos:[14,0,-12],kind:'person',words:'这封信，我等了很久。原来那些没说出口的话，一直都在。\n\n谢谢你把它送来。到院里来吧，大家都在等着。'}]},
        {title:'点亮共同的灯',desc:'把前四关信物的墨影汇入灯座，取得团圆灯芯。',result:'小墨灵终于明白：它由许多建筑中的生活记忆汇成，没有唯一的房间，也没有唯一的名字。',nodes:[{label:'长卷灯座',pos:[0,0,0],kind:'lamp',puzzle:'sequence',symbols:['鹤羽','渡灯','画笺','匠尺'],clue:'按走过的旅程汇入墨影：告别、守候、变化、承托。收藏信物本体仍留在行囊。'},{label:'团圆灯芯',pos:[0,0,3],kind:'lamp',words:'你把团圆灯芯放入共同的灯。\n\n“到院里来吧。”住户们这样邀请小墨灵。它不必再寻找某一扇属于自己的门。'}]}
    ]}
];
