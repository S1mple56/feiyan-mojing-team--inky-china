from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return app.send_static_file(filename)
# 🔥 核心：禁用对环境包的监控，解决无限重启
app.config['FLASK_IGNORE_EXCEPTIONS'] = True
app.config['DEBUG'] = True
# 只监听项目自身文件（Windows/Linux通用）
app.config['FLASK_WATCH_MODULES'] = False
# 开启 CORS，允许前端跨域访问这个后端
CORS(app)

# ==================== 数据库配置 (SQLite) ====================
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ancient_architecture.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """首次启动时自动建表，无需手动导入 SQL"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            item_desc TEXT DEFAULT '',
            acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, item_name)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            required_points INTEGER NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            type TEXT DEFAULT ''
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reward_id INTEGER NOT NULL,
            redeem_code TEXT NOT NULL,
            redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (reward_id) REFERENCES rewards(id)
        )
    """)

    conn.commit()
    conn.close()

# 启动时自动建表
init_db()

# ==================== 火山引擎 API 配置 ====================
API_KEY = "d12bf4ad-7545-425b-b96d-ecc7f527c32d"

# 1. 图像模型配置
IMAGE_MODEL_ID = "doubao-seedream-4-0-250828"
IMAGE_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"

# 2. 文本聊天模型配置
CHAT_MODEL_ID = "doubao-seed-2-0-pro-260215"
CHAT_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

# 3. 视觉识别模型配置（传送阵用）
VISION_MODEL_ID = "doubao-1-5-vision-pro-32k-250115"


# ==================== 接口1：点土成兵 / 悟道武学 (文生图) ====================
@app.route('/api/generate-warrior', methods=['POST'])
def generate_warrior():
    data = request.json
    user_prompt = data.get('prompt', '')
    default_img_prompt = f"生成一张高度写实、还原历史古迹的秦始皇兵马俑全身立绘。玩家描述如下：{user_prompt}。要求：人物必须是真实的陶土材质...绝对正视图，全身像，纯白色背景，无杂物。"
    full_prompt = data.get('image_prompt', default_img_prompt)

    headers = { "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}" }
    payload = { "model": IMAGE_MODEL_ID, "prompt": full_prompt, "response_format": "b64_json" }

    try:
        response = requests.post(IMAGE_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "生成失败", "details": str(e)}), 500


# ==================== 接口2：AI 聊天 (大语言模型) ====================
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get('message', '')

    default_sys_prompt = """你现在是千古一帝秦始皇嬴政。你说话充满绝对的帝王威严，自称"朕"，带有文言文色彩。
    玩家是一个现代穿越者。你的目的是考察他对大秦律法、统一六国、书同文车同轨等历史功绩的理解。
    你绝不能直接把答案告诉他。如果玩家的回答展现出了对大秦功绩的深刻理解或合理的赞美，令你非常满意，你必须在回复的最后加上赏这个字作为标记。如果不满意，严厉驳斥他。"""
    # 兼容数字人前端发送的 system/context 参数
    system_prompt = data.get('system_prompt', '') or data.get('system', '') or default_sys_prompt
    context = data.get('context', '')
    if context:
        system_prompt = context + '\n' + system_prompt

    headers = { "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}" }
    payload = {
        "model": CHAT_MODEL_ID,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ]
    }

    try:
        response = requests.post(CHAT_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        ai_reply = result['choices'][0]['message']['content']
        is_success = "[SUCCESS]" in ai_reply
        clean_reply = ai_reply.replace("[SUCCESS]", "").strip()
        return jsonify({"reply": clean_reply, "success": is_success})
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "对话失败", "details": str(e)}), 500

