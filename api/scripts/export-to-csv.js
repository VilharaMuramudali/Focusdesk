/**
 * Export MongoDB data to CSV for ML model training
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Define schemas
const interactionSchema = new mongoose.Schema({}, { strict: false });
const packageSchema = new mongoose.Schema({}, { strict: false });

const Interaction = mongoose.model('Interaction', interactionSchema, 'interactions');
const Package = mongoose.model('Package', packageSchema, 'packages');

async function exportToCSV() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    // Fetch interactions
    console.log('Fetching interactions...');
    const interactions = await Interaction.find({}).lean();
    console.log(`Found ${interactions.length} interactions`);

    // Fetch packages
    console.log('Fetching packages...');
    const packages = await Package.find({ isActive: true }).lean();
    console.log(`Found ${packages.length} packages\n`);

    // Create package lookup
    const packageMap = {};
    packages.forEach(pkg => {
      packageMap[pkg._id.toString()] = pkg;
    });

    // Create CSV content
    const csvLines = ['user_id,package_id,interaction_type,timestamp,package_title,package_subject,package_price'];
    
    interactions.forEach(interaction => {
      const pkg = packageMap[interaction.packageId];
      if (pkg) {
        const line = [
          interaction.userId,
          interaction.packageId,
          interaction.interactionType,
          interaction.timestamp ? new Date(interaction.timestamp).toISOString() : new Date().toISOString(),
          `"${(pkg.title || '').replace(/"/g, '""')}"`,
          pkg.subject || 'General',
          pkg.price || 0
        ].join(',');
        csvLines.push(line);
      }
    });

    // Write to file
    const outputPath = path.join(__dirname, '../python-ai/data/interactions.csv');
    const dataDir = path.join(__dirname, '../python-ai/data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, csvLines.join('\n'));
    console.log(`✅ Exported ${csvLines.length - 1} interactions to ${outputPath}`);
    console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);

    // Show sample
    console.log('Sample data:');
    csvLines.slice(0, 4).forEach(line => console.log(line));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

exportToCSV();
