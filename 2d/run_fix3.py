import re

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()

    # remove rbtn block
    t = re.sub(r'let rbtn = document\.getElementById\(\'reward-btn\'\);.*?\}', '', t, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(t)

fix(r'd:\CN建筑\2d\bingmayong.html')
fix(r'd:\CN建筑\2d\yinxu.html')
