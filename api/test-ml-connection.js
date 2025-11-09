/**
 * ML Service Connection Test
 * Tests the connection between Node.js application and Python ML service
 */

import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './api/.env' });

const ML_SERVICE_URL = process.env.ML_API_URL || 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI;

console.log('🔍 ML Service Connection Test');
console.log('=' .repeat(60));

// Test results
const testResults = {
  pythonInstalled: false,
  mlDirectoryExists: false,
  mlScriptExists: false,
  pythonDependencies: false,
  mongoConnection: false,
  mlServiceRunning: false,
  mlServiceHealthy: false,
  modelTrained: false,
  recommendationsWorking: false
};

// Test 1: Check if Python is installed
async function testPythonInstallation() {
  console.log('\n📝 Test 1: Checking Python installation...');

  const pythonCommands = ['python3', 'python', 'py'];

  for (const cmd of pythonCommands) {
    try {
      const version = execSync(`${cmd} --version`, { encoding: 'utf-8' });
      console.log(`   ✅ Python found: ${version.trim()} (command: ${cmd})`);
      testResults.pythonInstalled = true;
      return cmd;
    } catch (error) {
      // Try next command
    }
  }

  console.log('   ❌ Python not found. Please install Python 3.8 or higher.');
  return null;
}

// Test 2: Check ML directory and files
async function testMLDirectory() {
  console.log('\n📂 Test 2: Checking ML service directory...');

  const mlDir = path.join(__dirname, '..', 'education-recommender-ml');
  const mlScript = path.join(mlDir, 'ml_api_service.py');

  if (fs.existsSync(mlDir)) {
    console.log(`   ✅ ML directory exists: ${mlDir}`);
    testResults.mlDirectoryExists = true;
  } else {
    console.log(`   ❌ ML directory not found: ${mlDir}`);
    return { mlDir: null, mlScript: null };
  }

  if (fs.existsSync(mlScript)) {
    console.log(`   ✅ ML API script exists: ml_api_service.py`);
    testResults.mlScriptExists = true;
  } else {
    console.log(`   ❌ ML API script not found: ml_api_service.py`);
    return { mlDir, mlScript: null };
  }

  return { mlDir, mlScript };
}

// Test 3: Check Python dependencies
async function testPythonDependencies(pythonCmd, mlDir) {
  console.log('\n📦 Test 3: Checking Python dependencies...');

  if (!pythonCmd || !mlDir) {
    console.log('   ⏭️  Skipped (Python or ML directory not found)');
    return;
  }

  try {
    execSync(`${pythonCmd} -c "import pandas, sklearn, flask, flask_cors"`, {
      stdio: 'ignore',
      cwd: mlDir
    });
    console.log('   ✅ All required Python packages are installed');
    testResults.pythonDependencies = true;
  } catch (error) {
    console.log('   ❌ Some Python packages are missing');
    console.log('   💡 Install with: cd education-recommender-ml && pip install -r requirements.txt');
  }
}

