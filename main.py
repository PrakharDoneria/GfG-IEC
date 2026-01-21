from flask import Flask, render_template, jsonify, request
import json
import os
import sys
import subprocess
import atexit

app = Flask(__name__, static_folder='static', template_folder='templates')

# Helper to load JSON data
def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

# Routes
@app.route('/')
def home():
    courses = load_json('data/courses.json')[:3]  # Show only 3 on home
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

# API Endpoints for AJAX
@app.route('/api/events/<event_type>')
def get_events(event_type):
    data = load_json(f'data/events/{event_type}.json')
    return jsonify(data)

if __name__ == '__main__':
    # --- Local Development Proxy ---
    # This block allows running locally without CORS issues.
    # It proxies all /api requests from Flask (port 5000) to FastAPI (port 8001).
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def proxy_api(path):
        # Only run this proxy if we are definitely local
        if not os.environ.get('VERCEL') and not os.environ.get('WERKZEUG_RUN_MAIN'):
             # Note: simple proxy logic for local dev
             import requests
             url = f"http://127.0.0.1:8001/api/{path}"
             try:
                resp = requests.request(
                    method=request.method,
                    url=url,
                    headers={key: value for (key, value) in request.headers if key != 'Host'},
                    data=request.get_data(),
                    cookies=request.cookies,
                    allow_redirects=False)
                excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
                headers = [(name, value) for (name, value) in resp.raw.headers.items()
                           if name.lower() not in excluded_headers]
                return (resp.content, resp.status_code, headers)
             except Exception as e:
                 return jsonify({'error': 'Local API Server (8001) not running or reachable', 'details': str(e)}), 500
        return jsonify({'error': 'Not Found'}), 404

    if not os.environ.get('WERKZEUG_RUN_MAIN'):
        # Just print instructions for the user locally
        print("----------------------------------------------------------")
        print(" IMPORTANT: Start the API server separately in a new terminal:")
        print(" python api_server.py")
        print("----------------------------------------------------------")


    app.run(debug=True, port=5000)
