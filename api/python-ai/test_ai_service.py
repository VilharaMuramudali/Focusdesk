#!/usr/bin/env python3
"""
Test script for the AI Recommendation Service
Tests all major functionality and endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
AI_SERVICE_URL = "http://localhost:5000"
TEST_USER_ID = "test_user_123"
TEST_PACKAGE_ID = "test_package_456"

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_algorithms():
    """Test algorithms endpoint"""
    print("\nTesting algorithms endpoint...")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/algorithms")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Algorithms retrieved: {len(data.get('algorithms', []))} algorithms")
            for algo in data.get('algorithms', []):
                print(f"  - {algo['name']}: {algo['description']}")
            return True
        else:
            print(f"❌ Algorithms failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Algorithms error: {e}")
        return False

def test_stats():
    """Test stats endpoint"""
    print("\nTesting stats endpoint...")
    try:
        response = requests.get(f"{AI_SERVICE_URL}/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Stats retrieved:")
            for key, value in data.items():
                if key != 'timestamp':
                    print(f"  - {key}: {value}")
            return True
        else:
            print(f"❌ Stats failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Stats error: {e}")
        return False

def test_recommendations():
    """Test recommendations endpoint"""
    print("\nTesting recommendations endpoint...")
    
    test_cases = [
        {
            "name": "Basic recommendation",
            "data": {
                "user_id": TEST_USER_ID,
                "query": "mathematics",
                "algorithm": "hybrid",
                "limit": 5
            }
        },
        {
            "name": "Content-based recommendation",
            "data": {
                "user_id": TEST_USER_ID,
                "query": "physics",
                "algorithm": "content",
                "limit": 3
            }
        },
        {
            "name": "Collaborative recommendation",
            "data": {
                "user_id": TEST_USER_ID,
                "query": "chemistry",
                "algorithm": "collaborative",
                "limit": 3
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        print(f"  Testing {test_case['name']}...")
        try:
            response = requests.post(
                f"{AI_SERVICE_URL}/recommendations",
                json=test_case['data'],
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    recommendations = data.get('recommendations', [])
                    print(f"    ✅ {len(recommendations)} recommendations received")
                    success_count += 1
                else:
                    print(f"    ❌ Request failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"    ❌ HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            print(f"    ❌ Error: {e}")
    
    return success_count == len(test_cases)

def test_interaction():
    """Test interaction recording"""
    print("\nTesting interaction recording...")
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/interaction",
            json={
                "user_id": TEST_USER_ID,
                "package_id": TEST_PACKAGE_ID,
                "interaction_type": "view"
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Interaction recorded successfully")
                return True
            else:
                print(f"❌ Interaction failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Interaction error: {e}")
        return False

def test_model_management():
    """Test model management endpoints"""
    print("\nTesting model management...")
    
    # Test load model
    print("  Testing load model...")
    try:
        response = requests.post(f"{AI_SERVICE_URL}/load")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("    ✅ Model loaded successfully")
            else:
                print(f"    ❌ Load failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"    ❌ HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"    ❌ Load error: {e}")
    
    # Test train model (this might take a while)
    print("  Testing train model...")
    try:
        response = requests.post(f"{AI_SERVICE_URL}/train")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("    ✅ Model training completed")
            else:
                print(f"    ❌ Training failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"    ❌ HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"    ❌ Training error: {e}")

def run_all_tests():
    """Run all tests"""
    print("=" * 50)
    print("AI Recommendation Service Test Suite")
    print("=" * 50)
    print(f"Testing service at: {AI_SERVICE_URL}")
    print(f"Timestamp: {datetime.now()}")
    print()
    
    tests = [
        ("Health Check", test_health_check),
        ("Algorithms", test_algorithms),
        ("Statistics", test_stats),
        ("Recommendations", test_recommendations),
        ("Interaction Recording", test_interaction),
        ("Model Management", test_model_management)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    print("=" * 50)
    
    if passed == total:
        print("🎉 All tests passed! AI service is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the service configuration.")
        return False

if __name__ == "__main__":
    # Check if service URL is provided as argument
    if len(sys.argv) > 1:
        AI_SERVICE_URL = sys.argv[1]
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
