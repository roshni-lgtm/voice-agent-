#!/usr/bin/env python3
"""
Debug test to see actual responses
"""

import requests
import json
import os

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://callsync-ai.emergent.host')
API_BASE = f"{BASE_URL}/api"

print("\n" + "="*80)
print("DEBUG TEST 1: Removed Route Response")
print("="*80)

response = requests.post(f"{API_BASE}/twilio/voice/outgoing-answer", json={}, timeout=10)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Body:\n{response.text[:500]}")

print("\n" + "="*80)
print("DEBUG TEST 2: E.164 Validation Response")
print("="*80)

response = requests.post(
    f"{API_BASE}/twilio/voice/outgoing",
    json={"to": "1234567890"},
    headers={"Content-Type": "application/json"},
    timeout=10
)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Body:\n{response.text}")

print("\n" + "="*80)
print("DEBUG TEST 3: E.164 Validation with 'invalid' string")
print("="*80)

response = requests.post(
    f"{API_BASE}/twilio/voice/outgoing",
    json={"to": "invalid"},
    headers={"Content-Type": "application/json"},
    timeout=10
)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Body:\n{response.text}")

print("\n" + "="*80)
print("DEBUG TEST 4: Valid E.164 Format")
print("="*80)

response = requests.post(
    f"{API_BASE}/twilio/voice/outgoing",
    json={"to": "+14155552671"},
    headers={"Content-Type": "application/json"},
    timeout=10
)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Body:\n{response.text}")
