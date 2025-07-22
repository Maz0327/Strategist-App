/**
 * Bright Data Demo Route - Show Real Value
 */

import { Router } from 'express';
import { debugLogger } from '../services/debug-logger';
import { spawn } from 'child_process';

export const brightDataDemoRouter = Router();

brightDataDemoRouter.post('/test-youtube-bypass', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return res.status(400).json({ 
        error: 'Please provide a YouTube URL to test Bright Data bypass capabilities' 
      });
    }

    debugLogger.info('Testing Bright Data YouTube bypass', { url });

    // Create Python script that demonstrates Bright Data's anti-detection
    const pythonScript = `
import requests
import json
import time

def test_youtube_with_bright_data():
    """
    Demonstrate Bright Data's residential IP bypass
    """
    
    # Bright Data proxy configuration
    proxies = {
        'http': 'http://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9515',
        'https': 'http://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9515'
    }
    
    # Real browser headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    # First test: Check our IP without proxy (server IP)
    try:
        ip_check = requests.get('https://httpbin.org/ip', timeout=10)
        server_ip = ip_check.json()['origin']
        print(f"SERVER IP: {server_ip}")
    except:
        server_ip = "Unable to detect"
    
    # Second test: Check IP with Bright Data (residential IP)
    try:
        bright_ip_check = requests.get('https://httpbin.org/ip', 
                                      proxies=proxies, 
                                      headers=headers, 
                                      timeout=15)
        residential_ip = bright_ip_check.json()['origin']
        print(f"RESIDENTIAL IP: {residential_ip}")
    except Exception as e:
        residential_ip = f"Bright Data error: {str(e)}"
    
    # Third test: Try accessing YouTube
    youtube_url = "${url}"
    
    try:
        # WITHOUT Bright Data (will likely be blocked)
        regular_response = requests.get(youtube_url, headers=headers, timeout=10)
        regular_status = regular_response.status_code
        regular_blocked = 'bot' in regular_response.text.lower() or 'captcha' in regular_response.text.lower()
        
        # WITH Bright Data residential IPs  
        bright_response = requests.get(youtube_url, 
                                     proxies=proxies, 
                                     headers=headers, 
                                     timeout=15)
        bright_status = bright_response.status_code
        bright_blocked = 'bot' in bright_response.text.lower() or 'captcha' in bright_response.text.lower()
        
        result = {
            'success': True,
            'server_ip': server_ip,
            'residential_ip': residential_ip,
            'regular_request': {
                'status': regular_status,
                'blocked': regular_blocked,
                'content_length': len(regular_response.text)
            },
            'bright_data_request': {
                'status': bright_status,
                'blocked': bright_blocked,
                'content_length': len(bright_response.text)
            },
            'value_demonstration': {
                'blocking_bypassed': not bright_blocked and regular_blocked,
                'ip_rotation_working': server_ip != residential_ip and 'error' not in residential_ip.lower(),
                'content_access_improved': bright_status == 200 and len(bright_response.text) > len(regular_response.text)
            }
        }
        
    except Exception as e:
        result = {
            'success': False,
            'error': str(e),
            'server_ip': server_ip,
            'residential_ip': residential_ip,
            'message': 'Failed to complete Bright Data demonstration'
        }
    
    return result

result = test_youtube_with_bright_data()
print(json.dumps(result, indent=2))
`;

    // Execute the test
    const testResult = await new Promise<any>((resolve, reject) => {
      const pythonProcess = spawn('python3', ['-c', pythonScript]);
      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          if (output.trim()) {
            // Extract JSON from output (ignore IP prints)
            const lines = output.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{'));
            if (jsonLine) {
              const parsed = JSON.parse(jsonLine);
              resolve(parsed);
            } else {
              resolve({ success: false, error: 'No JSON output found', raw: output });
            }
          } else {
            resolve({ success: false, error: 'No output from test', stderr: errorOutput });
          }
        } catch (parseError) {
          resolve({ success: false, error: 'Failed to parse result', raw: output });
        }
      });

      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Test timeout'));
      }, 30000);
    });

    debugLogger.info('Bright Data test completed', { result: testResult });

    res.json({
      success: true,
      url: url,
      brightDataTest: testResult,
      explanation: {
        purpose: "This test demonstrates why Bright Data is valuable for your platform",
        what_it_shows: [
          "IP rotation from server IPs to residential IPs",
          "Difference in platform blocking behavior", 
          "Content access improvement with residential IPs",
          "Real-world bypass capabilities for video platforms"
        ],
        why_it_matters: [
          "YouTube blocks server IPs but allows residential IPs",
          "Instagram requires real user traffic patterns",
          "TikTok detects and blocks automated server requests",
          "Bright Data makes requests appear as real home users"
        ]
      }
    });

  } catch (error: any) {
    debugLogger.error('Bright Data demo failed', { error: error.message });
    res.status(500).json({ 
      error: 'Bright Data test failed', 
      details: error.message 
    });
  }
});