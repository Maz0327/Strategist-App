// Test script to check cohort functionality
const testContent = "This is a test article about digital marketing trends and how brands are adapting to Gen Z preferences. Social media platforms like TikTok are driving new forms of engagement.";

const testTruthAnalysis = {
  fact: "Brands are adapting marketing strategies for Gen Z",
  observation: "Social media platforms are primary engagement channels",
  insight: "Generational preferences are driving platform-specific content strategies",
  humanTruth: "Authentic connection matters more than polished content",
  culturalMoment: "Digital-native generation expects genuine brand interactions",
  attentionValue: "high"
};

console.log("Testing cohort analysis with sample data:");
console.log("Content length:", testContent.length);
console.log("Truth analysis:", testTruthAnalysis);

// This would be the API call the frontend makes
const testData = {
  content: testContent,
  title: "Test Article",
  truthAnalysis: testTruthAnalysis
};

console.log("API request data:", JSON.stringify(testData, null, 2));