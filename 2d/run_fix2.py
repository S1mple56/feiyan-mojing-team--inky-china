import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()

    # 1. Remove sys-btn reward
    t = re.sub(r'<button class=\"sys-btn\" id=\"reward-btn\".*?景区福利</button>\s*', '', t, flags=re.DOTALL)

    # 2. Remove reward-modal html
    t = re.sub(r'<div id=\"reward-modal\".*?</div>\s*</div>\s*', '', t, flags=re.DOTALL)
    
    # 3. Clean up the close button
    t = t.replace("document.getElementById('completion-modal').style.display='none'; toggleReward();", "document.getElementById('completion-modal').style.display='none';")
    t = t.replace(">查看福利</button>", ">关闭</button>")

    # 4. Remove toggleReward related check
    t = t.replace(" || document.getElementById('reward-modal').style.display === 'block'", "")

    # 5. Remove JS for reward toggle
    t = re.sub(r'window\.toggleReward.*?function\(\) \{.*?(?=function showToast|window\.restartJourney)', '', t, flags=re.DOTALL)

    # 6. Remove rbtn animation logic
    t = re.sub(r'let rbtn = document\.getElementById\(\'reward-btn\'\);.*?\} else \{\s*rbtn\.style\.boxShadow = \'\';\s*\}\s*', '', t, flags=re.DOTALL)

    # 7. Remove toast about reward
    t = t.replace("showToast('🎉【任务完成】您已集齐所有印记，请点击上方【景区福利】兑换现实奖励！');", "")
    t = t.replace("showToast('🎉【任务完成】信物全集齐！点击右上角【景区福利】兑换现实奖励！');", "")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(t)

fix(r'd:\CN建筑\2d\bingmayong.html')
fix(r'd:\CN建筑\2d\yinxu.html')
