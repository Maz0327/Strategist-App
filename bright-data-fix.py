#!/usr/bin/env python3
"""
Direct Bright Data test to diagnose connectivity issue
"""
import os
import requests
import json

def test_bright_data():
    print("🧪 DIRECT BRIGHT DATA CONNECTIVITY TEST")
    print("="*50)
    
    # Get credentials from environment
    username = os.environ.get('BRIGHT_DATA_USERNAME', '')
    password = os.environ.get('BRIGHT_DATA_PASSWORD', '')
    
    print(f"Username configured: {bool(username)}")
    print(f"Password configured: {bool(password)}")
    
    if not username or not password:
        print("❌ MISSING CREDENTIALS - This explains the connection failure")
        return
    
    # Test 1: Regular IP check
    try:
        regular_response = requests.get('https://httpbin.org/ip', timeout=10)
        server_ip = regular_response.json()['origin']
        print(f"Server IP: {server_ip}")
    except Exception as e:
        print(f"❌ Server IP check failed: {e}")
        return
    
    # Test 2: Bright Data proxy
    proxy_configs = [
        # Test different Bright Data endpoints
        ('brd.superproxy.io', 9515),
        ('brd.superproxy.io', 33335),
        ('brd.superproxy.io', 22225)
    ]
    
    for host, port in proxy_configs:
        print(f"\n🔄 Testing {host}:{port}...")
        
        proxies = {
            'http': f'http://{username}:{password}@{host}:{port}',
            'https': f'http://{username}:{password}@{host}:{port}'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        try:
            # Test basic connectivity
            response = requests.get('https://httpbin.org/ip', 
                                  proxies=proxies, 
                                  headers=headers, 
                                  timeout=15)
            
            residential_ip = response.json()['origin']
            print(f"✅ SUCCESS! Residential IP: {residential_ip}")
            
            if server_ip != residential_ip:
                print(f"🎯 IP ROTATION WORKING: {server_ip} → {residential_ip}")
                
                # Test YouTube access
                print("🎬 Testing YouTube access with residential IP...")
                try:
                    yt_response = requests.get('https://www.youtube.com', 
                                             proxies=proxies, 
                                             headers=headers, 
                                             timeout=15)
                    
                    blocked = ('bot' in yt_response.text.lower() or 
                             'captcha' in yt_response.text.lower() or
                             'sign in to confirm' in yt_response.text.lower())
                    
                    if blocked:
                        print("⚠️ YouTube still blocking (may need different headers)")
                    else:
                        print("✅ YouTube access successful with residential IP!")
                        
                except Exception as yt_error:
                    print(f"⚠️ YouTube test failed: {yt_error}")
                
                # Success - we found working configuration
                print(f"\n🏆 WORKING CONFIGURATION FOUND:")
                print(f"   Host: {host}")
                print(f"   Port: {port}")
                print(f"   Server IP: {server_ip}")
                print(f"   Residential IP: {residential_ip}")
                return
            else:
                print("⚠️ IP not changed - proxy may not be working")
                
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    print("\n💡 DIAGNOSIS:")
    print("- All Bright Data endpoints failed")
    print("- Network connectivity issue between server and Bright Data")
    print("- Contact Bright Data support about proxy accessibility")

if __name__ == '__main__':
    test_bright_data()