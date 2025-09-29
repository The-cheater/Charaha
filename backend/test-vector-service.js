require('dotenv').config();
const vectorService = require('./src/services/vector.service');
const crypto = require('crypto');

async function testVectorService() {
  console.log('🧪 Testing Vector Service...');
  console.log('='.repeat(60));
  
  try {
    // 1. Health check
    console.log('\n1. Vector Service Health Check...');
    const health = await vectorService.healthCheck();
    console.log('   Status:', health.status);
    if (health.status === 'unhealthy') {
      console.log('   Error:', health.error);
      throw new Error('Vector service unhealthy');
    }
    
    // 2. Initialize collection
    console.log('\n2. Initializing collection...');
    await vectorService.initializeCollection();
    console.log('   ✅ Collection initialized');
    
    // 3. Test embedding generation
    console.log('\n3. Testing embedding generation...');
    const testText = "Machine learning algorithms analyze data to find patterns.";
    console.log(`   Generating embedding for: "${testText}"`);
    
    const embedding = await vectorService.generateEmbedding(testText);
    console.log(`   ✅ Generated ${embedding.length}D vector`);
    console.log(`   📊 Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    
    // 4. Store test vector - USE VALID UUID
    console.log('\n4. Storing test vector...');
    const testId = crypto.randomUUID(); // Generate valid UUID
    const result = await vectorService.storeVector(
      testId,
      testText,
      {
        source: 'test',
        category: 'technical',
        author: 'test-system'
      }
    );
    console.log(`   ✅ Stored vector: ${result.id}`);
    
    // 5. Test search functionality
    console.log('\n5. Testing search functionality...');
    const searchQuery = "machine learning patterns";
    console.log(`   🔍 Search query: "${searchQuery}"`);
    
    const results = await vectorService.searchSimilar(searchQuery, 3);
    console.log(`   📊 Found ${results.length} results:`);
    
    results.forEach((result, index) => {
      console.log(`      ${index + 1}. Score: ${result.score.toFixed(4)}`);
      console.log(`         Text: ${result.text.substring(0, 80)}...`);
      console.log(`         Source: ${result.metadata.source}`);
    });
    
    // 6. Collection info
    console.log('\n6. Collection information...');
    const info = await vectorService.getCollectionInfo();
    console.log(`   📁 Collection: ${info.config?.params?.vectors?.size || 'N/A'}D vectors`);
    console.log(`   📊 Points count: ${info.points_count || 0}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL VECTOR SERVICE TESTS PASSED!');
    console.log('✅ Hugging Face API: Working');
    console.log('✅ Qdrant Cloud: Working');
    console.log('✅ Embedding generation: Working');
    console.log('✅ Vector storage: Working');  
    console.log('✅ Similarity search: Working');
    console.log('🚀 Your semantic search system is FULLY FUNCTIONAL!');
    console.log('=' * 60);
    
  } catch (error) {
    console.log('\n❌ Vector service test failed:', error.message);
    
    if (error.message.includes('API key not configured')) {
      console.log('🔑 Set HF_API_KEY in .env file');
    } else if (error.message.includes('Model loading')) {
      console.log('⏳ Wait for Hugging Face model to load and try again');
    }
  }
}

testVectorService();
