from flask import Flask, render_template, jsonify, request, abort
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# --- Configuration & Setup ---
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__, static_folder='static', template_folder='templates')

# Cache Setup
import time
RESPONSE_CACHE_TTL = 3600 # 1 hour for static content
JSON_CACHE = {}            # Global in-memory cache for JSON files

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

# --- Page Routes ---

@app.after_request
def add_header(response):
    """Add caching headers to static content and safe GET requests"""
    if request.method == 'GET' and (request.path.startswith('/static') or request.endpoint in ['home', 'courses_page', 'events_page', 'deals_page', 'team_page', 'partners_page', 'sponsors_page']):
        response.cache_control.public = True
        response.cache_control.max_age = RESPONSE_CACHE_TTL
    return response

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
    
    return render_template('index.html', 
                           courses=courses, 
                           events=events,
                           ongoing=ongoing,
                           deals=deals, 
                           team=team,
                           events_count=total_events)

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

@app.route('/partners')
def partners_page():
    partners = load_json('data/partners.json')
    return render_template('partners.html', partners=partners)

@app.route('/sponsors')
def sponsors_page():
    sponsors = load_json('data/sponsors.json')
    return render_template('sponsors.html', sponsors=sponsors)

@app.route('/secret-id-gen')
def id_generator():
    return render_template('id_generator.html')

@app.route('/student-id')
def student_id_page():
    return render_template('student_id.html')

# --- API Routes ---

@app.route('/api/events/<event_type>')
def get_events(event_type):
    data = load_json(f'data/events/{event_type}.json')
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
