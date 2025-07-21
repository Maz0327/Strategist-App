// Test script to retrieve Bright Data snapshot results
import axios from 'axios';

async function checkSnapshotStatus(snapshotId) {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ BRIGHT_DATA_API_KEY not found in environment');
    return;
  }

  try {
    console.log(`🔍 Checking status for snapshot: ${snapshotId}`);
    
    const response = await axios.get(`https://api.brightdata.com/dca/snapshot/${snapshotId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Snapshot Status:', response.data.status);
    console.log('⏱️  Started:', response.data.start_time);
    console.log('📈 Progress:', response.data.progress || 'N/A');
    
    if (response.data.status === 'success') {
      console.log('✅ Data collection completed!');
      console.log('📄 Results count:', response.data.results?.length || 'No results array');
      
      // Show first result as sample
      if (response.data.results?.[0]) {
        console.log('📝 Sample result:', JSON.stringify(response.data.results[0], null, 2));
      }
    } else if (response.data.status === 'running') {
      console.log('⏳ Still processing... Check again in 30 seconds');
    } else if (response.data.status === 'failed') {
      console.log('❌ Data collection failed:', response.data.error);
    }
    
    return response.data;
  } catch (error) {
    console.log('🚨 Error checking snapshot:', error.response?.data || error.message);
  }
}

// Check the snapshot you mentioned
checkSnapshotStatus('s_mddfeskv2jmswrl1wy');