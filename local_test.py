#!/usr/bin/env python3
"""
Test against localhost to bypass ingress
"""

import requests
import json

BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

print("\n" + "="*80)
print("LOCAL TEST 1: Removed Route Response")
print("="*80)

response = requests.post(f"{API_BASE}/twilio/voice/outgoing-answer", json={}, timeout=10)
print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Body:\n{response.text[:500]}")

print("\n" + "="*80)
print("LOCAL TEST 2: E.164 Validation Response")
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
print("LOCAL TEST 3: Valid E.164 Format")
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
