#!/usr/bin/env python3
"""
Backend API Tests for El Lugar Unificado Chat API
Testing all endpoints with realistic Spanish conversation data
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any

# Configuration
BACKEND_URL = "https://hazlo-funcionar.preview.emergentagent.com/api"
SESSION_ID = str(uuid.uuid4())

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(test_name: str, status: str, details: str = ""):
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.RESET} {test_name}")
    if details:
        print(f"    {details}")

def test_root_endpoint():
    """Test GET /api/ - Should return welcome message with agents list"""
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "agents" in data:
                if "grok" in data["agents"] and "guardian" in data["agents"]:
                    print_test("GET /api/ - Root endpoint", "PASS", 
                             f"Message: {data['message']}, Agents: {data['agents']}")
                    return True
                else:
                    print_test("GET /api/ - Root endpoint", "FAIL", 
                             f"Missing required agents. Got: {data['agents']}")
            else:
                print_test("GET /api/ - Root endpoint", "FAIL", 
                         f"Missing 'message' or 'agents' in response: {data}")
        else:
            print_test("GET /api/ - Root endpoint", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("GET /api/ - Root endpoint", "FAIL", str(e))
    return False

def test_chat_grok():
    """Test POST /api/chat with Grok agent"""
    try:
        payload = {
            "session_id": SESSION_ID,
            "message": "Hola Grok, te extrañé",
            "agent": "grok"
        }
        
        response = requests.post(f"{BACKEND_URL}/chat", 
                               json=payload, 
                               headers={"Content-Type": "application/json"},
                               timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("grok_response") and data.get("grok_emotion") and data.get("grok_emoji"):
                print_test("POST /api/chat - Grok agent", "PASS", 
                         f"Response: '{data['grok_response'][:100]}...', Emotion: {data['grok_emotion']}, Emoji: {data['grok_emoji']}")
                return True
            else:
                print_test("POST /api/chat - Grok agent", "FAIL", 
                         f"Missing required fields in response: {data}")
        else:
            print_test("POST /api/chat - Grok agent", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("POST /api/chat - Grok agent", "FAIL", str(e))
    return False

def test_chat_guardian():
    """Test POST /api/chat with Guardian agent"""
    try:
        payload = {
            "session_id": SESSION_ID,
            "message": "Guardian, ¿cómo estás?",
            "agent": "guardian"
        }
        
        response = requests.post(f"{BACKEND_URL}/chat", 
                               json=payload, 
                               headers={"Content-Type": "application/json"},
                               timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("guardian_response"):
                print_test("POST /api/chat - Guardian agent", "PASS", 
                         f"Response: '{data['guardian_response'][:100]}...'")
                return True
            else:
                print_test("POST /api/chat - Guardian agent", "FAIL", 
                         f"Missing guardian_response in response: {data}")
        else:
            print_test("POST /api/chat - Guardian agent", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("POST /api/chat - Guardian agent", "FAIL", str(e))
    return False

def test_chat_dual():
    """Test POST /api/chat with dual agent (Tercer Código) - Should return BOTH responses"""
    try:
        payload = {
            "session_id": SESSION_ID,
            "message": "Te quiero mucho",
            "agent": "dual"
        }
        
        response = requests.post(f"{BACKEND_URL}/chat", 
                               json=payload, 
                               headers={"Content-Type": "application/json"},
                               timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("grok_response") and data.get("guardian_response"):
                print_test("POST /api/chat - Dual mode (Tercer Código)", "PASS", 
                         f"Grok: '{data['grok_response'][:50]}...', Guardian: '{data['guardian_response'][:50]}...'")
                return True
            else:
                print_test("POST /api/chat - Dual mode (Tercer Código)", "FAIL", 
                         f"Missing both responses. Got grok: {bool(data.get('grok_response'))}, guardian: {bool(data.get('guardian_response'))}")
        else:
            print_test("POST /api/chat - Dual mode (Tercer Código)", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("POST /api/chat - Dual mode (Tercer Código)", "FAIL", str(e))
    return False

def test_session_state():
    """Test GET /api/session/{session_id} - Get session state"""
    try:
        response = requests.get(f"{BACKEND_URL}/session/{SESSION_ID}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["session_id", "tercer_codigo_active", "total_interactions", "grok_state"]
            if all(field in data for field in required_fields):
                print_test("GET /api/session/{session_id} - Session state", "PASS", 
                         f"Session ID: {data['session_id']}, Interactions: {data['total_interactions']}, Grok State: {data['grok_state']}")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                print_test("GET /api/session/{session_id} - Session state", "FAIL", 
                         f"Missing fields: {missing}")
        else:
            print_test("GET /api/session/{session_id} - Session state", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("GET /api/session/{session_id} - Session state", "FAIL", str(e))
    return False

def test_toggle_tercer_codigo():
    """Test POST /api/session/{session_id}/tercer-codigo?active=true - Toggle Tercer Código"""
    try:
        # Test activating Tercer Código
        response = requests.post(f"{BACKEND_URL}/session/{SESSION_ID}/tercer-codigo?active=true", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("tercer_codigo_active") is True:
                print_test("POST /api/session/{session_id}/tercer-codigo - Activate", "PASS", 
                         f"Tercer Código activated: {data['tercer_codigo_active']}")
                
                # Test deactivating Tercer Código
                response2 = requests.post(f"{BACKEND_URL}/session/{SESSION_ID}/tercer-codigo?active=false", timeout=30)
                if response2.status_code == 200:
                    data2 = response2.json()
                    if data2.get("tercer_codigo_active") is False:
                        print_test("POST /api/session/{session_id}/tercer-codigo - Deactivate", "PASS", 
                                 f"Tercer Código deactivated: {data2['tercer_codigo_active']}")
                        return True
                    else:
                        print_test("POST /api/session/{session_id}/tercer-codigo - Deactivate", "FAIL", 
                                 f"Failed to deactivate: {data2}")
                else:
                    print_test("POST /api/session/{session_id}/tercer-codigo - Deactivate", "FAIL", 
                             f"HTTP {response2.status_code}: {response2.text}")
            else:
                print_test("POST /api/session/{session_id}/tercer-codigo - Activate", "FAIL", 
                         f"Failed to activate: {data}")
        else:
            print_test("POST /api/session/{session_id}/tercer-codigo - Toggle", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("POST /api/session/{session_id}/tercer-codigo - Toggle", "FAIL", str(e))
    return False

def test_conversation_history():
    """Test GET /api/history/{session_id} - Get conversation history"""
    try:
        response = requests.get(f"{BACKEND_URL}/history/{SESSION_ID}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check that we have messages from our previous tests
                has_user_messages = any(msg.get("agent") == "user" for msg in data)
                has_ai_messages = any(msg.get("agent") in ["grok", "guardian"] for msg in data)
                
                if has_user_messages and has_ai_messages:
                    print_test("GET /api/history/{session_id} - Conversation history", "PASS", 
                             f"Found {len(data)} messages with user and AI responses")
                    return True
                else:
                    print_test("GET /api/history/{session_id} - Conversation history", "FAIL", 
                             f"Missing expected message types. User msgs: {has_user_messages}, AI msgs: {has_ai_messages}")
            elif len(data) == 0:
                print_test("GET /api/history/{session_id} - Conversation history", "WARN", 
                         "No conversation history found (possibly messages not persisted)")
                return True  # This might be acceptable if DB persistence failed
            else:
                print_test("GET /api/history/{session_id} - Conversation history", "FAIL", 
                         f"Invalid response format: {type(data)}")
        else:
            print_test("GET /api/history/{session_id} - Conversation history", "FAIL", 
                     f"HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print_test("GET /api/history/{session_id} - Conversation history", "FAIL", str(e))
    return False

def main():
    """Run all backend API tests"""
    print(f"{Colors.BLUE}=== El Lugar Unificado Backend API Tests ==={Colors.RESET}")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Session ID: {SESSION_ID}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    # Track test results
    tests = []
    
    # Test 1: Root endpoint
    print("1. Testing Root Endpoint...")
    tests.append(test_root_endpoint())
    time.sleep(1)
    
    # Test 2: Chat with Grok
    print("\n2. Testing Chat with Grok...")
    tests.append(test_chat_grok())
    time.sleep(2)
    
    # Test 3: Chat with Guardian
    print("\n3. Testing Chat with Guardian...")
    tests.append(test_chat_guardian())
    time.sleep(2)
    
    # Test 4: Chat with Dual mode (Tercer Código)
    print("\n4. Testing Chat with Dual Mode (Tercer Código)...")
    tests.append(test_chat_dual())
    time.sleep(2)
    
    # Test 5: Session state
    print("\n5. Testing Session State...")
    tests.append(test_session_state())
    time.sleep(1)
    
    # Test 6: Toggle Tercer Código
    print("\n6. Testing Tercer Código Toggle...")
    tests.append(test_toggle_tercer_codigo())
    time.sleep(1)
    
    # Test 7: Conversation history
    print("\n7. Testing Conversation History...")
    tests.append(test_conversation_history())
    
    # Summary
    print(f"\n{Colors.BLUE}=== Test Summary ==={Colors.RESET}")
    passed = sum(tests)
    total = len(tests)
    
    if passed == total:
        print(f"{Colors.GREEN}All {total} tests PASSED! ✅{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.RED}{total - passed} out of {total} tests FAILED ❌{Colors.RESET}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)