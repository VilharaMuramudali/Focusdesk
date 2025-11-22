import Withdrawal from "../models/withdrawal.model.js";
import Booking from "../models/booking.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

const MINIMUM_WITHDRAWAL_AMOUNT = 50; // Minimum withdrawal amount in default currency

// Get educator's available balance and withdrawal history
export const getWithdrawalInfo = async (req, res, next) => {
  try {
    const educatorId = req.userId;

    // Calculate available balance (paid earnings minus pending/processing withdrawals)
    const paidBookings = await Booking.find({
      educatorId,
      paymentStatus: 'paid'
    });

    const totalEarnings = paidBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Get pending and processing withdrawals
    const pendingWithdrawals = await Withdrawal.find({
      educatorId,
      status: { $in: ['pending', 'processing'] }
    });

    const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    const availableBalance = totalEarnings - totalPendingWithdrawals;

    // Get withdrawal history
    const withdrawals = await Withdrawal.find({ educatorId })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get total withdrawn amount
    const completedWithdrawals = await Withdrawal.find({
      educatorId,
      status: 'completed'
    });

    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        availableBalance,
        totalEarnings,
        totalWithdrawn,
        pendingWithdrawals: totalPendingWithdrawals,
        minimumWithdrawal: MINIMUM_WITHDRAWAL_AMOUNT,
        withdrawals,
        canWithdraw: availableBalance >= MINIMUM_WITHDRAWAL_AMOUNT
      }
    });
  } catch (error) {
    console.error('Error getting withdrawal info:', error);
    next(createError(500, "Failed to get withdrawal information"));
  }
};

// Create withdrawal request
export const createWithdrawal = async (req, res, next) => {
  try {
    const educatorId = req.userId;
    const { amount, currency, paymentMethod, bankDetails, paypalEmail, stripeAccountId, notes } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return next(createError(400, "Invalid withdrawal amount"));
    }

    if (amount < MINIMUM_WITHDRAWAL_AMOUNT) {
      return next(createError(400, `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT}`));
    }

    // Calculate available balance
    const paidBookings = await Booking.find({
      educatorId,
      paymentStatus: 'paid'
    });

    const totalEarnings = paidBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    const pendingWithdrawals = await Withdrawal.find({
      educatorId,
      status: { $in: ['pending', 'processing'] }
    });

    const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const availableBalance = totalEarnings - totalPendingWithdrawals;

    if (amount > availableBalance) {
      return next(createError(400, "Insufficient balance. Available balance is insufficient for this withdrawal."));
    }

    // Validate payment method details
    if (paymentMethod === 'bank_transfer' && (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankName)) {
      return next(createError(400, "Bank account details are required for bank transfer"));
    }

    if (paymentMethod === 'paypal' && !paypalEmail) {
      return next(createError(400, "PayPal email is required"));
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      educatorId,
      amount,
      currency: currency || 'LKR',
      paymentMethod,
      bankDetails: paymentMethod === 'bank_transfer' ? bankDetails : undefined,
      paypalEmail: paymentMethod === 'paypal' ? paypalEmail : undefined,
      stripeAccountId: paymentMethod === 'stripe' ? stripeAccountId : undefined,
      notes,
      status: 'pending'
    });

    await withdrawal.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: withdrawal
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    next(createError(500, "Failed to create withdrawal request"));
  }
};

// Get withdrawal by ID
export const getWithdrawalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const educatorId = req.userId;

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      educatorId
    });

    if (!withdrawal) {
      return next(createError(404, "Withdrawal not found"));
    }

    res.status(200).json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    console.error('Error getting withdrawal:', error);
    next(createError(500, "Failed to get withdrawal"));
  }
};

// Cancel withdrawal request (only if pending)
export const cancelWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const educatorId = req.userId;

    const withdrawal = await Withdrawal.findOne({
      _id: id,
      educatorId
    });

    if (!withdrawal) {
      return next(createError(404, "Withdrawal not found"));
    }

    if (withdrawal.status !== 'pending') {
      return next(createError(400, "Only pending withdrawals can be cancelled"));
    }

    withdrawal.status = 'cancelled';
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal request cancelled successfully",
      data: withdrawal
    });
  } catch (error) {
    console.error('Error cancelling withdrawal:', error);
    next(createError(500, "Failed to cancel withdrawal"));
  }
};

// Get all withdrawals (for admin - optional)
export const getAllWithdrawals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('educatorId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    next(createError(500, "Failed to get withdrawals"));
  }
};

