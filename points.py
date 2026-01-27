import requests
import os
from pathlib import Path
from dotenv import load_dotenv
from cache_manager import cached

# Points configuration
PRACTICE_POINTS = {"Hard": 8, "Medium": 4, "Easy": 2, "Basic": 1}

def calculate_tier(score: int):
    """Determines tier based on total score."""
    if score >= 500: 
        return "Diamond"
    elif score >= 200: 
        return "Gold"
    elif score >= 50:  
        return "Silver"
    return "Bronze"

@cached(ttl=21600)  # Cache for 6 hours - ULTRA-AGGRESSIVE for March 2026
def fetch_gfg_detailed_stats(handle: str):
    """
    Fetches detailed GFG stats using practice and community APIs.
    Returns a dictionary with breakdown of points.
    CACHED: Results cached for 6 hours (tripled from 2h) to minimize API calls.
    """
    # 1. Fetch Practice (Questions) Data
    practice_url = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/"
    try:
        practice_res = requests.post(practice_url, json={"handle": handle}, timeout=10).json()
    except Exception as e:
        print(f"Error fetching practice data: {e}")
        practice_res = {}
    
    # Check if handle is real - GFG returns "error" status or non-success for invalid handles
    if not practice_res or practice_res.get("status") != "success":
        # If practice API fails, it might be an invalid handle OR API is down.
        # But for validation, we'll treat it as invalid if it explicitly says so.
        if practice_res.get("status") == "error":
             raise ValueError(f"GFG Handle '{handle}' not found or is invalid.")
    
    # 2. Fetch Community (Posts) Data
    community_url = f"https://communityapi.geeksforgeeks.org/post/user/{handle}/"
    try:
        community_res = requests.get(community_url, params={"fetch_type": "posts", "page": 1}, timeout=10).json()
    except Exception as e:
        print(f"Error fetching community data: {e}")
        community_res = {}

    # Calculate Question Points (p_score)
    p_score = 0
    total_solved = 0
    if practice_res.get("status") == "success":
        res = practice_res.get("result", {})
        # Check if result is empty or handle mismatch which might happen
        if not res:
            # Some handles might exist but have 0 problems. That's fine.
            pass
        
        # Sum up points for each difficulty level
        for lvl, points in PRACTICE_POINTS.items():
            solved_count = len(res.get(lvl, {}))
            total_solved += solved_count
            p_score += solved_count * points
    else:
        # If status wasn't success, we already raised error above if it was an explicit error.
        # If it was just a silent failure, we assume 0 points.
        pass

    # Calculate Post Points (c_score)
    c_score = 0
    total_likes = 0
    total_posts = 0
    if community_res and "results" in community_res:
        total_posts = community_res.get("count", 0)
        total_likes = sum(p.get("like_count", 0) for p in community_res.get("results", []))
        # Points: 10 per post, 2 per like
        c_score = (total_posts * 10) + (total_likes * 2)

    total_gfg_score = p_score + c_score
    
    # Determine Tier
    tier = calculate_tier(total_gfg_score)

    return {
        "handle": handle,
        "question_points": p_score,
        "post_points": c_score,
        "total_gfg_score": total_gfg_score,
        "tier": tier,
        "total_posts": total_posts,
        "total_likes": total_likes,
        "total_solved": total_solved
    }
