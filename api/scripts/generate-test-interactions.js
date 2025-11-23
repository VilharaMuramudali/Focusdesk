/**
 * Generate test interactions for a user to populate ML recommendations
 * Run with: node generate-test-interactions.js <userId> <numInteractions>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Define interaction schema
const interactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  packageId: { type: String, required: true },
  interactionType: { type: String, enum: ['view', 'click', 'search', 'message', 'rating', 'booking', 'start_booking'], required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
});

const Interaction = mongoose.model('Interaction', interactionSchema);

// Package schema (simplified)
const packageSchema = new mongoose.Schema({}, { strict: false });
const Package = mongoose.model('Package', packageSchema, 'packages');

async function generateInteractions(userId, numInteractions = 50) {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get active packages
    const packages = await Package.find({ isActive: true }).limit(20);
    if (packages.length === 0) {
      console.log('❌ No packages found in database!');
      return;
    }

    console.log(`Found ${packages.length} packages`);
    console.log(`Generating ${numInteractions} interactions for user: ${userId}\n`);

    const interactions = [];
    const interactionTypes = ['view', 'view', 'view', 'click', 'click', 'view'];
    
    // Generate interactions over the past 30 days
    const now = new Date();
    
    for (let i = 0; i < numInteractions; i++) {
      // Random package
      const randomPkg = packages[Math.floor(Math.random() * packages.length)];
      
      // Random interaction type
      const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
      
      // Random timestamp in the past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
      
      interactions.push({
        userId,
        packageId: randomPkg._id.toString(),
        interactionType,
        timestamp,
        metadata: {
          source: 'test_data_generation',
          packageTitle: randomPkg.title || 'Unknown'
        }
      });
    }

    // Insert interactions
    const result = await Interaction.insertMany(interactions);
    console.log(`✅ Created ${result.length} interactions\n`);

    // Show summary
    console.log('Interaction Summary:');
    const typeCounts = {};
    interactions.forEach(interaction => {
      const t = interaction.interactionType;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    // Show some package titles
    console.log('\nPackages interacted with:');
    const uniquePackages = [...new Set(interactions.slice(0, 10).map(i => i.metadata.packageTitle))];
    uniquePackages.slice(0, 5).forEach(title => {
      console.log(`  - ${title}`);
    });

    console.log('\n✅ Done! Now retrain the model with:');
    console.log('   cd python-ai');
    console.log('   python train_model.py');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n Database connection closed');
  }
}

// Get command line arguments
const userId = process.argv[2] || '680a9116b88e07cba6d4572b';
const numInteractions = parseInt(process.argv[3]) || 50;

console.log(`Generating test interactions for user: ${userId}`);
generateInteractions(userId, numInteractions);
