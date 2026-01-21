from flask import Flask, render_template, jsonify, request, abort
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# --- Configuration & Setup ---
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__, static_folder='static', template_folder='templates')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")
        supabase = None
else:
    print("Warning: Supabase credentials missing.")

PRACTICE_POINTS = {"Hard": 8, "Medium": 4, "Easy": 2, "Basic": 1}

# --- Helper Functions ---

def load_json(filepath):
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(base_dir, filepath)
        with open(full_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def fetch_gfg_data(handle: str):
    practice_url = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/"
    try:
        practice_res = requests.post(practice_url, json={"handle": handle}, timeout=10).json()
    except:
        practice_res = {}
    
    community_url = f"https://communityapi.geeksforgeeks.org/post/user/{handle}/"
    try:
        community_res = requests.get(community_url, params={"fetch_type": "posts", "page": 1}, timeout=10).json()
    except:
        community_res = {}

    p_score = 0
    if practice_res.get("status") == "success":
        res = practice_res.get("result", {})
        p_score = sum(len(res.get(lvl, {})) * PRACTICE_POINTS.get(lvl, 0) for lvl in PRACTICE_POINTS.keys())

    c_score = 0
    if community_res and "results" in community_res:
        total_posts = community_res.get("count", 0)
        total_likes = sum(p.get("like_count", 0) for p in community_res.get("results", []))
        c_score = (total_posts * 5) + (total_likes * 2)

    total_score = p_score + c_score
    
    tier = "🥉 Bronze"
    if total_score >= 500: tier = "💎 Diamond"
    elif total_score >= 200: tier = "🥇 Gold"
    elif total_score >= 50:  tier = "🥈 Silver"

    return {"score": total_score, "tier": tier}

# --- Page Routes ---

@app.route('/')
def home():
    courses = load_json('data/courses.json')[:3]
    events = load_json('data/events/upcoming.json')[:2]
    ongoing = load_json('data/events/ongoing.json')
    deals = load_json('data/deals.json')[:2]
    team = load_json('data/team.json')[:4]
    return render_template('index.html', 
                           courses=courses, 
                           events=events,
                           ongoing=ongoing,
                           deals=deals, 
                           team=team)

@app.route('/courses')
def courses_page():
    courses = load_json('data/courses.json')
    return render_template('courses.html', courses=courses)

@app.route('/events')
def events_page():
    upcoming = load_json('data/events/upcoming.json')
    ongoing = load_json('data/events/ongoing.json')
    past = load_json('data/events/past.json')
    return render_template('events.html', 
                           upcoming=upcoming, 
                           ongoing=ongoing, 
                           past=past)

@app.route('/deals')
def deals_page():
    deals = load_json('data/deals.json')
    return render_template('deals.html', deals=deals)

@app.route('/team')
def team_page():
    team = load_json('data/team.json')
    return render_template('team.html', team=team)

@app.route('/leaderboard')
def leaderboard_page():
    return render_template('leaderboard.html')

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

@app.route('/secret-id-gen')
def id_generator():
    return render_template('id_generator.html')

# --- API Routes ---

@app.route('/api/events/<event_type>')
def get_events(event_type):
    data = load_json(f'data/events/{event_type}.json')
    return jsonify(data)

@app.route("/api/user/<handle>", methods=['POST'])
def add_user(handle):
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    try:
        stats = fetch_gfg_data(handle)
        data = {
            "handle": handle,
            "score": stats["score"],
            "tier": stats["tier"]
        }
        response = supabase.table("users").upsert(data, on_conflict="handle").execute()
        return jsonify({"message": f"User {handle} synced", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<old_handle>", methods=['PUT'])
def edit_user(old_handle):
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    new_handle = request.args.get('new_handle')
    if not new_handle:
        return jsonify({"error": "Missing new_handle query parameter"}), 400
    
    try:
        stats = fetch_gfg_data(new_handle)
        response = supabase.table("users").update({
            "handle": new_handle, 
            "score": stats["score"], 
            "tier": stats["tier"]
        }).eq("handle", old_handle).execute()
        
        if not response.data:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"message": "Handle updated", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/leaderboard", methods=['GET'])
def get_leaderboard():
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    try:
        response = supabase.table("users") \
            .select("*") \
            .order("score", desc=True) \
            .limit(10) \
            .execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/rank/<handle>", methods=['GET'])
def get_my_rank(handle):
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    try:
        user_res = supabase.table("users").select("score").eq("handle", handle).execute()
        if not user_res.data:
            return jsonify({"error": "User not found"}), 404
        
        user_score = user_res.data[0]["score"]
        rank_res = supabase.table("users").select("count", count="exact").gt("score", user_score).execute()
        rank = (rank_res.count or 0) + 1
        
        user_tier = "🥉 Bronze"
        if user_score >= 500: user_tier = "💎 Diamond"
        elif user_score >= 200: user_tier = "🥇 Gold"
        elif user_score >= 50:  user_tier = "🥈 Silver"

        return jsonify({
            "handle": handle,
            "score": user_score,
            "rank": rank,
            "tier": user_tier
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<handle>", methods=['DELETE'])
def delete_user(handle):
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    try:
        supabase.table("users").delete().eq("handle", handle).execute()
        return jsonify({"message": f"User {handle} removed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
