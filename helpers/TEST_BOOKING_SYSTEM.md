# Testing the Booking System

## Quick Test Guide

### Prerequisites
1. Make sure both backend and frontend servers are running
2. Have at least one educator account and one student account
3. Have at least one package created by an educator

### Test Steps

#### 1. Test Package Creation (Educator)
1. Login as an educator
2. Go to Packages section
3. Create a new package with:
   - Title: "Test Package"
   - Description: "This is a test package"
   - Rate: 100
   - Sessions: 2
   - Keywords: "test, demo"
4. Save the package

#### 2. Test Package Booking (Student)
1. Login as a student
2. Go to Find Tutors section
3. Find the "Test Package" you created
4. Click on the package to view details
5. Click "Book This Package"
6. Fill out the booking form:
   - Select dates for 2 sessions
   - Add some notes (optional)
7. Click "Confirm Booking"
8. You should see a success message and be redirected

#### 3. Test Educator Schedule (Educator)
1. Login as the educator who created the package
2. Go to Schedule section
3. Select today's date
4. You should see the booking you just created
5. Test the confirm/cancel buttons
6. Click "View Details" to see full booking information

#### 4. Test Student Bookings (Student)
1. Login as the student who made the booking
2. Go to My Bookings section
3. You should see your booking listed
4. Click "View Details" to see full booking information

### Expected Results

#### Backend API Tests
Test these endpoints with Postman or similar:

1. **Create Booking**
   ```
   POST /api/bookings
   Body: {
     "packageId": "package_id_here",
     "sessions": 2,
     "studentNotes": "Test booking",
     "sessionDates": [
       {"date": "2024-01-15", "time": "09:00"},
       {"date": "2024-01-16", "time": "10:00"}
     ]
   }
   ```

2. **Get Educator Bookings**
   ```
   GET /api/bookings/educator?date=2024-01-15
   ```

3. **Get Student Bookings**
   ```
   GET /api/bookings/student
   ```

4. **Update Booking Status**
   ```
   PUT /api/bookings/booking_id_here/status
   Body: {
     "status": "confirmed"
   }
   ```

#### Frontend Tests
1. **Booking Form**: Should open when clicking "Book This Package"
2. **Session Scheduling**: Should allow adding/removing sessions
3. **Form Validation**: Should require dates for all sessions
4. **Success Message**: Should show after successful booking
5. **Educator Schedule**: Should show bookings for selected date
6. **Status Updates**: Should work when educator confirms/cancels

### Common Issues and Solutions

#### Issue: Booking form doesn't open
**Solution**: Check browser console for errors. Make sure the BookingForm component is properly imported.

#### Issue: Form submission fails
**Solution**: 
1. Check network tab for API errors
2. Verify backend server is running
3. Check authentication token

#### Issue: Bookings not showing in educator schedule
**Solution**:
1. Check the date filter
2. Verify the booking was created successfully
3. Check if educator ID matches

#### Issue: Permission errors
**Solution**:
1. Verify user is logged in
2. Check user roles (educator vs student)
3. Verify JWT token is valid

### Debug Information

#### Console Logs to Check
- "Book session clicked" - Confirms button click
- "Package data:" - Shows package information
- "Form submitted" - Confirms form submission
- "Creating booking for package:" - Shows API call
- "Booking response:" - Shows API response

#### Network Tab to Check
- POST /api/bookings - Should return 201 status
- GET /api/bookings/educator - Should return 200 status
- GET /api/bookings/student - Should return 200 status

#### Database to Check
- Check if bookings are being created in MongoDB
- Verify booking data structure
- Check user references

### Success Criteria
✅ Booking form opens and works correctly
✅ Sessions can be scheduled with dates and times
✅ Booking is created successfully
✅ Success message is displayed
✅ Student is redirected to dashboard
✅ Educator can see booking in schedule
✅ Educator can confirm/cancel booking
✅ Student can view their bookings
✅ All status updates work correctly

If all these criteria are met, the booking system is working correctly! 