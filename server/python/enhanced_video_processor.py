#!/usr/bin/env python3
"""
Enhanced Video Processor - Multiple automated methods for video transcription
Combines transcript extraction with enhanced yt-dlp methods
"""

import sys
import json
import subprocess
import tempfile
import os
import time
from youtube_transcript_service import get_youtube_transcript, extract_video_id

def run_command(command, timeout=120):
    """Run a command with timeout and error handling"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Command timed out",
            "timeout": True
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def extract_with_enhanced_ytdlp(video_url, temp_dir):
    """
    Enhanced yt-dlp extraction with IP rotation and multiple bypass methods
    """
    
    # Free proxy list for IP rotation
    proxies = [
        None,  # No proxy first
        "socks5://127.0.0.1:9050",  # Tor if available
        "http://proxy.example.com:8080",  # Placeholder for user-provided proxies
    ]
    
    # Enhanced commands with IP rotation
    commands = []
    
    for i, proxy in enumerate(proxies):
        proxy_arg = f'--proxy "{proxy}"' if proxy else ''
        
        # Method 1: Basic extraction with rotating user agents
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
        user_agent = user_agents[i % len(user_agents)]
        
        commands.extend([
            f'yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors {proxy_arg} --user-agent "{user_agent}" --output "{temp_dir}/%(title)s.%(ext)s" "{video_url}"',
            
            # Method 2: Android client emulation with proxy
            f'yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors {proxy_arg} --extractor-args "youtube:player_client=android" --output "{temp_dir}/%(title)s.%(ext)s" "{video_url}"',
            
            # Method 3: iOS client emulation with proxy
            f'yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors {proxy_arg} --extractor-args "youtube:player_client=ios" --output "{temp_dir}/%(title)s.%(ext)s" "{video_url}"',
            
            # Method 4: Web client with proxy and rate limiting
            f'yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors {proxy_arg} --sleep-interval 3 --max-sleep-interval 7 --retries 2 --output "{temp_dir}/%(title)s.%(ext)s" "{video_url}"'
        ])
    
    for i, command in enumerate(commands, 1):
        print(f"Trying yt-dlp method {i}/4...", file=sys.stderr)
        result = run_command(command, timeout=180)
        
        if result["success"]:
            # Check if audio file was created
            for file in os.listdir(temp_dir):
                if file.endswith('.mp3'):
                    return {
                        "success": True,
                        "audio_file": os.path.join(temp_dir, file),
                        "method": f"yt-dlp_method_{i}"
                    }
        
        # Add delay between attempts
        if i < len(commands):
            time.sleep(3)
    
    return {
        "success": False,
        "error": "All yt-dlp methods failed"
    }

def process_video_url(video_url):
    """
    Main video processing function with multiple automated methods
    """
    result = {
        "url": video_url,
        "transcript": None,
        "method": None,
        "error": None,
        "duration": 0,
        "language": "en"
    }
    
    # Step 1: Try YouTube transcript API first (fastest)
    if "youtube.com" in video_url or "youtu.be" in video_url:
        print("Trying YouTube transcript API...", file=sys.stderr)
        transcript_result = get_youtube_transcript(video_url)
        
        if transcript_result.get("transcript"):
            result.update({
                "transcript": transcript_result["transcript"],
                "method": transcript_result["method"],
                "duration": transcript_result.get("duration", 0),
                "language": transcript_result.get("language", "en"),
                "segments": transcript_result.get("segments", 0)
            })
            return result
        else:
            print(f"Transcript API failed: {transcript_result.get('error', 'Unknown error')}", file=sys.stderr)
    
    # Step 2: Try audio extraction and transcription with Whisper
    print("Trying audio extraction with yt-dlp...", file=sys.stderr)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        extraction_result = extract_with_enhanced_ytdlp(video_url, temp_dir)
        
        if extraction_result["success"]:
            audio_file = extraction_result["audio_file"]
            
            # Here we would normally call Whisper, but since we're in Python
            # and the main app uses Node.js Whisper service, we return the audio path
            # for the Node.js service to handle
            result.update({
                "audio_extracted": True,
                "audio_path": audio_file,
                "method": extraction_result["method"],
                "requires_whisper": True
            })
            return result
        else:
            result.update({
                "error": f"Audio extraction failed: {extraction_result.get('error', 'Unknown error')}",
                "method": "audio_extraction_failed"
            })
    
    return result

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python enhanced_video_processor.py <video_url>"}))
        sys.exit(1)
    
    video_url = sys.argv[1]
    result = process_video_url(video_url)
    print(json.dumps(result))

if __name__ == "__main__":
    main()