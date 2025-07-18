// Quick API test script for debugging

fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Auth status:', data))
  .catch(e => console.error('Auth error:', e));

// Test content for all endpoints
const testData = {
  content: 'This is a test article about digital marketing trends and how brands are adapting to Gen Z preferences.',
  title: 'Test Content',
  truthAnalysis: {
    fact: 'Test fact',
    observation: 'Test observation', 
    insight: 'Test insight',
    humanTruth: 'Test human truth',
    culturalMoment: 'Test cultural moment'
  }
};

console.log('Testing API endpoints with data:', testData);

// Test each endpoint
Promise.all([
  fetch('/api/cohorts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(testData)
  }),
  fetch('/api/strategic-insights', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(testData)
  }),
  fetch('/api/strategic-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', 
    body: JSON.stringify(testData)
  })
]).then(responses => {
  console.log('All responses received');
  return Promise.all(responses.map(r => r.json()));
}).then(results => {
  console.log('Cohorts:', results[0]);
  console.log('Insights:', results[1]); 
  console.log('Actions:', results[2]);
}).catch(e => console.error('Test failed:', e));