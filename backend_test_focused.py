#!/usr/bin/env python3
"""
EXE-Tradebot2 Backend API Testing - Focus on Review Request Requirements
Tests the specific endpoints mentioned in the features_or_bugs_to_test
"""
import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional, List

# Backend URL from frontend environment
BASE_URL = "https://crypto-bot-exe.preview.emergentagent.com/api"

class TradebotAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests: List[Dict] = []
        self.session = requests.Session()
        print(f"🚀 EXE-Tradebot2 API Tester")
        print(f"Testing against: {BASE_URL}")
        print("=" * 70)

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
            if details:
                print(f"   → {details}")
        else:
            self.failed_tests.append({
                'test': test_name,
                'details': details,
                'response': response_data
            })
            print(f"❌ {test_name}")
            print(f"   → {details}")
        
        if response_data and isinstance(response_data, dict) and len(str(response_data)) < 300:
            print(f"   → Response: {json.dumps(response_data)}")
        print()

    def test_endpoint(self, endpoint: str, method: str = "GET", expected_status: int = 200, 
                     data: Optional[Dict] = None, test_name: Optional[str] = None) -> tuple[bool, Any]:
        """Test an API endpoint"""
        if not test_name:
            test_name = f"{method} /{endpoint}"
        
        url = f"{BASE_URL}/{endpoint}" if not endpoint.startswith('/') else f"{BASE_URL}{endpoint}"
        
        try:
            if method == "GET":
                response = self.session.get(url, timeout=15)
            elif method == "POST":
                response = self.session.post(url, json=data, timeout=15)
            elif method == "PUT":
                response = self.session.put(url, json=data, timeout=15)
            else:
                self.log_result(test_name, False, f"Unsupported method: {method}")
                return False, None

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}

            if not success:
                details = f"Expected {expected_status}, got {response.status_code}"
                if response_data and isinstance(response_data, dict) and 'detail' in response_data:
                    details += f" - {response_data['detail']}"
                self.log_result(test_name, False, details, response_data)
            else:
                self.log_result(test_name, True, "API endpoint responding correctly", response_data)

            return success, response_data

        except requests.exceptions.RequestException as e:
            self.log_result(test_name, False, f"Network error: {str(e)}")
            return False, None

    def test_health_endpoint(self):
        """Test /api/health returns valid status"""
        success, data = self.test_endpoint("health", test_name="Health Check API")
        if success and data:
            # Verify health response structure
            if isinstance(data, dict):
                required_fields = ["status"]
                has_fields = all(field in data for field in required_fields)
                if has_fields:
                    status = data.get("status", "")
                    details = f"Status: {status}"
                    if "discord_connected" in data:
                        details += f", Discord: {data['discord_connected']}"
                    if "broker_connected" in data:
                        details += f", Broker: {data['broker_connected']}"
                    self.log_result("Health Response Structure", True, details)
                else:
                    self.log_result("Health Response Structure", False, 
                                  f"Missing required fields. Got: {list(data.keys())}")
            else:
                self.log_result("Health Response Structure", False, 
                              f"Expected dict, got {type(data)}")
        return success

    def test_status_endpoint(self):
        """Test /api/status returns bot status"""
        success, data = self.test_endpoint("status", test_name="Bot Status API")
        if success and data:
            if isinstance(data, dict):
                expected_fields = ["discord_connected", "broker_connected", "active_broker", "auto_trading_enabled"]
                missing_fields = [f for f in expected_fields if f not in data]
                if not missing_fields:
                    details = f"Auto Trading: {data.get('auto_trading_enabled', 'N/A')}, Broker: {data.get('active_broker', 'N/A')}"
                    self.log_result("Status Response Structure", True, details)
                else:
                    self.log_result("Status Response Structure", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Status Response Structure", False, 
                              f"Expected dict, got {type(data)}")
        return success

    def test_portfolio_endpoint(self):
        """Test /api/portfolio returns all required fields"""
        success, data = self.test_endpoint("portfolio", test_name="Portfolio API")
        if success and data:
            # Check for required portfolio fields as mentioned in bug fixes
            required_fields = ["open_positions", "closed_positions", "losing_trades", 
                             "best_trade", "worst_trade", "average_pnl"]
            
            if isinstance(data, dict):
                missing_fields = [f for f in required_fields if f not in data]
                if not missing_fields:
                    details = f"Open: {data.get('open_positions', 0)}, Closed: {data.get('closed_positions', 0)}"
                    details += f", Avg PnL: {data.get('average_pnl', 0)}"
                    self.log_result("Portfolio Required Fields", True, details)
                else:
                    self.log_result("Portfolio Required Fields", False, 
                                  f"Missing required fields: {missing_fields}")
                    # Also check what fields are actually present
                    present_fields = list(data.keys())
                    self.log_result("Portfolio Available Fields", True, 
                                  f"Available: {present_fields}")
            else:
                self.log_result("Portfolio Required Fields", False, 
                              f"Expected dict, got {type(data)}")
        return success

    def test_brokers_endpoint(self):
        """Test /api/brokers returns list of brokers"""
        success, data = self.test_endpoint("brokers", test_name="Brokers List API")
        if success and data:
            if isinstance(data, list):
                details = f"Found {len(data)} brokers"
                if data:
                    broker_names = [b.get('name', b.get('id', 'Unknown')) for b in data if isinstance(b, dict)]
                    if broker_names:
                        details += f": {', '.join(broker_names[:3])}"
                self.log_result("Brokers Response Structure", True, details)
            else:
                self.log_result("Brokers Response Structure", False, 
                              f"Expected list, got {type(data)}")
        return success

    def test_reset_loss_counters(self):
        """Test /api/reset-loss-counters works without admin key when ADMIN_API_KEY not set"""
        success, data = self.test_endpoint("reset-loss-counters", method="POST", 
                                         test_name="Reset Loss Counters API")
        if success and data:
            if isinstance(data, dict) and "message" in data:
                self.log_result("Reset Loss Counters Response", True, data.get("message", ""))
            else:
                self.log_result("Reset Loss Counters Response", False, 
                              "No message field in response")
        return success

    def test_toggle_trading(self):
        """Test /api/toggle-trading works"""
        success, data = self.test_endpoint("toggle-trading", method="POST", 
                                         test_name="Toggle Trading API")
        if success and data:
            if isinstance(data, dict) and "auto_trading_enabled" in data:
                current_state = data["auto_trading_enabled"]
                self.log_result("Toggle Trading Response", True, 
                              f"Auto trading now: {current_state}")
                
                # Test toggling it back
                success2, data2 = self.test_endpoint("toggle-trading", method="POST", 
                                                   test_name="Toggle Trading Back")
                if success2 and data2 and isinstance(data2, dict):
                    new_state = data2.get("auto_trading_enabled")
                    if new_state != current_state:
                        self.log_result("Toggle Trading Functionality", True, 
                                      f"Successfully toggled: {current_state} → {new_state}")
                    else:
                        self.log_result("Toggle Trading Functionality", False, 
                                      "State didn't change on second toggle")
                        
            else:
                self.log_result("Toggle Trading Response", False, 
                              "Missing auto_trading_enabled field")
        return success

    def test_auto_shutdown_settings(self):
        """Test /api/auto-shutdown-settings returns settings"""
        success, data = self.test_endpoint("auto-shutdown-settings", 
                                         test_name="Auto Shutdown Settings API")
        if success and data:
            if isinstance(data, dict):
                expected_fields = ["auto_shutdown_enabled", "max_consecutive_losses", 
                                 "max_daily_losses", "max_daily_loss_amount"]
                missing_fields = [f for f in expected_fields if f not in data]
                if not missing_fields:
                    enabled = data.get("auto_shutdown_enabled", False)
                    max_consec = data.get("max_consecutive_losses", 0)
                    details = f"Enabled: {enabled}, Max consecutive losses: {max_consec}"
                    self.log_result("Auto Shutdown Settings Structure", True, details)
                else:
                    self.log_result("Auto Shutdown Settings Structure", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Auto Shutdown Settings Structure", False, 
                              f"Expected dict, got {type(data)}")
        return success

    def test_additional_endpoints(self):
        """Test additional endpoints for completeness"""
        print("\n📋 ADDITIONAL ENDPOINT TESTS")
        
        endpoints = [
            ("alerts", "Alerts List"),
            ("trades", "Trades List"), 
            ("positions", "Positions List"),
            ("settings", "Settings"),
        ]
        
        for endpoint, name in endpoints:
            self.test_endpoint(endpoint, test_name=name)

    def run_core_tests(self):
        """Run the core tests specified in the review request"""
        print("\n📋 CORE API TESTS (from review request)")
        
        self.test_health_endpoint()
        self.test_status_endpoint()  
        self.test_portfolio_endpoint()
        self.test_brokers_endpoint()
        self.test_reset_loss_counters()
        self.test_toggle_trading()
        self.test_auto_shutdown_settings()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        
        if self.tests_run > 0:
            success_rate = (self.tests_passed / self.tests_run) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for i, failed in enumerate(self.failed_tests, 1):
                print(f"{i}. {failed['test']}")
                print(f"   → {failed['details']}")
        else:
            print(f"\n🎉 All tests passed!")
        
        return len(self.failed_tests) == 0

def main():
    """Run all backend API tests"""
    tester = TradebotAPITester()
    
    try:
        # Run core tests as specified in review request
        tester.run_core_tests()
        
        # Run additional endpoint tests
        tester.test_additional_endpoints()
        
        # Print summary
        all_passed = tester.print_summary()
        
        return 0 if all_passed else 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())