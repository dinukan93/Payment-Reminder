"""
Safe Rate Limiting Test Script
Tests that your API rate limiting works correctly
"""

import requests
import time
from datetime import datetime

class RateLimitTester:
    def __init__(self, api_url):
        self.api_url = api_url
        self.results = []
    
    def test_rate_limit(self):
        """Test that rate limiting kicks in after 5 attempts"""
        print("=" * 60)
        print("RATE LIMITING TEST")
        print("=" * 60)
        print(f"Target: {self.api_url}")
        print(f"Expected: First 5 requests succeed, 6th gets rate limited")
        print("-" * 60)
        
        # Use a non-existent email to avoid locking real accounts
        test_payload = {
            "email": "test_rate_limit@example.com",
            "password": "wrong_password",
            "userType": "admin"
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
        
        # Try 7 requests quickly
        for i in range(1, 8):
            try:
                start_time = time.time()
                response = requests.post(
                    self.api_url,
                    json=test_payload,
                    headers=headers,
                    timeout=5
                )
                elapsed = time.time() - start_time
                
                timestamp = datetime.now().strftime("%H:%M:%S")
                
                result = {
                    'attempt': i,
                    'status_code': response.status_code,
                    'timestamp': timestamp,
                    'elapsed': f"{elapsed:.2f}s"
                }
                
                if response.status_code == 429:
                    print(f"[{timestamp}] Attempt {i}: ❌ RATE LIMITED (429) - Protection working!")
                    result['message'] = "Rate limited"
                    try:
                        data = response.json()
                        retry_after = data.get('retry_after', 'unknown')
                        print(f"           Retry after: {retry_after} seconds")
                        result['retry_after'] = retry_after
                    except:
                        pass
                elif response.status_code == 401:
                    print(f"[{timestamp}] Attempt {i}: ✓ Request allowed (401 - wrong password)")
                    result['message'] = "Request allowed"
                else:
                    print(f"[{timestamp}] Attempt {i}: Status {response.status_code}")
                    result['message'] = f"Status {response.status_code}"
                
                self.results.append(result)
                
                # Small delay between requests
                time.sleep(0.1)
                
            except requests.exceptions.RequestException as e:
                print(f"[ERROR] Attempt {i}: {e}")
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        allowed = sum(1 for r in self.results if r['status_code'] != 429)
        rate_limited = sum(1 for r in self.results if r['status_code'] == 429)
        
        print(f"Total requests: {len(self.results)}")
        print(f"Allowed: {allowed}")
        print(f"Rate limited: {rate_limited}")
        
        if rate_limited > 0:
            print("\n✅ RATE LIMITING IS WORKING!")
            print("   Your API is protected against brute force attacks.")
        else:
            print("\n⚠️  WARNING: No rate limiting detected!")
            print("   Your API may be vulnerable to brute force attacks.")
        
        return rate_limited > 0

if __name__ == "__main__":
    # Configuration
    API_URL = "http://localhost:8000/api/login"
    
    print("\n🔒 Testing Rate Limiting Protection")
    print("This is a SAFE test using fake credentials\n")
    
    tester = RateLimitTester(API_URL)
    
    # Run the test
    success = tester.test_rate_limit()
    
    if success:
        print("\n✅ Your API is protected!")
    else:
        print("\n❌ Rate limiting may not be configured correctly")
