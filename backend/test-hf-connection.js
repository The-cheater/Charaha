require('dotenv').config();
const axios = require('axios');

async function testHFConnection() {
  const API_KEY = process.env.HF_API_KEY;
  const MODEL = process.env.HF_MODEL || 'BAAI/bge-small-en-v1.5';
  
  console.log('🧪 Testing Hugging Face API Connection...');
  console.log('='.repeat(50));
  
  if (!API_KEY) {
    console.log('❌ HF_API_KEY not found in .env file');
    return;
  }
  
  console.log('🔑 API Key:', API_KEY.substring(0, 15) + '...');
  console.log('🤖 Model:', MODEL);
  
  try {
    const testTexts = [
      "Hello, this is a test sentence for embeddings.",
      "Machine learning and artificial intelligence are fascinating topics.",
      "JavaScript is a popular programming language for web development."
    ];
    
    console.log('\n📝 Testing with sample texts...');
    
    for (let i = 0; i < testTexts.length; i++) {
      console.log(`\n${i + 1}. Testing: "${testTexts[i]}"`);
      
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${MODEL}`,
          {
            inputs: testTexts[i],
            options: {
              wait_for_model: true,
              use_cache: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`   ✅ Generated ${response.data.length}D vector`);
          console.log(`   📊 Sample values: [${response.data.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
          console.log(`   🎯 Vector range: ${Math.min(...response.data).toFixed(4)} to ${Math.max(...response.data).toFixed(4)}`);
        } else {
          console.log('   ❌ Unexpected response format');
          console.log('   📋 Response:', JSON.stringify(response.data).substring(0, 300));
        }
      } catch (innerError) {
        if (innerError.response?.status === 503) {
          console.log('   ⏳ Model loading, please wait 30 seconds...');
        } else {
          console.log(`   ❌ Failed: ${innerError.response?.data?.error || innerError.message}`);
          if (innerError.response?.data) {
            console.log('   📋 Full error:', JSON.stringify(innerError.response.data));
          }
        }
      }
    }
    
    console.log('\n🎉 Hugging Face API test completed!');
    console.log('✅ Ready for vector operations');
    
  } catch (error) {
    console.log('\n❌ Hugging Face API test failed');
    console.log('📋 Error details:', error.response?.data || error.message);
  }
}

testHFConnection();
