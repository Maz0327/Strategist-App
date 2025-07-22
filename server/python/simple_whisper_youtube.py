#!/usr/bin/env python3
"""
Simple Whisper YouTube Transcription
Uses yt-dlp + speech_recognition for reliable video transcription
"""

import sys
import json
import subprocess
import tempfile
import os
import time

def log_status(message):
    """Print status messages to stderr"""
    print(message, file=sys.stderr, flush=True)

def transcribe_youtube_video(url):
    """Main transcription function"""
    
    # Step 1: Try YouTube transcript API first (fastest)
    transcript_result = try_transcript_api(url)
    if transcript_result:
        return transcript_result
    
    # Step 2: Extract audio and transcribe
    audio_result = extract_and_transcribe_audio(url)
    if audio_result:
        return audio_result
    
    # Step 3: Return failure
    return {
        'transcript': None,
        'error': 'All transcription methods failed',
        'method': 'failed'
    }

def try_transcript_api(url):
    """Try YouTube transcript API"""
    try:
        log_status("Trying YouTube transcript API...")
        from youtube_transcript_api import YouTubeTranscriptApi
        from urllib.parse import urlparse, parse_qs
        
        # Extract video ID
        if 'youtu.be' in url:
            video_id = url.split('/')[-1].split('?')[0]
        elif 'youtube.com' in url:
            parsed = urlparse(url)
            video_id = parse_qs(parsed.query).get('v', [None])[0]
        else:
            return None
            
        if not video_id:
            return None
            
        # Get transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        if transcript_list:
            full_text = ' '.join([entry['text'] for entry in transcript_list])
            return {
                'transcript': full_text,
                'method': 'youtube_transcript_api',
                'duration': max([entry['start'] + entry['duration'] for entry in transcript_list]) if transcript_list else 0
            }
            
    except Exception as e:
        log_status(f"Transcript API failed: {str(e)}")
        
    return None

def extract_and_transcribe_audio(url):
    """Extract audio and transcribe with speech_recognition"""
    try:
        log_status("Extracting audio with yt-dlp...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_file = os.path.join(temp_dir, 'audio.wav')
            
            # Extract audio using yt-dlp with working options
            cmd = [
                'yt-dlp',
                '--extract-audio',
                '--audio-format', 'wav',
                '--audio-quality', '0',
                '--output', audio_file,
                '--no-playlist',
                '--no-warnings',
                url
            ]
            
            log_status("Running yt-dlp extraction...")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
            
            if result.returncode != 0:
                log_status(f"yt-dlp failed: {result.stderr}")
                return None
            
            if not os.path.exists(audio_file):
                log_status("Audio file not created")
                return None
                
            log_status("Audio extracted, starting transcription...")
            
            # Transcribe with speech_recognition
            try:
                import speech_recognition as sr
                
                r = sr.Recognizer()
                with sr.AudioFile(audio_file) as source:
                    # Adjust for ambient noise
                    r.adjust_for_ambient_noise(source, duration=0.5)
                    audio = r.record(source)
                    
                log_status("Using Google Speech Recognition...")
                text = r.recognize_google(audio)
                
                return {
                    'transcript': text,
                    'method': 'speech_recognition_google',
                    'language': 'en'
                }
                
            except Exception as sr_error:
                log_status(f"Speech recognition failed: {str(sr_error)}")
                
                # Try alternative transcription method
                try:
                    log_status("Trying Sphinx speech recognition...")
                    text = r.recognize_sphinx(audio)
                    return {
                        'transcript': text,
                        'method': 'speech_recognition_sphinx',
                        'language': 'en'
                    }
                except Exception as sphinx_error:
                    log_status(f"Sphinx also failed: {str(sphinx_error)}")
                    return None
                    
    except subprocess.TimeoutExpired:
        log_status("Audio extraction timeout")
        return None
    except Exception as e:
        log_status(f"Audio transcription error: {str(e)}")
        return None
        
    return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python3 simple_whisper_youtube.py <youtube_url>'}))
        sys.exit(1)
    
    url = sys.argv[1]
    result = transcribe_youtube_video(url)
    print(json.dumps(result))