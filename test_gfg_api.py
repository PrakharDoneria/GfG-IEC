import requests
import json

def check_gfg(handle):
    practice_url = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/"
    try:
        res = requests.post(practice_url, json={"handle": handle}, timeout=10)
        print(f"Handle: {handle}")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_gfg("non_existent_user_123456789")
    check_gfg("gfg") # A real one
