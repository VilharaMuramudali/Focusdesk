import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Package from './models/package.model.js';
import UserInteraction from './models/userInteraction.model.js';
import Activity from './models/activity.model.js';

dotenv.config();

// Test the personalized recommendation system
async function testPersonalizedRecommendations() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');
    
    // Find a student with Art & Design interests
    const student = await User.findOne({ 
      subjects: { $in: [/art/i, /design/i] },
      isEducator: false 
    });
    
    if (!student) {
      console.log('No student with Art & Design interests found. Creating test student...');
      
      // Create a test student with Art & Design interests
      const testStudent = new User({
        username: 'art_student',
        email: 'art@test.com',
        password: 'test123',
        subjects: ['Art & Design', 'Digital Art'],
        isEducator: false
      });
      
      await testStudent.save();
      console.log('Created test student with Art & Design interests');
      
      // Add some test interactions
      const artPackages = await Package.find({ 
        subjects: { $in: [/art/i, /design/i] } 
      }).limit(3);
      
      for (const pkg of artPackages) {
        await UserInteraction.create({
          userId: testStudent._id,
          packageId: pkg._id,
          interactionType: 'view',
          timestamp: new Date()
        });
      }
      
      console.log('Added test interactions for Art & Design packages');
    }
    
    // Test the recommendation logic
    console.log('\n=== Testing Personalized Recommendations ===');
    
    const testStudentId = student ? student._id : testStudent._id;
    
    // Get user preferences
    const user = await User.findById(testStudentId);
    const interactions = await UserInteraction.find({ userId: testStudentId })
      .populate('packageId')
      .sort({ timestamp: -1 })
      .limit(100);
    
    const activities = await Activity.find({ studentId: testStudentId })
      .sort({ timestamp: -1 })
      .limit(200);
    
    console.log('Student subjects:', user.subjects);
    console.log('Interaction count:', interactions.length);
    console.log('Activity count:', activities.length);
    
    // Test the recommendation query
    const studentPreferences = {
      subjects: user.subjects || ['Art & Design'],
      preferredPrice: null,
      interactionCount: interactions.length,
      learningLevel: 'beginner',
      preferredLanguages: ['English']
    };
    
    // Build personalized query
    let personalizedQuery = { isActive: true };
    
    if (studentPreferences.subjects && studentPreferences.subjects.length > 0) {
      const subjectQueries = [];
      
      studentPreferences.subjects.forEach(subject => {
        const cleanSubject = subject.toLowerCase().trim();
        subjectQueries.push(
          { subjects: { $regex: cleanSubject, $options: 'i' } },
          { title: { $regex: cleanSubject, $options: 'i' } },
          { desc: { $regex: cleanSubject, $options: 'i' } },
          { keywords: { $regex: cleanSubject, $options: 'i' } }
        );
      });
      
      personalizedQuery.$or = subjectQueries;
    }
    
    console.log('Personalized query:', JSON.stringify(personalizedQuery, null, 2));
    
    // Get personalized packages
    const personalizedPackages = await Package.find(personalizedQuery)
      .populate('educatorId', 'username img subjects bio rating totalSessions')
      .sort({ rating: -1, totalOrders: -1 })
      .limit(10);
    
    console.log(`\nFound ${personalizedPackages.length} personalized packages:`);
    
    personalizedPackages.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.title}`);
      console.log(`   Subjects: ${pkg.subjects.join(', ')}`);
      console.log(`   Rating: ${pkg.rating}`);
      console.log(`   Price: Rs.${pkg.rate}/hr`);
      console.log('');
    });
    
    // Test broader matching if no strict matches
    if (personalizedPackages.length === 0) {
      console.log('No strict matches found, testing broader matching...');
      
      let broaderQuery = { isActive: true };
      let broaderFilters = [];
      
      if (studentPreferences.subjects && studentPreferences.subjects.length > 0) {
        const broaderSubjectQueries = [];
        
        studentPreferences.subjects.forEach(subject => {
          const cleanSubject = subject.toLowerCase().trim();
          const subjectWords = cleanSubject.split(/[\s&,]+/).filter(word => word.length > 2);
          
          subjectWords.forEach(word => {
            broaderSubjectQueries.push(
              { subjects: { $regex: word, $options: 'i' } },
              { title: { $regex: word, $options: 'i' } },
              { desc: { $regex: word, $options: 'i' } }
            );
          });
        });
        
        broaderFilters.push(...broaderSubjectQueries);
      }
      
      if (broaderFilters.length > 0) {
        broaderQuery.$or = broaderFilters;
        
        const broaderPackages = await Package.find(broaderQuery)
          .populate('educatorId', 'username img subjects bio rating totalSessions')
          .sort({ rating: -1, totalOrders: -1 })
          .limit(10);
        
        console.log(`\nFound ${broaderPackages.length} broader matches:`);
        
        broaderPackages.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.title}`);
          console.log(`   Subjects: ${pkg.subjects.join(', ')}`);
          console.log(`   Rating: ${pkg.rating}`);
          console.log(`   Price: Rs.${pkg.rate}/hr`);
          console.log('');
        });
      }
    }
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testPersonalizedRecommendations();
