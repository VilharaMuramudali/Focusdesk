// Script to fix the duplicate key error on conversations collection
// Run this once: node scripts/fix-conversation-index.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/FocusDesk';

async function fixConversationIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const conversationsCollection = db.collection('conversations');

    // Get all indexes
    console.log('\nCurrent indexes:');
    const indexes = await conversationsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Check if there's an index on 'id' field
    const idIndex = indexes.find(index => 
      index.key && (index.key.id === 1 || index.key.id === -1)
    );

    if (idIndex) {
      console.log('\nFound problematic index on "id" field:', idIndex.name);
      console.log('Dropping index:', idIndex.name);
      
      try {
        await conversationsCollection.dropIndex(idIndex.name);
        console.log('✓ Successfully dropped index:', idIndex.name);
      } catch (err) {
        if (err.code === 27) {
          console.log('Index does not exist (may have been dropped already)');
        } else {
          throw err;
        }
      }
    } else {
      console.log('\nNo index found on "id" field');
    }

    // Also check for any documents with null id field and remove it
    console.log('\nChecking for documents with "id" field...');
    const docsWithId = await conversationsCollection.find({ id: { $exists: true } }).toArray();
    
    if (docsWithId.length > 0) {
      console.log(`Found ${docsWithId.length} documents with "id" field`);
      console.log('Removing "id" field from documents...');
      
      const result = await conversationsCollection.updateMany(
        { id: { $exists: true } },
        { $unset: { id: "" } }
      );
      
      console.log(`✓ Removed "id" field from ${result.modifiedCount} documents`);
    } else {
      console.log('No documents found with "id" field');
    }

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await conversationsCollection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n✓ Fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing conversation index:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

fixConversationIndex()
  .then(() => {
    console.log('\nScript completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

