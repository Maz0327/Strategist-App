#!/usr/bin/env python3
"""
Universal Whisper Video Transcription
Uses Whisper for ALL video platforms: YouTube, TikTok, Instagram, LinkedIn, etc.
"""

import sys
import json
import subprocess
import tempfile
import os
import time
from urllib.parse import urlparse

def log_status(message):
    """Print status messages to stderr"""
    print(message, file=sys.stderr, flush=True)

def detect_video_platform(url):
    """Detect video platform from URL"""
    url_lower = url.lower()
    
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'youtube'
    elif 'tiktok.com' in url_lower:
        return 'tiktok'
    elif 'instagram.com' in url_lower:
        return 'instagram'
    elif 'linkedin.com' in url_lower and ('/video/' in url_lower or '/posts/' in url_lower):
        return 'linkedin'
    elif 'twitter.com' in url_lower or 'x.com' in url_lower:
        return 'twitter'
    elif 'vimeo.com' in url_lower:
        return 'vimeo'
    elif 'dailymotion.com' in url_lower:
        return 'dailymotion'
    elif 'twitch.tv' in url_lower:
        return 'twitch'
    else:
        return 'generic'

def extract_audio_with_ytdlp(url, platform):
    """Extract audio using yt-dlp with platform-specific settings"""
    try:
        log_status(f"Extracting audio from {platform} video...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_file = os.path.join(temp_dir, 'audio.wav')
            
            # Base yt-dlp command
            cmd = [
                'yt-dlp',
                '--extract-audio',
                '--audio-format', 'wav',
                '--audio-quality', '0',
                '--output', audio_file,
                '--no-playlist',
                '--no-warnings',
                '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
            
            # Platform-specific options
            if platform == 'youtube':
                # YouTube often blocks, but try anyway
                cmd.extend(['--extractor-args', 'youtube:player_client=android'])
            elif platform == 'instagram':
                # Instagram requires specific headers
                cmd.extend(['--add-header', 'User-Agent:Instagram 276.0.0.27.98 Android'])
            elif platform == 'tiktok':
                # TikTok specific settings
                cmd.extend(['--extractor-args', 'tiktok:webpage_download=true'])
            
            cmd.append(url)
            
            log_status(f"Running yt-dlp for {platform}...")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            
            if result.returncode == 0 and os.path.exists(audio_file):
                log_status("Audio extracted successfully, transcribing with Whisper...")
                return transcribe_with_whisper(audio_file, platform)
            else:
                log_status(f"yt-dlp failed for {platform}: {result.stderr}")
                return None
                
    except subprocess.TimeoutExpired:
        log_status("Audio extraction timeout")
        return None
    except Exception as e:
        log_status(f"Audio extraction error: {str(e)}")
        return None

def transcribe_with_whisper(audio_file, platform):
    """Transcribe audio file using Whisper"""
    try:
        # Try OpenAI Whisper first
        try:
            log_status("Using OpenAI Whisper for transcription...")
            import openai
            
            # Use environment variable for API key
            client = openai.OpenAI()
            
            with open(audio_file, 'rb') as audio:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio,
                    response_format="text"
                )
                
            return {
                'transcript': transcript,
                'method': 'openai_whisper',
                'platform': platform,
                'language': 'auto-detected'
            }
            
        except Exception as openai_error:
            log_status(f"OpenAI Whisper failed: {str(openai_error)}")
            
            # Fallback to local Whisper
            try:
                log_status("Trying local Whisper model...")
                import whisper
                
                model = whisper.load_model("base")
                result = model.transcribe(audio_file)
                
                return {
                    'transcript': result['text'].strip(),
                    'method': 'local_whisper',
                    'platform': platform,
                    'language': result.get('language', 'unknown'),
                    'confidence': result.get('avg_logprob', 0)
                }
                
            except ImportError:
                log_status("Local Whisper not available")
                
                # Final fallback to speech_recognition
                try:
                    log_status("Using speech_recognition as fallback...")
                    import speech_recognition as sr
                    
                    r = sr.Recognizer()
                    with sr.AudioFile(audio_file) as source:
                        r.adjust_for_ambient_noise(source, duration=0.5)
                        audio = r.record(source)
                        
                    text = r.recognize_google(audio)
                    
                    return {
                        'transcript': text,
                        'method': 'speech_recognition',
                        'platform': platform,
                        'language': 'en'
                    }
                    
                except Exception as sr_error:
                    log_status(f"Speech recognition failed: {str(sr_error)}")
                    return None
                    
    except Exception as e:
        log_status(f"Transcription error: {str(e)}")
        return None

def transcribe_video_universal(url):
    """Universal video transcription for any platform"""
    
    platform = detect_video_platform(url)
    log_status(f"Detected platform: {platform}")
    
    # Try audio extraction and Whisper transcription
    transcription_result = extract_audio_with_ytdlp(url, platform)
    
    if transcription_result and transcription_result.get('transcript'):
        return transcription_result
    
    # If transcription fails, return informative error
    return {
        'transcript': None,
        'error': f'Video transcription failed for {platform}',
        'method': 'failed',
        'platform': platform,
        'reason': 'Could not extract audio or transcribe content',
        'solutions': [
            'Video may be audio-only without speech',
            'Platform may be blocking automated access',
            'Video might be too long or corrupted',
            'Try manually accessing the video for analysis'
        ]
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 universal_whisper_transcription.py <video_url>'}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = transcribe_video_universal(url)
    print(json.dumps(result))