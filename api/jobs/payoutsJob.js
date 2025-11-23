import Booking from '../models/booking.model.js';
import Payout from '../models/payout.model.js';
import User from '../models/user.model.js';

const CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds

/**
 * Calculate payouts for sessions:
 * - At half of the session duration: create a half payout (50% of per-session amount) if not already paid
 * - At end of session: create remaining payout (rest of per-session amount) if not already paid
 * This is a simulated internal payout system (status 'completed'). Replace internal transfer logic with real payment provider calls as needed.
 */
export function startPayoutsJob() {
  console.log('Starting payouts background job');

  const timer = setInterval(async () => {
    try {
      const now = new Date();

      // Find bookings that are either already paid or still pending (we may auto-complete pending payments at session end)
      const bookings = await Booking.find({ paymentStatus: { $in: ['paid', 'pending'] } }).lean();

      for (const booking of bookings) {
        const perSessionAmount = (booking.totalAmount || 0) / Math.max(1, (booking.sessions ? booking.sessions.length : 1));

        // Iterate sessions
        for (let i = 0; i < (booking.sessions ? booking.sessions.length : 0); i++) {
          const session = booking.sessions[i];
          if (!session || session.status === 'cancelled') continue;

          const sessionDate = new Date(session.date);
          // session.time stored as HH:MM - set hours/minutes if present
          if (session.time) {
            const [h, m] = session.time.split(':').map(s => parseInt(s));
            if (!isNaN(h)) sessionDate.setHours(h, isNaN(m) ? 0 : m, 0, 0);
          }

          const halfMs = (session.duration || 60) * 60 * 1000 / 2;
          const halfThreshold = new Date(sessionDate.getTime() + halfMs);
          const endThreshold = new Date(sessionDate.getTime() + ((session.duration || 60) * 60 * 1000));

          // Check half payout - only for bookings already paid
          if (booking.paymentStatus === 'paid' && (!session.payout || !session.payout.halfPaid) && now >= halfThreshold && now < endThreshold) {
            // create half payout
            const halfAmount = Math.round((perSessionAmount / 2) * 100) / 100;
            await Payout.create({
              bookingId: booking._id,
              educatorId: booking.educatorId,
              studentId: booking.studentId,
              sessionIndex: i,
              amount: halfAmount,
              status: 'completed',
              method: 'internal',
              processedAt: new Date(),
              meta: { reason: 'half-session payout' }
            });

            // Mark in booking.sessions payout.halfPaid
            await Booking.updateOne(
              { _id: booking._id, 'sessions._id': session._id },
              { $set: { 'sessions.$.payout.halfPaid': true, 'sessions.$.payout.halfPaidAt': new Date(), 'sessions.$.payout.halfAmount': halfAmount } }
            );
          }

          // Check full payout (end of session)
          if ((!session.payout || !session.payout.fullPaid) && now >= endThreshold) {
            // If the booking was still pending (student didn't complete payment), mark it paid now
            if (booking.paymentStatus !== 'paid') {
              try {
                await Booking.updateOne({ _id: booking._id }, { $set: { paymentStatus: 'paid', paymentIntent: booking.paymentIntent || 'manual-settlement' } });
                // reflect on local object for subsequent logic
                booking.paymentStatus = 'paid';
              } catch (err) {
                console.warn('Failed to mark booking paid automatically for booking', booking._id, err);
              }
            }
            // determine already paid (half)
            const halfPaid = session.payout && session.payout.halfPaid;
            const already = halfPaid ? (session.payout.halfAmount || 0) : 0;
            const remaining = Math.round((perSessionAmount - already) * 100) / 100;

            if (remaining > 0) {
              await Payout.create({
                bookingId: booking._id,
                educatorId: booking.educatorId,
                studentId: booking.studentId,
                sessionIndex: i,
                amount: remaining,
                status: 'completed',
                method: 'internal',
                processedAt: new Date(),
                meta: { reason: 'end-session payout' }
              });
            }

            // Mark fullPaid and amount
            await Booking.updateOne(
              { _id: booking._id, 'sessions._id': session._id },
              { $set: { 'sessions.$.payout.fullPaid': true, 'sessions.$.payout.fullPaidAt': new Date(), 'sessions.$.payout.fullAmount': perSessionAmount } }
            );

            // Mark session status completed (optional)
            await Booking.updateOne(
              { _id: booking._id, 'sessions._id': session._id },
              { $set: { 'sessions.$.status': 'completed' } }
            );
          }
        }
      }
    } catch (err) {
      console.error('Error in payouts job:', err);
    }
  }, CHECK_INTERVAL_MS);

  return () => clearInterval(timer);
}

export default startPayoutsJob;
