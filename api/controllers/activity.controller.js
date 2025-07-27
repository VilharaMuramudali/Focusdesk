import Activity from "../models/activity.model.js";
import createError from "../utils/createError.js";

export const logActivity = async (req, res, next) => {
  try {
    const activity = new Activity({
      studentId: req.userId,
      ...req.body,
      timestamp: new Date()
    });
    await activity.save();
    res.status(201).json({ message: "Activity logged" });
  } catch (err) {
    next(createError(500, "Failed to log activity"));
  }
};

export const getStudentActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ studentId: req.params.studentId });
    res.status(200).json(activities);
  } catch (err) {
    next(createError(500, "Failed to fetch activities"));
  }
}; 