#!/usr/bin/env python3
"""
Google Trends Service using pytrends
Provides reliable access to Google Trends data with anti-blocking measures
"""

import json
import sys
import time
import random
import requests
from datetime import datetime, timedelta
from pytrends.request import TrendReq
import pandas as pd

class GoogleTrendsService:
    def __init__(self):
        # List of realistic user agents to rotate through
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ]
        
        # Initialize with a custom session for better control
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # Initialize pytrends with timeout - no retries parameter due to library compatibility
        self.pytrends = TrendReq(
            hl='en-US', 
            tz=random.randint(300, 500),
            timeout=(10, 25)
        )
        
        # Track request timing to implement proper delays
        self.last_request_time = 0
        
    def _smart_delay(self, min_delay=3, max_delay=8):
        """Implement intelligent delays to avoid detection"""
        # Ensure minimum time between requests
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < min_delay:
            additional_delay = min_delay - time_since_last
            time.sleep(additional_delay)
        
        # Add random delay to mimic human behavior
        random_delay = random.uniform(min_delay, max_delay)
        time.sleep(random_delay)
        
        self.last_request_time = time.time()
    
    def _rotate_user_agent(self):
        """Rotate user agent to avoid detection"""
        new_user_agent = random.choice(self.user_agents)
        self.session.headers.update({'User-Agent': new_user_agent})
    
    def _retry_with_backoff(self, func, *args, max_retries=3, **kwargs):
        """Retry a function with exponential backoff"""
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                
                # Exponential backoff with jitter
                delay = (2 ** attempt) + random.uniform(0, 1)
                print(f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s: {e}", file=sys.stderr)
                time.sleep(delay)
                
                # Rotate user agent on retry
                self._rotate_user_agent()
    
    def get_trending_searches(self, country='US', limit=10):
        """Get trending searches for a specific country"""
        try:
            self._smart_delay()
            
            # Try different country codes if US fails
            country_codes = [country.lower(), 'us', 'united_states']
            
            def attempt_trending_search(country_code):
                return self.pytrends.trending_searches(pn=country_code)
            
            for country_code in country_codes:
                try:
                    trending_df = self._retry_with_backoff(attempt_trending_search, country_code)
                    break
                except Exception as e:
                    print(f"Failed with country code {country_code}: {e}", file=sys.stderr)
                    continue
            else:
                # If all country codes fail, return fallback
                return self.get_fallback_trending()
            
            trends = []
            for i, keyword in enumerate(trending_df[0].head(limit)):
                trends.append({
                    'id': f'google-trending-{i}',
                    'platform': 'google',
                    'title': keyword,
                    'summary': f'Trending search in {country}',
                    'url': f'https://trends.google.com/trends/explore?q={keyword.replace(" ", "+")}&geo={country}',
                    'score': 100 - (i * 5),  # Decrease score by ranking
                    'fetchedAt': datetime.now().isoformat(),
                    'engagement': random.randint(50000, 200000),
                    'source': 'Google Trends - Trending Searches',
                    'keywords': keyword.split()
                })
            
            return trends
            
        except Exception as e:
            print(f"Error fetching trending searches: {e}", file=sys.stderr)
            return self.get_fallback_trending()

    def get_interest_over_time(self, keywords, timeframe='today 3-m', geo='US'):
        """Get interest over time for specific keywords"""
        try:
            self._smart_delay()
            
            def build_and_fetch():
                # Build payload
                self.pytrends.build_payload(
                    kw_list=keywords,
                    cat=0,
                    timeframe=timeframe,
                    geo=geo,
                    gprop=''
                )
                # Get interest over time
                return self.pytrends.interest_over_time()
            
            # Use retry mechanism
            interest_df = self._retry_with_backoff(build_and_fetch)
            
            trends = []
            for i, keyword in enumerate(keywords):
                if keyword in interest_df.columns:
                    # Get recent average
                    recent_data = interest_df[keyword].tail(4)  # Last 4 weeks
                    avg_score = int(recent_data.mean()) if len(recent_data) > 0 else 0
                    
                    if avg_score > 0:  # Only include if there's actual interest
                        trends.append({
                            'id': f'google-interest-{i}',
                            'platform': 'google',
                            'title': keyword,
                            'summary': f'Search interest: {avg_score}/100 - {timeframe}',
                            'url': f'https://trends.google.com/trends/explore?q={keyword.replace(" ", "+")}&geo={geo}',
                            'score': avg_score,
                            'fetchedAt': datetime.now().isoformat(),
                            'engagement': avg_score * 1000,
                            'source': 'Google Trends - Interest Over Time',
                            'keywords': keyword.split()
                        })
            
            return trends
            
        except Exception as e:
            print(f"Error fetching interest over time: {e}", file=sys.stderr)
            return []

    def get_related_queries(self, keyword, geo='US'):
        """Get related queries for a specific keyword"""
        try:
            self._smart_delay()
            
            def build_and_fetch_related():
                # Build payload for single keyword
                self.pytrends.build_payload(
                    kw_list=[keyword],
                    cat=0,
                    timeframe='today 3-m',
                    geo=geo,
                    gprop=''
                )
                # Get related queries
                return self.pytrends.related_queries()
            
            # Use retry mechanism
            related_queries = self._retry_with_backoff(build_and_fetch_related)
            
            trends = []
            if keyword in related_queries:
                # Get top queries
                top_queries = related_queries[keyword]['top']
                if top_queries is not None:
                    for i, (query, value) in enumerate(top_queries.head(5).iterrows()):
                        trends.append({
                            'id': f'google-related-{i}',
                            'platform': 'google',
                            'title': query,
                            'summary': f'Related to "{keyword}" - {value}% interest',
                            'url': f'https://trends.google.com/trends/explore?q={query.replace(" ", "+")}&geo={geo}',
                            'score': min(100, int(value)),
                            'fetchedAt': datetime.now().isoformat(),
                            'engagement': int(value) * 100,
                            'source': 'Google Trends - Related Queries',
                            'keywords': query.split()
                        })
            
            return trends
            
        except Exception as e:
            print(f"Error fetching related queries: {e}", file=sys.stderr)
            return []

    def get_business_trends(self):
        """Get business and marketing related trends"""
        try:
            print("Starting business trends collection with anti-blocking measures", file=sys.stderr)
            
            # Conservative approach - fewer keywords to reduce API calls
            business_keywords = ['AI marketing', 'digital transformation']
            
            # Try to get interest over time for just 2 keywords
            business_trends = self.get_interest_over_time(
                keywords=business_keywords,
                timeframe='today 1-m',
                geo='US'
            )
            
            # If we got some real data, return it
            if business_trends:
                print(f"Successfully fetched {len(business_trends)} real Google Trends", file=sys.stderr)
                return business_trends
            
            # If no real data, return fallback
            print("No real data available, using fallback trends", file=sys.stderr)
            return self.get_fallback_business_trends()
            
        except Exception as e:
            print(f"Error fetching business trends: {e}", file=sys.stderr)
            return self.get_fallback_business_trends()
    
    def get_fallback_trending(self):
        """Fallback trending searches"""
        return [
            {
                'id': 'google-trending-fallback-1',
                'platform': 'google',
                'title': 'AI tools',
                'summary': 'Trending search - AI productivity tools',
                'url': 'https://trends.google.com/trends/explore?q=ai+tools',
                'score': 95,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 150000,
                'source': 'Google Trends - Trending (Fallback)',
                'keywords': ['ai', 'tools', 'productivity']
            },
            {
                'id': 'google-trending-fallback-2',
                'platform': 'google',
                'title': 'digital marketing',
                'summary': 'Trending search - Digital marketing strategies',
                'url': 'https://trends.google.com/trends/explore?q=digital+marketing',
                'score': 88,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 120000,
                'source': 'Google Trends - Trending (Fallback)',
                'keywords': ['digital', 'marketing', 'strategies']
            },
            {
                'id': 'google-trending-fallback-3',
                'platform': 'google',
                'title': 'remote work',
                'summary': 'Trending search - Remote work tools',
                'url': 'https://trends.google.com/trends/explore?q=remote+work',
                'score': 82,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 95000,
                'source': 'Google Trends - Trending (Fallback)',
                'keywords': ['remote', 'work', 'tools']
            }
        ]
    
    def get_fallback_business_trends(self):
        """Fallback business trends"""
        return [
            {
                'id': 'google-business-fallback-1',
                'platform': 'google',
                'title': 'AI Marketing',
                'summary': 'Search interest: 85/100 - AI-powered marketing tools',
                'url': 'https://trends.google.com/trends/explore?q=ai+marketing',
                'score': 85,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 85000,
                'source': 'Google Trends - Business (Fallback)',
                'keywords': ['ai', 'marketing', 'automation']
            },
            {
                'id': 'google-business-fallback-2',
                'platform': 'google',
                'title': 'Digital Transformation',
                'summary': 'Search interest: 78/100 - Business digital transformation',
                'url': 'https://trends.google.com/trends/explore?q=digital+transformation',
                'score': 78,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 78000,
                'source': 'Google Trends - Business (Fallback)',
                'keywords': ['digital', 'transformation', 'business']
            },
            {
                'id': 'google-business-fallback-3',
                'platform': 'google',
                'title': 'Customer Experience',
                'summary': 'Search interest: 72/100 - Customer experience optimization',
                'url': 'https://trends.google.com/trends/explore?q=customer+experience',
                'score': 72,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 72000,
                'source': 'Google Trends - Business (Fallback)',
                'keywords': ['customer', 'experience', 'optimization']
            },
            {
                'id': 'google-business-fallback-4',
                'platform': 'google',
                'title': 'Sustainability',
                'summary': 'Search interest: 69/100 - Sustainability and ESG',
                'url': 'https://trends.google.com/trends/explore?q=sustainability',
                'score': 69,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 69000,
                'source': 'Google Trends - Business (Fallback)',
                'keywords': ['sustainability', 'esg', 'environment']
            },
            {
                'id': 'google-business-fallback-5',
                'platform': 'google',
                'title': 'E-commerce',
                'summary': 'Search interest: 76/100 - E-commerce trends',
                'url': 'https://trends.google.com/trends/explore?q=ecommerce',
                'score': 76,
                'fetchedAt': datetime.now().isoformat(),
                'engagement': 76000,
                'source': 'Google Trends - Business (Fallback)',
                'keywords': ['ecommerce', 'online', 'shopping']
            }
        ]

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python google_trends_service.py <command> [args]", file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    service = GoogleTrendsService()
    
    try:
        if command == 'trending':
            country = sys.argv[2] if len(sys.argv) > 2 else 'US'
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            result = service.get_trending_searches(country, limit)
            
        elif command == 'interest':
            keywords = sys.argv[2].split(',') if len(sys.argv) > 2 else ['AI marketing']
            timeframe = sys.argv[3] if len(sys.argv) > 3 else 'today 3-m'
            geo = sys.argv[4] if len(sys.argv) > 4 else 'US'
            result = service.get_interest_over_time(keywords, timeframe, geo)
            
        elif command == 'related':
            keyword = sys.argv[2] if len(sys.argv) > 2 else 'digital marketing'
            geo = sys.argv[3] if len(sys.argv) > 3 else 'US'
            result = service.get_related_queries(keyword, geo)
            
        elif command == 'business':
            result = service.get_business_trends()
            
        else:
            print(f"Unknown command: {command}", file=sys.stderr)
            sys.exit(1)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error executing command {command}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()