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

# Cache Setup
import time
RESPONSE_CACHE_TTL = 3600 # 1 hour for static content
MEMBER_COUNT_TTL = 3600   # 1 hour for DB count
JSON_CACHE = {}            # Global in-memory cache for JSON files
MEMBER_COUNT_CACHE = {"value": 0, "timestamp": 0}

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
    # Check cache first
    if filepath in JSON_CACHE:
        return JSON_CACHE[filepath]
        
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(base_dir, filepath)
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            JSON_CACHE[filepath] = data # Store in cache
            return data
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []

def fetch_gfg_data(handle: str):
    stats = points.fetch_gfg_detailed_stats(handle)
    return {
        "score": stats["total_gfg_score"],
        "tier": stats["tier"],
        "question_points": stats["question_points"],
        "post_points": stats["post_points"],
        "total_posts": stats.get("total_posts", 0),
        "total_solved": stats.get("total_solved", 0)
    }

# --- Site Stats Helpers ---

def get_member_count():
    """Fetches member count with in-memory caching"""
    global MEMBER_COUNT_CACHE
    current_time = time.time()
    
    # Return cached value if valid
    if current_time - MEMBER_COUNT_CACHE["timestamp"] < MEMBER_COUNT_TTL and MEMBER_COUNT_CACHE["value"] > 0:
        return MEMBER_COUNT_CACHE["value"]

    if not supabase: return 0
    
    count = 0
    try:
        # Try fetching from site_stats
        res = supabase.table("site_stats").select("value").eq("key", "member_count").execute()
        if res.data and len(res.data) > 0:
            count = res.data[0]["value"]
        else:
            # Fallback: Count from users table
            count_res = supabase.table("users").select("handle", count="exact").execute()
            count = count_res.count if count_res.count else 0
            
            # Initialize site_stats
            try:
                supabase.table("site_stats").upsert({"key": "member_count", "value": count}).execute()
            except: pass
            
        # Update cache
        MEMBER_COUNT_CACHE = {"value": count, "timestamp": current_time}
        return count
    except Exception as e:
        print(f"Error fetching member count: {e}")
        return MEMBER_COUNT_CACHE["value"] # Return stale value if error

def update_member_count(delta):
    """Increments or decrements member count"""
    global MEMBER_COUNT_CACHE
    if not supabase: return
    try:
        supabase.rpc("increment_stat", {"row_key": "member_count", "delta": delta}).execute()
        # Invalidate cache so next read fetches fresh
        MEMBER_COUNT_CACHE["timestamp"] = 0 
    except Exception as e:
        print(f"Stat update failed: {e}")
        # Manual fallback
        current = get_member_count() # This will use cache or fetch
        new_val = current + delta
        supabase.table("site_stats").upsert({"key": "member_count", "value": new_val}).execute()
        MEMBER_COUNT_CACHE = {"value": new_val, "timestamp": time.time()}

# --- Page Routes ---

@app.after_request
def add_header(response):
    """Add caching headers to static content and safe GET requests"""
    if request.method == 'GET' and (request.path.startswith('/static') or request.endpoint in ['home', 'courses_page', 'events_page', 'deals_page', 'team_page', 'partners_page', 'sponsors_page']):
        response.cache_control.public = True
        response.cache_control.max_age = RESPONSE_CACHE_TTL
    return response

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
    past_list = load_json('data/events/past.json') 
    
    total_events = len(events_list) + len(ongoing_list) + len(past_list)
    
    events = events_list[:2]
    ongoing = ongoing_list
    deals = load_json('data/deals.json')[:2]
    team = load_json('data/team.json')[:4]
    
    # Member Count (Cached)
    member_count = get_member_count()
            
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

@app.route('/partners')
def partners_page():
    partners = load_json('data/partners.json')
    return render_template('partners.html', partners=partners)

@app.route('/sponsors')
def sponsors_page():
    sponsors = load_json('data/sponsors.json')
    return render_template('sponsors.html', sponsors=sponsors)

