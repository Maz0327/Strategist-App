#!/usr/bin/env python3
"""
Bright Data YouTube Transcription
Uses Bright Data residential proxy to bypass YouTube IP blocking
"""

import sys
import json
import subprocess
import tempfile
import os
import requests
from urllib.parse import urlparse, parse_qs

def log_status(message):
    """Print status messages to stderr"""
    print(message, file=sys.stderr, flush=True)

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]
    elif 'youtube.com' in url:
        parsed = urlparse(url)
        return parse_qs(parsed.query).get('v', [None])[0]
    return None

def transcribe_with_bright_data_proxy(url):
    """Use Bright Data residential proxy for YouTube transcription"""
    try:
        log_status("Using Bright Data residential proxy for YouTube access...")
        
        # Bright Data proxy configuration
        proxy_endpoint = "brd-customer-hl_d2c6dd0f-zone-scraping_browser1"
        proxy_password = "wl58vcxlx0ph"
        proxy_url = f"http://{proxy_endpoint}:{proxy_password}@brd.superproxy.io:22225"
        
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        
        video_id = extract_video_id(url)
        if not video_id:
            return None
            
        # Try transcript API through Bright Data proxy
        log_status("Attempting transcript API through residential proxy...")
        
        # Use youtube_transcript_api with proxy
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            from youtube_transcript_api.formatters import TextFormatter
            
            # This will use system proxy settings
            os.environ['HTTP_PROXY'] = proxy_url
            os.environ['HTTPS_PROXY'] = proxy_url
            
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            if transcript_list:
                formatter = TextFormatter()
                full_text = formatter.format_transcript(transcript_list)
                
                return {
                    'transcript': full_text,
                    'method': 'bright_data_transcript_api',
                    'duration': max([entry['start'] + entry['duration'] for entry in transcript_list]) if transcript_list else 0,
                    'proxy': 'residential'
                }
                
        except Exception as transcript_error:
            log_status(f"Transcript API with proxy failed: {str(transcript_error)}")
            
        # Try yt-dlp with Bright Data proxy
        log_status("Attempting yt-dlp audio extraction through residential proxy...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_file = os.path.join(temp_dir, 'audio.wav')
            
            # Use yt-dlp with proxy
            cmd = [
                'yt-dlp',
                '--proxy', proxy_url,
                '--extract-audio',
                '--audio-format', 'wav',
                '--audio-quality', '0',
                '--output', audio_file,
                '--no-playlist',
                '--no-warnings',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0 and os.path.exists(audio_file):
                log_status("Audio extracted successfully, starting transcription...")
                
                # Transcribe with speech_recognition
                try:
                    import speech_recognition as sr
                    
                    r = sr.Recognizer()
                    with sr.AudioFile(audio_file) as source:
                        r.adjust_for_ambient_noise(source, duration=0.5)
                        audio = r.record(source)
                        
                    text = r.recognize_google(audio)
                    
                    return {
                        'transcript': text,
                        'method': 'bright_data_audio_transcription',
                        'language': 'en',
                        'proxy': 'residential'
                    }
                    
                except Exception as sr_error:
                    log_status(f"Speech recognition failed: {str(sr_error)}")
                    return None
                    
            else:
                log_status(f"yt-dlp with proxy failed: {result.stderr}")
                return None
                
    except Exception as e:
        log_status(f"Bright Data proxy transcription error: {str(e)}")
        return None
        
    return None

def transcribe_youtube_video(url):
    """Main transcription function with Bright Data proxy"""
    
    # Try Bright Data proxy transcription
    proxy_result = transcribe_with_bright_data_proxy(url)
    if proxy_result:
        return proxy_result
    
    # If all methods fail
    return {
        'transcript': None,
        'error': 'YouTube blocking prevented transcription - requires Bright Data residential proxy access',
        'method': 'blocked_by_youtube',
        'solution': 'This video requires residential IP access to bypass YouTube bot detection'
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 bright_data_youtube.py <youtube_url>'}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = transcribe_youtube_video(url)
    print(json.dumps(result))