// Test 4: Check MongoDB connection
async function testMongoConnection() {
  console.log('\n🗄️  Test 4: Checking MongoDB connection...');

  if (!MONGO_URI) {
    console.log('   ❌ MONGO_URI not found in environment variables');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('   ✅ MongoDB connection successful');
    testResults.mongoConnection = true;

    // Check collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`   📊 Found ${collections.length} collections`);

    const requiredCollections = ['users', 'packages', 'bookings'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));

    if (missingCollections.length === 0) {
      console.log('   ✅ All required collections exist');
    } else {
      console.log(`   ⚠️  Missing collections: ${missingCollections.join(', ')}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
  }
}

// Test 5: Check if ML service is running
async function testMLServiceRunning() {
  console.log('\n🚀 Test 5: Checking if ML service is running...');

  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });

    if (response.data.status === 'healthy') {
      console.log('   ✅ ML service is running and healthy');
      testResults.mlServiceRunning = true;
      testResults.mlServiceHealthy = true;

      console.log(`   📡 Service URL: ${ML_SERVICE_URL}`);
      console.log(`   ⏰ Timestamp: ${response.data.timestamp}`);
    } else {
      console.log('   ⚠️  ML service responded but status is not healthy');
      testResults.mlServiceRunning = true;
    }
  } catch (error) {
    console.log('   ❌ ML service is not running');
    console.log('   💡 Start with: cd Focusdesk/api && npm start');
  }
}

// Test 6: Check ML model status
async function testMLModelStatus() {
  console.log('\n🧠 Test 6: Checking ML model status...');

  if (!testResults.mlServiceRunning) {
    console.log('   ⏭️  Skipped (ML service not running)');
    return;
  }

  try {
    const response = await axios.get(`${ML_SERVICE_URL}/stats`, { timeout: 5000 });

    console.log(`   📊 Models loaded: ${response.data.models_loaded ? 'Yes' : 'No'}`);
    console.log(`   📁 Model file exists: ${response.data.model_exists ? 'Yes' : 'No'}`);
    console.log(`   📂 Processed data exists: ${response.data.processed_data_exists ? 'Yes' : 'No'}`);

    if (response.data.users_count !== undefined) {
      console.log(`   👥 Users in model: ${response.data.users_count}`);
      console.log(`   📦 Packages in model: ${response.data.packages_count}`);
    }

    if (response.data.models_loaded) {
      console.log('   ✅ ML model is trained and ready');
      testResults.modelTrained = true;
    } else {
      console.log('   ⚠️  ML model not trained');
      console.log('   💡 Train with: curl -X POST http://localhost:5000/extract-and-train');
    }
  } catch (error) {
    console.log(`   ❌ Error checking model status: ${error.message}`);
  }
}

// Test 7: Test recommendations endpoint
async function testRecommendations() {
  console.log('\n🎯 Test 7: Testing recommendations endpoint...');

  if (!testResults.mlServiceRunning) {
    console.log('   ⏭️  Skipped (ML service not running)');
    return;
  }

  try {
    // First, connect to MongoDB to get a real user ID
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // Try to get a user
    const users = await db.collection('users').find().limit(1).toArray();

    if (users.length === 0) {
      console.log('   ⚠️  No users found in database. Cannot test recommendations.');
      await mongoose.disconnect();
      return;
    }

    const testUserId = users[0]._id.toString();
    console.log(`   🧪 Testing with user ID: ${testUserId}`);

    await mongoose.disconnect();

    // Test recommendations
    const response = await axios.post(`${ML_SERVICE_URL}/recommendations`, {
      user_id: testUserId,
      algorithm: 'hybrid',
      limit: 5
    }, { timeout: 10000 });

    if (response.data.success) {
      const recs = response.data.recommendations || [];
      console.log(`   ✅ Recommendations endpoint working`);
      console.log(`   📊 Received ${recs.length} recommendations`);
      console.log(`   🔧 Algorithm: ${response.data.algorithm}`);

      if (recs.length > 0) {
        console.log('   📋 Sample recommendation:');
        console.log(`      - Title: ${recs[0].title || 'N/A'}`);
        console.log(`      - Score: ${recs[0].score || recs[0].aiScore || 'N/A'}`);
      }

      testResults.recommendationsWorking = true;
    } else {
      console.log('   ⚠️  Recommendations returned but success=false');
      console.log(`   Error: ${response.data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Recommendations failed: ${error.message}`);

    if (error.response?.data?.error) {
      console.log(`   Error details: ${error.response.data.error}`);
    }
  }
}

// Test 8: Test Node.js to ML service integration
async function testNodeMLIntegration() {
  console.log('\n🔗 Test 8: Testing Node.js ML integration...');

  const mlServiceManagerPath = path.join(__dirname, 'services', 'ml', 'mlServiceManager.js');

  if (fs.existsSync(mlServiceManagerPath)) {
    console.log('   ✅ ML Service Manager exists');

    // Check if it's imported in server.js
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf-8');

      if (serverContent.includes('mlServiceManager')) {
        console.log('   ✅ ML Service Manager is imported in server.js');
      } else {
        console.log('   ❌ ML Service Manager not imported in server.js');
      }

      if (serverContent.includes('mlServiceManager.startService')) {
        console.log('   ✅ ML Service auto-start is configured');
      } else {
        console.log('   ⚠️  ML Service auto-start may not be configured');
      }
    }
  } else {
    console.log('   ❌ ML Service Manager not found');
  }
}

// Summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Python Installation', result: testResults.pythonInstalled },
    { name: 'ML Directory', result: testResults.mlDirectoryExists },
    { name: 'ML Script', result: testResults.mlScriptExists },
    { name: 'Python Dependencies', result: testResults.pythonDependencies },
    { name: 'MongoDB Connection', result: testResults.mongoConnection },
    { name: 'ML Service Running', result: testResults.mlServiceRunning },
    { name: 'ML Service Healthy', result: testResults.mlServiceHealthy },
    { name: 'Model Trained', result: testResults.modelTrained },
    { name: 'Recommendations Working', result: testResults.recommendationsWorking }
  ];

  tests.forEach(test => {
    const status = test.result ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });

  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  const percentage = ((passedTests / totalTests) * 100).toFixed(0);

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Overall Score: ${passedTests}/${totalTests} (${percentage}%)`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! ML service is fully integrated.');
  } else if (testResults.mlServiceRunning && testResults.recommendationsWorking) {
    console.log('✅ ML service is working! Some optional features may need attention.');
  } else {
    console.log('⚠️  ML service needs configuration. See recommendations below.');
  }

  console.log('='.repeat(60));

  // Recommendations
  if (!testResults.pythonInstalled) {
    console.log('\n💡 Install Python 3.8 or higher: https://www.python.org/downloads/');
  }

  if (!testResults.pythonDependencies) {
    console.log('\n💡 Install Python dependencies:');
    console.log('   cd Focusdesk/education-recommender-ml');
    console.log('   pip install -r requirements.txt');
  }

  if (!testResults.mlServiceRunning) {
    console.log('\n💡 Start the Node.js server (which auto-starts ML service):');
    console.log('   cd Focusdesk/api');
    console.log('   npm start');
  }

  if (testResults.mlServiceRunning && !testResults.modelTrained) {
    console.log('\n💡 Train the ML model:');
    console.log('   curl -X POST http://localhost:5000/extract-and-train');
    console.log('   Or wait 60 seconds - it will train automatically');
  }

  console.log('\n');
}

// Run all tests
async function runAllTests() {
  try {
    const pythonCmd = await testPythonInstallation();
    const { mlDir, mlScript } = await testMLDirectory();
    await testPythonDependencies(pythonCmd, mlDir);
    await testMongoConnection();
    await testMLServiceRunning();
    await testMLModelStatus();
    await testRecommendations();
    await testNodeMLIntegration();

    printSummary();
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  } finally {
    // Ensure mongoose is disconnected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

// Start tests
runAllTests();
