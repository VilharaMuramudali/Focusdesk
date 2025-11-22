// Script to fix conversation indexes
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/FocusDesk';

async function fixConversationIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const conversationsCollection = db.collection('conversations');

    // Get all existing indexes
    console.log('\nCurrent indexes:');
    const indexes = await conversationsCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the problematic 'id_1' index if it exists
    const hasIdIndex = indexes.some(index => index.name === 'id_1');
    if (hasIdIndex) {
      console.log('\nDropping problematic "id_1" index...');
      await conversationsCollection.dropIndex('id_1');
      console.log('Successfully dropped "id_1" index');
    } else {
      console.log('\n"id_1" index not found (already removed or never existed)');
    }

    // Create proper indexes
    console.log('\nEnsuring proper indexes exist...');
    
    await conversationsCollection.createIndex({ 'participants.userId': 1 });
    console.log('  ✓ Created index on participants.userId');
    
    await conversationsCollection.createIndex({ bookingId: 1 });
    console.log('  ✓ Created index on bookingId');
    
    await conversationsCollection.createIndex({ lastActivity: -1 });
    console.log('  ✓ Created index on lastActivity');
    
    await conversationsCollection.createIndex({ isActive: 1 });
    console.log('  ✓ Created index on isActive');

    // Display final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await conversationsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Conversation indexes fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing conversation indexes:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
fixConversationIndexes()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
