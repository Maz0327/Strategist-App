#!/usr/bin/env python3
"""
YouTube Transcript Service - Automated transcript extraction without API keys
Uses the unofficial youtube-transcript-api that doesn't require authentication
"""

import sys
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'(?:shorts\/)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_youtube_transcript(video_url, use_cookies=False):
    """
    Get transcript from YouTube video using multiple methods
    Works for both manual and auto-generated captions
    """
    try:
        video_id = extract_video_id(video_url)
        if not video_id:
            return {"error": "Could not extract video ID from URL", "transcript": None}
        
        # Method 1: Try with cookies if provided (bypasses IP blocks)
        if use_cookies:
            try:
                # This would require browser cookies to be passed
                transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                if transcript_list:
                    formatter = TextFormatter()
                    transcript_text = formatter.format_transcript(transcript_list)
                    total_duration = max([item['start'] + item['duration'] for item in transcript_list]) if transcript_list else 0
                    
                    return {
                        "transcript": transcript_text,
                        "duration": total_duration,
                        "language": transcript_list[0].get('language', 'en') if transcript_list else 'en',
                        "segments": len(transcript_list) if transcript_list else 0,
                        "method": "youtube_transcript_api_with_cookies",
                        "error": None
                    }
            except Exception as e:
                pass  # Fall through to other methods
        
        # Method 2: Try multiple languages without cookies
        languages = ['en', 'en-US', 'en-GB', 'auto']
        transcript_list = None
        
        for lang in languages:
            try:
                if lang == 'auto':
                    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
                else:
                    transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                break
            except Exception:
                continue
        
        if transcript_list:
            # Format transcript
            formatter = TextFormatter()
            transcript_text = formatter.format_transcript(transcript_list)
            
            # Calculate total duration
            total_duration = max([item['start'] + item['duration'] for item in transcript_list]) if transcript_list else 0
            
            return {
                "transcript": transcript_text,
                "duration": total_duration,
                "language": transcript_list[0].get('language', 'en') if transcript_list else 'en',
                "segments": len(transcript_list) if transcript_list else 0,
                "method": "youtube_transcript_api",
                "error": None
            }
        
        # Method 3: If all else fails, try to get any available transcript
        try:
            available_transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
            for transcript in available_transcripts:
                try:
                    transcript_list = transcript.fetch()
                    if transcript_list:
                        formatter = TextFormatter()
                        transcript_text = formatter.format_transcript(transcript_list)
                        total_duration = max([item['start'] + item['duration'] for item in transcript_list]) if transcript_list else 0
                        
                        return {
                            "transcript": transcript_text,
                            "duration": total_duration,
                            "language": transcript.language_code,
                            "segments": len(transcript_list),
                            "method": "youtube_transcript_api_fallback",
                            "error": None
                        }
                except Exception:
                    continue
        except Exception:
            pass
        
        return {"error": "No transcript available for this video", "transcript": None}
        
    except Exception as e:
        error_msg = str(e)
        # Check for specific error types
        if "blocked" in error_msg.lower() or "ip" in error_msg.lower():
            return {"error": "IP_BLOCKED", "transcript": None, "suggestion": "Try audio extraction method"}
        elif "not available" in error_msg.lower():
            return {"error": "NO_TRANSCRIPT", "transcript": None, "suggestion": "Video has no transcript available"}
        else:
            return {"error": f"Transcript extraction failed: {error_msg}", "transcript": None}

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python youtube_transcript_service.py <youtube_url>"}))
        sys.exit(1)
    
    video_url = sys.argv[1]
    result = get_youtube_transcript(video_url)
    print(json.dumps(result))

if __name__ == "__main__":
    main()