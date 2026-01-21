import os
import requests
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client 
from typing import List, Optional

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="GFG Tracker API")

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all websites
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(f"Missing credentials. URL: {SUPABASE_URL}, KEY: {bool(SUPABASE_KEY)}")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PRACTICE_POINTS = {"Hard": 8, "Medium": 4, "Easy": 2, "Basic": 1}

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

@app.post("/user/{handle}")
async def add_user(handle: str):
    stats = fetch_gfg_data(handle)
    data = {
        "handle": handle,
        "score": stats["score"],
        "tier": stats["tier"]
    }
    response = supabase.table("users").upsert(data, on_conflict="handle").execute()
    return {"message": f"User {handle} synced", "data": response.data}

@app.put("/user/{old_handle}")
async def edit_user(old_handle: str, new_handle: str):
    stats = fetch_gfg_data(new_handle)
    response = supabase.table("users").update({
        "handle": new_handle, 
        "score": stats["score"], 
        "tier": stats["tier"]
    }).eq("handle", old_handle).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Handle updated", "data": response.data}

@app.get("/leaderboard")
async def get_leaderboard():
    response = supabase.table("users") \
        .select("*") \
        .order("score", desc=True) \
        .limit(10) \
        .execute()
    return response.data

@app.get("/rank/{handle}")
async def get_my_rank(handle: str):
    user_res = supabase.table("users").select("score").eq("handle", handle).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_score = user_res.data[0]["score"]
    rank_res = supabase.table("users").select("count", count="exact").gt("score", user_score).execute()
    rank = (rank_res.count or 0) + 1
    
    # Also return tier for UI
    user_tier = "🥉 Bronze"
    if user_score >= 500: user_tier = "💎 Diamond"
    elif user_score >= 200: user_tier = "🥇 Gold"
    elif user_score >= 50:  user_tier = "🥈 Silver"

    return {
        "handle": handle,
        "score": user_score,
        "rank": rank,
        "tier": user_tier
    }

@app.delete("/user/{handle}")
async def delete_user(handle: str):
    supabase.table("users").delete().eq("handle", handle).execute()
    return {"message": f"User {handle} removed"}

if __name__ == "__main__":
    import uvicorn
    print("API Server is starting on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
