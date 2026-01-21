# GFG IEC Student Chapter Portal

The official web portal and tracking system for the **GeeksforGeeks Student Chapter** at **IEC College of Engineering & Technology**. This application serves as a central hub for student members to track their progress, view upcoming events, access courses, and see where they stand on the global leaderboard.

## 🚀 Features

*   **Global Leaderboard**: Real-time ranking of students based on their GFG problem-solving score and community engagement.
*   **Event Management**: Browse upcoming, ongoing, and past events organized by the chapter.
*   **User Tracking**: Sync your GFG handle to automatically calculate your score, rank, and tier (Diamond, Gold, Silver, Bronze).
*   **Resource Hub**: Access curated GFG courses and exclusive deals for members.
*   **Team Showcase**: Meet the core team behind the GFG IEC chapter.
*   **Dual-Server Architecture**: Seamless integration of a Flask frontend and a FastAPI backend for high-performance data handling.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3, JavaScript, Flask (Jinja2 Templates).
*   **Backend / API**: FastAPI, Uvicorn.
*   **Database**: Supabase (PostgreSQL).
*   **External APIs**: GeeksforGeeks Practice & Community APIs.
*   **Styling**: Custom CSS with Glassmorphism design aesthetics.

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

*   **Python 3.8+**
*   **pip** (Python package manager)
*   A **Supabase** project (for the leaderboard database).

## ⚙️ Installation

1.  **Clone the Repository**

    ```bash
    git clone <repository_url>
    cd gfg-iec-portal
    ```

2.  **Create a Virtual Environment (Optional but Recommended)**

    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Configuration**

    Create a `.env` file in the root directory and add your Supabase credentials:

    ```env
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

## 🏃‍♂️ Usage

To start the application, simply run the `main.py` script. This will automatically start the Flask web server (Frontend) and spawn the FastAPI backend server as a subprocess.

```bash
python main.py
```

*   **Web Interface**: [http://localhost:5000](http://localhost:5000)
*   **API Documentation**: [http://localhost:8001/docs](http://localhost:8001/docs)

## 📂 Project Structure

*   `main.py`: The entry point. Runs the Flask web application (port 5000) and manages the API subprocess.
*   `api_server.py`: The FastAPI application (port 8001) that handles logic for the leaderboard, user syncing, and GFG data fetching.
*   `templates/`: HTML templates for the website pages.
*   `static/`: CSS styles, JavaScript files, and images.
*   `data/`: JSON files for static content (Events, Team, Courses).

---

## 📡 API Documentation

The backend API runs locally on port `8001` and powers the leaderboard features.

### **1. Sync/Add User**

Fetches live data from GFG and saves or updates the user in the database.

*   **Endpoint**: `POST /user/{handle}`
*   **Example**: `POST /user/prakhardoneria`

**Response:**
```json
{
  "message": "User prakhardoneria synced",
  "data": [
    {
      "handle": "prakhardoneria",
      "score": 452,
      "tier": "🥈 Silver",
      "last_updated": "2026-01-20T15:30:00Z"
    }
  ]
}
```

### **2. Get Leaderboard**

Returns the top 10 users ranked by their total score.

*   **Endpoint**: `GET /leaderboard`

**Response:**
```json
[
  {
    "handle": "prakhardoneria",
    "score": 452,
    "tier": "🥈 Silver"
  },
  {
    "handle": "coder_007",
    "score": 120,
    "tier": "🥈 Silver"
  }
]
```

### **3. Get My Rank**

Calculates the specific rank of a handle relative to all other users.

*   **Endpoint**: `GET /rank/{handle}`
*   **Example**: `GET /rank/prakhardoneria`

**Response:**
```json
{
  "handle": "prakhardoneria",
  "score": 452,
  "rank": 1,
  "tier": "🥈 Silver"
}
```

### **4. Edit Username**

Renames a handle in the database while maintaining their historical record.

*   **Endpoint**: `PUT /user/{old_handle}?new_handle={new_handle}`

**Response:**
```json
{
  "message": "Handle updated",
  "data": [...]
}
```

### **5. Delete User**

Removes a user from the tracking system.

*   **Endpoint**: `DELETE /user/{handle}`

### **Tier System Breakdown**

Tiers are automatically assigned based on total calculated score:

*   **💎 Diamond**: 500+ Points
*   **🥇 Gold**: 200 - 499 Points
*   **🥈 Silver**: 50 - 199 Points
*   **🥉 Bronze**: 0 - 49 Points