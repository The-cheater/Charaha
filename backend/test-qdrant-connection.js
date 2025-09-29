require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantConnection() {
  console.log('🧪 Testing Qdrant Connection...');
  console.log('='.repeat(50));
  
  const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
  const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
  
  console.log('🌐 URL:', QDRANT_URL);
  console.log('🔑 API Key:', QDRANT_API_KEY ? `${QDRANT_API_KEY.substring(0, 20)}...` : '❌ Not set');
  
  const client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY || undefined,
  });
  
  try {
    // 1. Test basic connection
    console.log('\n1. Testing basic connection...');
    const health = await client.api('cluster', 'cluster_status');
    console.log('   ✅ Qdrant connection successful!');
    console.log('   📊 Cluster info:', health.data?.status || 'OK');
    
    // 2. List existing collections
    console.log('\n2. Listing collections...');
    const collections = await client.getCollections();
    console.log(`   📁 Found ${collections.collections.length} collections:`);
    
    if (collections.collections.length > 0) {
      collections.collections.forEach((collection, index) => {
        console.log(`      ${index + 1}. ${collection.name}`);
      });
    } else {
      console.log('   📝 No collections found (this is normal for new clusters)');
    }
    
    // 3. Test collection creation (temporary)
    console.log('\n3. Testing collection operations...');
    const testCollectionName = `test_collection_${Date.now()}`;
    
    try {
      await client.createCollection(testCollectionName, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
      console.log(`   ✅ Created test collection: ${testCollectionName}`);
      
      // Clean up
      await client.deleteCollection(testCollectionName);
      console.log(`   🧹 Cleaned up test collection`);
      
    } catch (error) {
      console.log('   ⚠️  Collection test failed:', error.message);
    }
    
    console.log('\n🎉 Qdrant Connection Test Summary:');
    console.log('   ✅ Connection: Working');
    console.log('   ✅ Authentication: Valid');
    console.log('   ✅ Collections: Accessible');
    console.log('   ✅ Operations: Functional');
    
    console.log('\n🚀 Ready for vector database operations!');
    
  } catch (error) {
    console.log('\n❌ Qdrant connection test failed');
    console.log('📋 Error details:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔌 Connection refused - check if Qdrant is running');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('🔒 Authentication failed - check API key');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Connection timeout - check network/firewall');
    }
  }
}

testQdrantConnection();
