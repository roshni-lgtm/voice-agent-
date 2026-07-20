#!/usr/bin/env python3
"""
Backend API Test Suite for AI Calling Platform
Tests the fixed outbound call integration using ElevenLabs native API
"""

import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://callsync-ai.emergent.host')
API_BASE = f"{BASE_URL}/api"

print(f"\n{'='*80}")
print(f"AI Calling Platform - Backend API Tests")
print(f"Testing URL: {API_BASE}")
print(f"Timestamp: {datetime.now().isoformat()}")
print(f"{'='*80}\n")

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def log_test(test_name, passed, message=""):
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if message:
        print(f"   {message}")
    
    test_results.append({
        "test": test_name,
        "passed": passed,
        "message": message
    })
    
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1

# ============================================
# TEST 1: Health Check
# ============================================
print("\n" + "="*80)
print("TEST 1: Health Check")
print("="*80)

try:
    response = requests.get(f"{API_BASE}/", timeout=10)
    if response.status_code == 200:
        data = response.json()
        log_test("Health Check", True, f"API is healthy: {data.get('message', 'N/A')}")
    else:
        log_test("Health Check", False, f"Status code: {response.status_code}")
except Exception as e:
    log_test("Health Check", False, f"Error: {str(e)}")

# ============================================
# TEST 2: Verify Removed Routes Return 404
# ============================================
print("\n" + "="*80)
print("TEST 2: Verify Removed Routes Return 404")
print("="*80)

removed_routes = [
    "/twilio/voice/outgoing-answer",
    "/twilio/voice/gather-response"
]

