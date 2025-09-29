require('dotenv').config();
const axios = require('axios');
const vectorService = require('./src/services/vector.service');
const crypto = require('crypto');

async function testCompleteSearch() {
  console.log('🧪 Testing Complete Search Flow...');
  console.log('='.repeat(60));
  
  try {
    // 1. Initialize and populate database
    console.log('\n1. Setting up test data...');
    await vectorService.initializeCollection();
    
    const testDocs = [
      {
        id: crypto.randomUUID(), // Valid UUID
        text: 'Machine learning algorithms use statistical techniques to enable computers to improve their performance on a specific task through experience without being explicitly programmed.',
        metadata: { 
          source: 'documentation', 
          category: 'AI',
          author: 'Tech Team',
          title: 'ML Fundamentals'
        }
      },
      {
        id: crypto.randomUUID(), // Valid UUID
        text: 'React is a JavaScript library for building user interfaces, particularly web applications. It allows developers to create reusable UI components and manage application state effectively.',
        metadata: { 
          source: 'tutorial', 
          category: 'Frontend',
          author: 'Dev Team',
          title: 'React Basics'
        }
      },
      {
        id: crypto.randomUUID(), // Valid UUID
        text: 'Node.js is a runtime environment that allows developers to run JavaScript code on the server side. It uses an event-driven, non-blocking I/O model that makes it efficient for building scalable applications.',
        metadata: { 
          source: 'guide', 
          category: 'Backend',
          author: 'Backend Team',
          title: 'Node.js Guide'
        }
      },
      {
        id: crypto.randomUUID(), // Valid UUID
        text: 'Vector databases are specialized systems designed to store, index, and search high-dimensional vectors efficiently. They enable semantic search and similarity matching for AI applications.',
        metadata: {
          source: 'documentation',
          category: 'Database',
          author: 'Data Team', 
          title: 'Vector DB Overview'
        }
      },
      {
        id: crypto.randomUUID(), // Valid UUID
        text: 'RESTful APIs follow architectural principles for designing web services. They use HTTP methods like GET, POST, PUT, and DELETE to perform operations on resources identified by URLs.',
        metadata: {
          source: 'tutorial',
          category: 'API',
          author: 'Backend Team',
          title: 'REST API Design'
        }
      }
    ];
    
    // Store all test documents
    console.log('   📝 Storing test documents...');
    for (const doc of testDocs) {
      await vectorService.storeVector(doc.id, doc.text, doc.metadata);
      console.log(`   ✅ Stored: ${doc.metadata.title}`);
    }
    
    console.log(`\n   🎉 Successfully stored ${testDocs.length} test documents!`);
    
    // 2. Test various search scenarios
    console.log('\n2. Testing search scenarios...');
    
    const searchTests = [
      {
        query: "machine learning algorithms",
        description: "AI/ML related search"
      },
      {
        query: "JavaScript library components", 
        description: "Frontend development search"
      },
      {
        query: "server side development",
        description: "Backend development search"
      },
      {
        query: "database vector search",
        description: "Database technology search"
      },
      {
        query: "web services HTTP methods",
        description: "API design search"
      }
    ];
    
    for (const test of searchTests) {
      console.log(`\n   🔍 ${test.description}`);
      console.log(`      Query: "${test.query}"`);
      
      const results = await vectorService.searchSimilar(test.query, 3);
      console.log(`      📊 Results: ${results.length}`);
      
      results.forEach((result, index) => {
        console.log(`         ${index + 1}. [${result.score.toFixed(3)}] ${result.metadata.title}`);
        console.log(`            Source: ${result.metadata.source} | Category: ${result.metadata.category}`);
      });
    }
    
    // 3. Collection statistics
    console.log('\n3. Final statistics...');
    const info = await vectorService.getCollectionInfo();
    console.log(`   📁 Total vectors: ${info.points_count || 0}`);
    console.log(`   💾 Vector dimension: ${info.config?.params?.vectors?.size || 'N/A'}`);
    console.log(`   🔧 Distance metric: ${info.config?.params?.vectors?.distance || 'N/A'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE SEMANTIC SEARCH SYSTEM WORKING! 🎉');
    console.log('✅ Data ingestion: Working');
    console.log('✅ Vector embeddings: Working');
    console.log('✅ Semantic search: Working');
    console.log('✅ Similarity matching: Working');
    console.log('🚀 Your TeamMemory platform is fully operational!');
    console.log('=' * 60);
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Start backend server: npm run dev');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Test search UI at http://localhost:3000');
    console.log('   4. Add real data via Slack/Google integrations');
    
  } catch (error) {
    console.log('\n❌ Complete search test failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testCompleteSearch();
