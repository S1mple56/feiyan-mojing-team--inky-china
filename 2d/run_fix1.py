import re

path = r'd:\CN建筑\2d\bingmayong.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the top right reward button
html = re.sub(r'<button class="sys-btn" id="reward-btn".*?景区福利</button>\s*', '', html, flags=re.DOTALL)

# 2. Remove the modal HTML
html = re.sub(r'<div id="reward-modal".*?返回收集</button>\s*</div>\s*</div>\s*', '', html, flags=re.DOTALL)

# 3. Remove toggleReward related logic checking from other modals
html = html.replace(" || document.getElementById('reward-modal').style.display === 'block'", "")

# 4. Remove button from completion modal
html = html.replace("<button class=\"close-btn\" onclick=\"document.getElementById('completion-modal').style.display='none'; toggleReward();\">查看福利</button>", "<button class=\"close-btn\" onclick=\"document.getElementById('completion-modal').style.display='none';\">关闭</button>")

# 5. Hide reward-btn trigger in JS
html = re.sub(r'let rbtn = document\.getElementById\(\'reward-btn\'\);.*?rbtn\.style\.boxShadow = \'\';\n', '', html, flags=re.DOTALL)

# 6. Remove toggleReward() function from code
html = re.sub(r'window\.toggleReward = function\(\) \{.*?\n\}\n(window\.restartJourney)', r'\1', html, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
