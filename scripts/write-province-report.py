from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
audit=json.loads((root/'tmp/provinces/browser-audit.json').read_text(encoding='utf-8'))
repairs=json.loads((root/'tmp/provinces/resource-repairs.json').read_text(encoding='utf-8'))
content=json.loads((root/'tmp/provinces/content-repairs.json').read_text(encoding='utf-8'))
initial=json.loads((root/'tmp/provinces/audit-before.json').read_text(encoding='utf-8'))
lines=['# 各省份板块内容检查与修复报告','', '检查日期：2026年10月20日。范围：全国地图进入省内后的背景、景点目录、景点入口、现有游历页面启动和本地资源加载。','',
'## 检查结果','',
'- 34个省级板块均有可加载的省域背景。',
'- 19个板块配置了39处景点：17处有现成游历页面，22处此前没有点击处理，现已提供图景预览并明确标注完整游历尚未开放。',
'- 15个板块尚未配置景点，现提供省域图景与清楚的开放状态。',
'- 现有17个游历页面均通过浏览器加载检查；场景启动、纸张/石块/坑洞纹理解码纳入回归。',
'- 本轮自动化浏览器访问未发现缺失的本地资源请求或JavaScript运行错误。','',
'## 本轮修复','',
f'- 修复现有游历页面中{len(repairs)}处失效图片路径，匹配项目实际存在的资源。',
'- 修复内蒙古席力图召图标目录拼写。',
'- 为39处景点增加可访问的省内目录；已有页面直接进入，无完整页面的景点展示现有图标或场景图，不冒充完整游戏。',
'- 为15个未配置景点的板块增加状态说明与省域图景预览。',
f'- 修正{sum(r["issue"]=="mislabelled-shaolin-copy" for r in content)}个景点残留的少林寺标题、暂停/完成弹窗等串页文案。',
f'- 处理{sum(r["issue"]=="missing-or-wrong-story-video" for r in content)}处缺失或不对应的影像入口，改为明确的尚未开放提示。',
'- 将原有Phaser 3.55.2依赖保存到本地，保留MIT许可，避免在线CDN不可用引起白屏。',
'- 补齐纸张、夯土块、坑洞等代码绘制素材及3段本地合成短音效，替换6个缺失资源地址。',
'- 省内地图初始缩放调整为适配视口；滚动目录不会误缩放地图。','',
'## 逐省检查表','',
'“图景预览”表示现有素材可看，独立游历与剧情尚未制作。“省域图景”表示目前未配置景点，不表示已经制作完整省份游戏。','',
'| 板块 | 景点数 | 已有游历页面 | 景点图景预览 | 当前状态 |',
'| --- | ---: | ---: | ---: | --- |']
for p in audit['provinces']:
    status='省域图景，尚未配置景点' if not p['spots'] else '背景、目录和入口正常'
    lines.append(f"| {p['title']} | {p['spots']} | {p['gamePages']} | {p['previews']} | {status} |")
lines+=['','## 未制作独立游历的景点','']
for p in initial['list']:
    names=[s['name'] for s in p['spots'] if not s['pageExists']]
    if names:lines.append('- '+p['title']+'：'+'、'.join(names)+'。')
lines+=['','## 验证方式与界限','',
'- `scripts/verify-map.cjs`：逐一实际点击34个全国板块，验证预览、进入省份、返回和进度面板事件隔离。',
'- `scripts/verify-province-content.cjs`：检查34个省内背景和状态、39个图标、22处景点预览、15处空板块预览，以及17个已有游历页面的启动和小游戏纹理解码。',
'- 本轮检查不等同于全部支线任务通关，也未逐条外部考证历史问答和人物台词；这些内容的史实审定需另行进行。','']
(root/'docs'/'各省份板块内容检查报告.md').write_text('\n'.join(lines),encoding='utf-8')
print('Wrote docs/各省份板块内容检查报告.md')
