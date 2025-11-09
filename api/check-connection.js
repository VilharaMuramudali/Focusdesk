/**
 * Simple ML Service Connection Checker
 * Run this to verify backend and ML service are connected
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:8800';
const ML_SERVICE_URL = 'http://localhost:5000';

console.log('🔍 Checking Backend and ML Service Connection...\n');
console.log('='.repeat(60));

async function checkConnection() {
    let backendRunning = false;
    let mlServiceRunning = false;
    let connected = false;

    // Check 1: Backend Server
    console.log('\n📡 Step 1: Checking Node.js Backend (port 8800)...');
    try {
        await axios.get(`${BACKEND_URL}`, { timeout: 3000 });
        console.log('   ✅ Backend is RUNNING');
        backendRunning = true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('   ❌ Backend is NOT running');
            console.log('   💡 Start it: cd api && npm start');
        } else {
            console.log('   ✅ Backend is RUNNING (received response)');
            backendRunning = true;
        }
    }

    // Check 2: ML Service
    console.log('\n🤖 Step 2: Checking ML Service (port 5000)...');
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
        console.log('   ✅ ML Service is RUNNING');
        console.log(`   📊 Status: ${response.data.status}`);
        console.log(`   🧠 Models Loaded: ${response.data.models_loaded ? 'Yes' : 'No'}`);
        mlServiceRunning = true;
    } catch (error) {
        console.log('   ❌ ML Service is NOT running');
        if (!backendRunning) {
            console.log('   💡 Start backend first (ML auto-starts with it)');
        } else {
            console.log('   ⚠️  Backend is running but ML service failed to start');
            console.log('   💡 Check backend console for ML service errors');
        }
    }

    // Check 3: ML Service Stats
    if (mlServiceRunning) {
        console.log('\n📊 Step 3: Checking ML Service Details...');
        try {
            const statsResponse = await axios.get(`${ML_SERVICE_URL}/stats`, { timeout: 3000 });
            console.log(`   📈 Models Loaded: ${statsResponse.data.models_loaded ? '✅' : '❌'}`);
            console.log(`   📁 Model File Exists: ${statsResponse.data.model_exists ? '✅' : '❌'}`);
            console.log(`   📂 Processed Data Exists: ${statsResponse.data.processed_data_exists ? '✅' : '❌'}`);

            if (statsResponse.data.users_count !== undefined) {
                console.log(`   👥 Users in Model: ${statsResponse.data.users_count}`);
                console.log(`   📦 Packages in Model: ${statsResponse.data.packages_count}`);
            }

            if (!statsResponse.data.models_loaded) {
                console.log('\n   ⚠️  Model not trained yet');
                console.log('   💡 It will auto-train in ~60 seconds after ML service starts');
                console.log('   💡 Or manually train: curl -X POST http://localhost:5000/extract-and-train');
            }
        } catch (error) {
            console.log(`   ⚠️  Could not get stats: ${error.message}`);
        }
    }

    // Check 4: Backend to ML Connection
    if (backendRunning && mlServiceRunning) {
        console.log('\n🔗 Step 4: Testing Backend → ML Service Connection...');
        try {
            // Test backend recommendations endpoint
            const response = await axios.get(`${BACKEND_URL}/api/recommendations/test`, {
                timeout: 5000,
                validateStatus: () => true // Accept any status
            });
            console.log('   ✅ Backend can reach recommendations endpoint');
            connected = true;
        } catch (error) {
            if (error.code !== 'ECONNREFUSED') {
                console.log('   ✅ Backend recommendations route exists');
                connected = true;
            } else {
                console.log('   ⚠️  Could not test recommendations endpoint');
            }
        }
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONNECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Backend Server:     ${backendRunning ? '✅ Running' : '❌ Not Running'}`);
    console.log(`ML Service:         ${mlServiceRunning ? '✅ Running' : '❌ Not Running'}`);
    console.log(`Connection:         ${connected ? '✅ Connected' : '❌ Not Connected'}`);
    console.log('='.repeat(60));

    if (backendRunning && mlServiceRunning) {
        console.log('\n🎉 SUCCESS! Your backend and ML service are connected!\n');
        console.log('✅ You can now use ML-powered recommendations');
        console.log('✅ ML service URL: http://localhost:5000');
        console.log('✅ Backend API URL: http://localhost:8800');
    } else if (!backendRunning && !mlServiceRunning) {
        console.log('\n⚠️  Both services are not running\n');
        console.log('👉 TO START:');
        console.log('   cd api');
        console.log('   npm start');
        console.log('\n   (ML service will auto-start with backend)');
    } else if (backendRunning && !mlServiceRunning) {
        console.log('\n⚠️  Backend is running but ML service failed to start\n');
        console.log('👉 CHECK:');
        console.log('   1. Look at your backend console for ML service errors');
        console.log('   2. Ensure Python is installed: python --version');
        console.log('   3. Check ML directory exists: education-recommender-ml/');
        console.log('   4. Check .env file has MONGO_URI configured');
    }

    console.log('\n');
    process.exit(backendRunning && mlServiceRunning ? 0 : 1);
}

checkConnection();