@app.route('/profile')
def profile_page():
    return render_template('profile.html')

@app.route('/secret-id-gen')
def id_generator():
    return render_template('id_generator.html')

@app.route('/refer')
def refer_page():
    return render_template('refer.html')

@app.route('/student-id')
def student_id_page():
    return render_template('student_id.html')

@app.route('/geeksforgeeks')
def gfg_core_page():
    # Simple privacy check: require a passkey in query params or just keep it unlinked
    # For better privacy, we could use a fixed passkey
    passkey = request.args.get('key')
    if passkey != "iec_core_2026":
        return "Unauthorized Access. Please provide the correct key.", 403
        
    if not supabase:
        return "Database not connected", 500
        
    try:
        # Fetch all users with their full data
        response = supabase.table("users").select("*").order("score", desc=True).execute()
        return render_template('geeksforgeeks/index.html', students=response.data)
    except Exception as e:
        return f"Error: {str(e)}", 500

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
            "tier": points.calculate_tier(total_score),
            "posts": stats.get("total_posts", 0),
            "solved": stats.get("total_solved", 0)
        }
        
        # Check if user is new to increment member count
        user_exists = supabase.table("users").select("handle").eq("handle", handle).execute()
        is_new_user = len(user_exists.data) == 0
        
        response = supabase.table("users").upsert(data, on_conflict="handle").execute()
        
        if is_new_user and response.data:
            update_member_count(1)
            
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
            "tier": points.calculate_tier(total_score),
            "posts": stats.get("total_posts", 0),
            "solved": stats.get("total_solved", 0)
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
        # Get Total Score from DB (which already includes GFG + Referral points)
        user_res = supabase.table("users").select("score").eq("handle", handle).execute()
        if not user_res.data:
            return jsonify({"error": "User not found"}), 404
        
        total_score = user_res.data[0]["score"]
        
        # Calculate Rank based on total score
        rank_res = supabase.table("users").select("count", count="exact").gt("score", total_score).execute()
        rank = (rank_res.count or 0) + 1
        
        # Use helper for tier display (with emojis for UI)
        tier_name = points.calculate_tier(total_score)
        tier_emojis = {
            "Diamond": "💎 Diamond",
            "Gold": "🥇 Gold",
            "Silver": "🥈 Silver",
            "Bronze": "� Bronze"
        }
        user_tier = tier_emojis.get(tier_name, "� Bronze")

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
        # Check if user exists before deleting to know if we should decrement
        user_exists = supabase.table("users").select("handle").eq("handle", handle).execute()
        
        res = supabase.table("users").delete().eq("handle", handle).execute()
        
        if len(user_exists.data) > 0 and res.data:
            update_member_count(-1)
            
        return jsonify({"message": f"User {handle} removed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/sync-all", methods=['POST'])
def sync_all_users():
    passkey = request.args.get('key')
    if passkey != "iec_core_2026":
        return jsonify({"error": "Unauthorized"}), 403
        
    if not supabase: return jsonify({"error": "Database not connected"}), 500
    
    try:
        users_res = supabase.table("users").select("handle").execute()
        handles = [u['handle'] for u in users_res.data]
        
        synced_count = 0
        for handle in handles:
            try:
                stats = fetch_gfg_data(handle)
                # Get referral points
                ref_data = refer.get_user_points(handle)
                referral_points = ref_data.get('referral_points', 0) if ref_data else 0
                total_score = stats["score"] + referral_points
                
                supabase.table("users").update({
                    "score": total_score,
                    "tier": points.calculate_tier(total_score),
                    "posts": stats["total_posts"],
                    "solved": stats["total_solved"]
                }).eq("handle", handle).execute()
                synced_count += 1
            except:
                continue
                
        return jsonify({"message": f"Successfully synced {synced_count} users"})
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
            "gfg_score": gfg_stats["total_gfg_score"],
            "total_solved": gfg_stats.get("total_solved", 0),
            "total_posts": gfg_stats.get("total_posts", 0)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