for route in removed_routes:
    try:
        response = requests.post(f"{API_BASE}{route}", json={}, timeout=10)
        if response.status_code == 404:
            log_test(f"Removed route {route}", True, "Returns 404 as expected")
        else:
            log_test(f"Removed route {route}", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        log_test(f"Removed route {route}", False, f"Error: {str(e)}")

# ============================================
# TEST 3: Input Validation - Missing Phone Number
# ============================================
print("\n" + "="*80)
print("TEST 3: Input Validation - Missing Phone Number")
print("="*80)

try:
    response = requests.post(
        f"{API_BASE}/twilio/voice/outgoing",
        json={},
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    # Check if response is JSON
    content_type = response.headers.get('Content-Type', '')
    is_json = 'application/json' in content_type
    
    if response.status_code == 400 and is_json:
        data = response.json()
        if 'error' in data and 'phone number' in data['error'].lower():
            log_test("Missing phone number validation", True, f"Returns 400 with error: {data['error']}")
        else:
            log_test("Missing phone number validation", False, f"Error message not as expected: {data}")
    else:
        log_test("Missing phone number validation", False, 
                f"Expected 400 JSON response, got {response.status_code}, Content-Type: {content_type}")
except Exception as e:
    log_test("Missing phone number validation", False, f"Error: {str(e)}")

# ============================================
# TEST 4: Input Validation - Invalid E.164 Format
# ============================================
print("\n" + "="*80)
print("TEST 4: Input Validation - Invalid E.164 Format")
print("="*80)

try:
    response = requests.post(
        f"{API_BASE}/twilio/voice/outgoing",
        json={"to": "1234567890"},  # Missing '+' prefix
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    content_type = response.headers.get('Content-Type', '')
    is_json = 'application/json' in content_type
    
    if response.status_code == 400 and is_json:
        data = response.json()
        if 'error' in data and 'e.164' in data['error'].lower():
            log_test("E.164 format validation", True, f"Returns 400 with E.164 error: {data['error']}")
        else:
            log_test("E.164 format validation", False, f"Error message doesn't mention E.164: {data}")
    else:
        log_test("E.164 format validation", False, 
                f"Expected 400 JSON response, got {response.status_code}, Content-Type: {content_type}")
except Exception as e:
    log_test("E.164 format validation", False, f"Error: {str(e)}")

# ============================================
# TEST 5: Configuration Check - Missing API Keys
# ============================================
print("\n" + "="*80)
print("TEST 5: Configuration Check - API Key Validation")
print("="*80)

# Note: Since we're testing with potentially invalid API keys,
# we expect either a 500 error (missing config) or an API error from ElevenLabs

try:
    response = requests.post(
        f"{API_BASE}/twilio/voice/outgoing",
        json={"to": "+14155552671"},  # Valid E.164 format
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    content_type = response.headers.get('Content-Type', '')
    is_json = 'application/json' in content_type
    
    if not is_json:
        log_test("Configuration check response format", False, 
                f"Response is not JSON. Content-Type: {content_type}")
    else:
        data = response.json()
        
        # Check if it's a configuration error (500) or API error
        if response.status_code == 500:
            if 'error' in data:
                error_msg = data['error'].lower()
                if 'elevenlabs' in error_msg and ('not configured' in error_msg or 'missing' in error_msg):
                    log_test("Configuration error handling", True, 
                            f"Returns 500 with config error: {data['error']}")
                else:
                    log_test("Configuration error handling", True, 
                            f"Returns 500 error: {data['error']}")
            else:
                log_test("Configuration error handling", False, 
                        f"500 response but no error field: {data}")
        
        # Check if it's a successful call or ElevenLabs API error
        elif response.status_code in [200, 201]:
            if 'success' in data or 'callSid' in data:
                log_test("Outbound call API integration", True, 
                        f"Call initiated successfully: {json.dumps(data, indent=2)}")
                
                # Verify response structure
                required_fields = ['success', 'message', 'callSid', 'conversationId', 'callId']
                missing_fields = [f for f in required_fields if f not in data]
                
                if not missing_fields:
                    log_test("Response structure validation", True, 
                            "All required fields present in response")
                else:
                    log_test("Response structure validation", False, 
                            f"Missing fields: {missing_fields}")
            else:
                log_test("Outbound call API integration", False, 
                        f"Unexpected success response structure: {data}")
        
        # ElevenLabs API error
        elif response.status_code in [400, 401, 403]:
            log_test("ElevenLabs API error handling", True, 
                    f"API returned {response.status_code}: {data.get('error', 'Unknown error')}")
        
        else:
            log_test("Outbound call endpoint", False, 
                    f"Unexpected status code {response.status_code}: {data}")

except Exception as e:
    log_test("Outbound call endpoint", False, f"Error: {str(e)}")

# ============================================
# TEST 6: Database Integration Check
# ============================================
print("\n" + "="*80)
print("TEST 6: Database Integration - Call Records")
print("="*80)

try:
    # Try to fetch recent calls to verify database integration
    response = requests.get(
        f"{API_BASE}/calls?limit=5",
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if 'calls' in data:
            calls = data['calls']
            log_test("Database integration - Fetch calls", True, 
                    f"Successfully fetched {len(calls)} call records")
            
            # Check if any calls have isAI flag
            ai_calls = [c for c in calls if c.get('isAI') == True]
            if ai_calls:
                log_test("Database integration - AI call records", True, 
                        f"Found {len(ai_calls)} AI call records")
                
                # Check structure of first AI call
                if ai_calls:
                    first_call = ai_calls[0]
                    expected_fields = ['id', 'callSid', 'direction', 'status', 'isAI', 'createdAt']
                    has_fields = all(field in first_call for field in expected_fields)
                    
                    if has_fields:
                        log_test("Database integration - Call record structure", True, 
                                "Call records have expected fields")
                    else:
                        missing = [f for f in expected_fields if f not in first_call]
                        log_test("Database integration - Call record structure", False, 
                                f"Missing fields: {missing}")
            else:
                log_test("Database integration - AI call records", True, 
                        "No AI calls found yet (expected if no calls made)")
        else:
            log_test("Database integration - Fetch calls", False, 
                    f"Response missing 'calls' field: {data}")
    else:
        log_test("Database integration - Fetch calls", False, 
                f"Status code: {response.status_code}")
except Exception as e:
    log_test("Database integration - Fetch calls", False, f"Error: {str(e)}")

# ============================================
# TEST 7: Error Response Format Validation
# ============================================
print("\n" + "="*80)
print("TEST 7: Error Response Format Validation")
print("="*80)

try:
    # Test that error responses are properly formatted JSON
    response = requests.post(
        f"{API_BASE}/twilio/voice/outgoing",
        json={"to": "invalid"},
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    content_type = response.headers.get('Content-Type', '')
    is_json = 'application/json' in content_type
    
    if is_json:
        data = response.json()
        has_error_field = 'error' in data
        has_status_field = 'status' in data
        has_timestamp = 'timestamp' in data
        
        if has_error_field and has_status_field:
            log_test("Error response format", True, 
                    f"Error responses have proper JSON structure with error and status fields")
        else:
            log_test("Error response format", False, 
                    f"Error response missing required fields. Has error: {has_error_field}, Has status: {has_status_field}")
    else:
        log_test("Error response format", False, 
                f"Error response is not JSON. Content-Type: {content_type}")
except Exception as e:
    log_test("Error response format", False, f"Error: {str(e)}")

# ============================================
# TEST SUMMARY
# ============================================
print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"Total Tests: {tests_passed + tests_failed}")
print(f"Passed: {tests_passed} ✅")
print(f"Failed: {tests_failed} ❌")
print(f"Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")
print("="*80)

# Print detailed results
print("\nDetailed Results:")
for result in test_results:
    status = "✅" if result['passed'] else "❌"
    print(f"{status} {result['test']}")
    if result['message']:
        print(f"   {result['message']}")

print("\n" + "="*80)
print("Testing Complete")
print("="*80 + "\n")

# Exit with appropriate code
exit(0 if tests_failed == 0 else 1)