# ==================== 接口3：AI 定制头像 (图生图/文生图) ====================
@app.route('/api/generate-avatar', methods=['POST'])
def generate_avatar():
    data = request.json
    original_image_b64 = data.get('image')

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": IMAGE_MODEL_ID,
        "prompt": "将图片中的人物转化为中国古代传统彩色水墨画风格的Q版游戏角色。要求：穿着明亮颜色（如浅蓝、淡黄或纯白色）的汉服，人物边缘要有清晰的深色轮廓线，正视图，全身像，纯白色背景。画面色彩要明快，不要使用大面积的纯黑浓墨。",
        "response_format": "b64_json"
    }

    try:
        response = requests.post(IMAGE_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        error_msg = e.response.text if e.response else str(e)
        print("火山引擎 API 报错:", error_msg)
        return jsonify({"error": "生成失败", "details": error_msg}), 500

# ==================== 接口4：传送阵 (大模型视觉识别) ====================
@app.route('/api/teleport', methods=['POST'])
def teleport():
    data = request.json
    image_b64 = data.get('image', '')

    headers = { "Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}" }

    system_prompt = '你是一个中国古迹识别罗盘。请看这张图片，识别其中的中国古迹或名胜。支持识别的古迹有：兵马俑、少林寺、布达拉宫、长城、黄鹤楼、龙门石窟、蓬莱阁、滕王阁、天坛、岳阳楼、赵州桥、殷墟、洛阳城。请只回答对应古迹的名称。如果图片中没有古迹、不属于以上列表、或者无法确定，请只回答"未知"。不要加任何标点符号和其他解释语。'

    payload = {
        "model": VISION_MODEL_ID,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": system_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_b64
                        }
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(CHAT_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        ai_reply = result['choices'][0]['message']['content']
        return jsonify({"result": ai_reply})
    except requests.exceptions.RequestException as e:
        error_msg = e.response.text if e.response else str(e)
        print("传送阵识别报错:", error_msg)
        return jsonify({"error": "传送失败", "details": error_msg}), 500

# ==================== 接口5：用户注册 ====================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "用户名和密码不能为空"}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # 检查是否已存在
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return jsonify({"error": "用户名已存在"}), 409

        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        return jsonify({"message": "注册成功", "success": True})
    except Exception as e:
        return jsonify({"error": "注册失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口6：用户登录 ====================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user['password'], password):
            return jsonify({"message": "登录成功", "success": True, "user_id": user['id'], "username": user['username']})
        else:
            return jsonify({"error": "用户名或密码错误"}), 401
    except Exception as e:
        return jsonify({"error": "登录失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口7：添加信物到背包 ====================
@app.route('/api/add-item', methods=['POST'])
def add_item():
    data = request.json
    username = data.get('username')
    item_name = data.get('item_name')
    item_desc = data.get('item_desc', '')

    if not username or not item_name:
        return jsonify({"error": "参数不完整"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # 先查出 user_id
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "找不到用户，请先登录"}), 404

        user_id = user['id']

        # 使用 INSERT OR IGNORE 防止重复插入报错
        cursor.execute("""
            INSERT OR IGNORE INTO user_items (user_id, item_name, item_desc)
            VALUES (?, ?, ?)
        """, (user_id, item_name, item_desc))

        if cursor.rowcount > 0:
            # 给用户增加 5 积分
            cursor.execute("UPDATE users SET points = points + 5 WHERE id = ?", (user_id,))
            msg = f"信物【{item_name}】已成功存入背包！获得 5 积分！"
        else:
            msg = f"信物【{item_name}】你已经拥有过了。"

        conn.commit()
        return jsonify({"message": msg, "success": True})
    except Exception as e:
        return jsonify({"error": "保存失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口8：获取背包信物 ====================
@app.route('/api/get-items', methods=['POST'])
def get_items():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({"error": "缺少用户名"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "找不到用户"}), 404

        cursor.execute("SELECT item_name, item_desc, acquired_at FROM user_items WHERE user_id = ? ORDER BY acquired_at DESC", (user['id'],))
        items = [dict(row) for row in cursor.fetchall()]
        return jsonify({"success": True, "items": items})
    except Exception as e:
        return jsonify({"error": "获取失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口9：获取兑换奖励列表 ====================
@app.route('/api/rewards', methods=['POST'])
def get_rewards():
    data = request.json
    username = data.get('username')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # 查出所有的福利商品
        cursor.execute("SELECT * FROM rewards ORDER BY required_points ASC")
        rewards = [dict(row) for row in cursor.fetchall()]

        user_points = 0
        user_redeemed = []
        if username:
            cursor.execute("SELECT id, points FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            if user:
                user_points = user['points']
                # 查出当前用户已经兑换了哪些商品
                cursor.execute("""
                    SELECT r.name, ur.redeemed_at, ur.redeem_code
                    FROM user_rewards ur
                    JOIN rewards r ON r.id = ur.reward_id
                    WHERE ur.user_id = ?
                    ORDER BY ur.redeemed_at DESC
                """, (user['id'],))
                user_redeemed = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            "success": True,
            "rewards": rewards,
            "user_points": user_points,
            "user_redeemed": user_redeemed
        })
    except Exception as e:
        return jsonify({"error": "获取福利失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口10：兑换奖励 ====================
import uuid

@app.route('/api/redeem', methods=['POST'])
def redeem_reward():
    data = request.json
    username = data.get('username')
    reward_id = data.get('reward_id')

    if not username or not reward_id:
        return jsonify({"error": "请求参数不合法"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, points FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "请先登录！"}), 401

        cursor.execute("SELECT * FROM rewards WHERE id = ?", (reward_id,))
        reward = cursor.fetchone()
        if not reward:
            return jsonify({"error": "福利商品不存在！"}), 404

        if reward['stock'] <= 0:
            return jsonify({"error": "商品已被兑换完！"}), 400

        if user['points'] < reward['required_points']:
            return jsonify({"error": f"积分不足，还需要 {reward['required_points'] - user['points']} 积分。"}), 400

        # 执行兑换：1.扣积分 2.减库存 3.生成兑换码并记录
        new_points = user['points'] - reward['required_points']
        cursor.execute("UPDATE users SET points = ? WHERE id = ?", (new_points, user['id']))
        cursor.execute("UPDATE rewards SET stock = stock - 1 WHERE id = ?", (reward_id,))

        redeem_code = f"{reward['type'].upper()}-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
            INSERT INTO user_rewards (user_id, reward_id, redeem_code)
            VALUES (?, ?, ?)
        """, (user['id'], reward_id, redeem_code))

        conn.commit()
        return jsonify({
            "success": True,
            "message": f"成功兑换【{reward['name']}】！兑换码：{redeem_code}",
            "points": new_points
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": "兑换失败", "details": str(e)}), 500
    finally:
        conn.close()

# ==================== 接口11：TTS 语音合成（多方言） ====================
import base64, uuid, json as _json

TTS_API_URL = "https://openspeech.bytedance.com/api/v1/tts"

# 方言音色映射
VOICE_MAP = {
    "mandarin":  {"voice_type": "BV001_streaming",  "name": "普通话-晓晓"},
    "cantonese": {"voice_type": "BV700_streaming",  "name": "粤语-晓粤"},
    "sichuan":   {"voice_type": "BV705_streaming",  "name": "四川话-晓川"},
    "northeast": {"voice_type": "BV711_streaming",  "name": "东北话-晓东北"},
    "taiwan":    {"voice_type": "BV707_streaming",  "name": "台湾腔-晓台"},
    "henan":     {"voice_type": "BV706_streaming",  "name": "河南话-晓豫"},
    "shandong":  {"voice_type": "BV709_streaming",  "name": "山东话-晓鲁"},
}

@app.route('/api/tts', methods=['POST'])
def tts():
    data = request.json
    text = data.get('text', '')
    dialect = data.get('dialect', 'mandarin')
    voice_info = VOICE_MAP.get(dialect, VOICE_MAP['mandarin'])

    payload = {
        "app": {"appid": "2653460671", "token": "0fhwUGdElhMuVpkV2WrcwvPiOORTePom", "cluster": "volcano_tts"},
        "user": {"uid": "digital_human_user"},
        "audio": {"voice_type": voice_info["voice_type"], "encoding": "mp3", "speed_ratio": 1.0, "volume_ratio": 1.0, "pitch_ratio": 1.0},
        "request": {"reqid": str(uuid.uuid4()), "text": text, "text_type": "plain", "operation": "query"}
    }

    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(TTS_API_URL, headers=headers, json=payload, timeout=10)
        result = response.json()
        if result.get("code") == 3000:
            audio_b64 = result["data"]
            return jsonify({"success": True, "audio": audio_b64, "voice_name": voice_info["name"]})
        else:
            return jsonify({"error": "TTS合成失败", "details": result.get("message", "未知错误")}), 500
    except Exception as e:
        return jsonify({"error": "TTS服务异常", "details": str(e)}), 500

if __name__ == '__main__':
    print("🚀 后端服务器已启动: http://127.0.0.1:5000")
    print(f"📦 数据库文件: {DB_PATH}")
    app.run(port=5000, debug=True)



