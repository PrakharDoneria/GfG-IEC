from flask import Flask, render_template, jsonify, request, abort
import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import points
import refer

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
    stats = points.fetch_gfg_detailed_stats(handle)
    return {
        "score": stats["total_gfg_score"],
        "tier": stats["tier"],
        "question_points": stats["question_points"],
        "post_points": stats["post_points"]
    }

# --- Page Routes ---


def format_count(count):
    """Formats count to show ranges like 15+, 50+"""
    if count <= 0: return "0"
    if count < 15: return f"{count}" # Exact count for small numbers
    
    # Round down to nearest 5 or 10 or 50 based on size/preference
    if count < 50:
        base = (count // 5) * 5
        return f"{base}+"
    elif count < 100:
        base = (count // 10) * 10
        return f"{base}+"
    else:
        base = (count // 50) * 50
        return f"{base}+"

@app.route('/')
def home():
    courses = load_json('data/courses.json')[:3]
    
    # Event Counts
    events_list = load_json('data/events/upcoming.json')
    ongoing_list = load_json('data/events/ongoing.json')
    past_list = load_json('data/events/past.json') # Load past to get accurate total events
    
    total_events = len(events_list) + len(ongoing_list) + len(past_list)
    
    events = events_list[:2]
    ongoing = ongoing_list
    deals = load_json('data/deals.json')[:2]
    team = load_json('data/team.json')[:4]
    
    # Member Count
    member_count = 0
    if supabase:
        try:
            # We use count='exact' and head=True to avoid fetching data
            count_res = supabase.table("users").select("handle", count="exact").execute()
            member_count = count_res.count if count_res.count else 0
        except Exception as e:
            print(f"Error counting members: {e}")
            member_count = 500 # Fallback
            
    return render_template('index.html', 
                           courses=courses, 
                           events=events,
                           ongoing=ongoing,
                           deals=deals, 
                           team=team,
                           member_count=format_count(member_count),
                           events_count=format_count(total_events))

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

@app.route('/refer')
def refer_page():
    return render_template('refer.html')

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
        
        # Get referral points to add to total score
        ref_data = refer.get_user_points(handle)
        referral_points = ref_data.get('referral_points', 0) if ref_data else 0
        
        total_score = stats["score"] + referral_points
        
        data = {
            "handle": handle,
            "score": total_score,
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
        
        # Get referral points
        ref_data = refer.get_user_points(new_handle)
        referral_points = ref_data.get('referral_points', 0) if ref_data else 0
        
        total_score = stats["score"] + referral_points
        
        response = supabase.table("users").update({
            "handle": new_handle, 
            "score": total_score, 
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
        # Get GFG Score
        user_res = supabase.table("users").select("score").eq("handle", handle).execute()
        if not user_res.data:
            return jsonify({"error": "User not found"}), 404
        
        gfg_score = user_res.data[0]["score"]
        
        # Get Referral Points
        referral_points = 0
        try:
            ref_res = supabase.table("user_points").select("referral_points").eq("username", handle).execute()
            if ref_res.data:
                referral_points = ref_res.data[0].get('referral_points', 0)
        except:
            pass
            
        total_score = gfg_score + referral_points

        # Calculate Rank (based on GFG score for now as leaderboard is GFG based)
        # Ideally this should be based on total_score but requires DB schema change
        rank_res = supabase.table("users").select("count", count="exact").gt("score", gfg_score).execute()
        rank = (rank_res.count or 0) + 1
        
        user_tier = "🥉 Bronze"
        if total_score >= 500: user_tier = "💎 Diamond"
        elif total_score >= 200: user_tier = "🥇 Gold"
        elif total_score >= 50:  user_tier = "🥈 Silver"

        return jsonify({
            "handle": handle,
            "score": total_score, # Return TOTAL score for display
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

# --- Referral API Routes ---
import refer

@app.route("/api/referral/stats/<handle>", methods=['GET'])
def get_referral_stats(handle):
    """Get referral statistics for a user"""
    if not supabase:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        # Generate referral code if doesn't exist
        code_result = refer.create_referral_code(handle)
        
        if not code_result.get('success'):
            return jsonify({"success": False, "error": code_result.get('error')}), 500
        
        # Get full stats
        stats = refer.get_user_referral_stats(handle)
        
        if stats:
            return jsonify({
                "success": True,
                "referral_code": stats.get('referral_code'),
                "referral_count": stats.get('referral_count', 0),
                "referrals_made": stats.get('referrals_made', []),
                "was_referred_by": stats.get('was_referred_by')
            })
        else:
            return jsonify({"success": False, "error": "Could not fetch stats"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/referral/use", methods=['POST'])
def use_referral():
    """Apply a referral code"""
    if not supabase:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        data = request.get_json()
        username = data.get('username')
        code = data.get('code')
        
        if not username or not code:
            return jsonify({"success": False, "error": "Missing username or code"}), 400
        
        result = refer.use_referral_code(username, code)
        
        if result.get('success'):
            return jsonify({
                "success": True,
                "message": f"Referral applied! +5 points for you and {result.get('referrer')}"
            })
        else:
            return jsonify({"success": False, "error": result.get('error')}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/points/<handle>", methods=['GET'])
def get_points_breakdown(handle):
    """Get detailed points breakdown for a user"""
    if not supabase:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        # Get REAL-TIME GFG stats for questions and posts
        gfg_stats = points.fetch_gfg_detailed_stats(handle)
        
        # Get referral points from database
        ref_stats = refer.get_user_points(handle)
        referral_points = ref_stats.get('referral_points', 0) if ref_stats else 0
        
        # Calculate total points (Platform Points = GFG Score + Referral Points)
        total_platform_points = gfg_stats["total_gfg_score"] + referral_points
        
        return jsonify({
            "success": True,
            "total_points": total_platform_points,
            "referral_points": referral_points,
            "post_points": gfg_stats["post_points"],
            "question_points": gfg_stats["question_points"],
            "gfg_score": gfg_stats["total_gfg_score"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
