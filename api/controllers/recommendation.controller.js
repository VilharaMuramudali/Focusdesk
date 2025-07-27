import Activity from "../models/activity.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";

export const recommendTutors = async (req, res, next) => {
  try {
    const studentId = req.userId;
    // Find most viewed or searched subjects
    const activities = await Activity.find({ studentId });
    const subjectCounts = {};
    activities.forEach(a => {
      if (a.subject) subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
      if (a.details && a.details.query) subjectCounts[a.details.query] = (subjectCounts[a.details.query] || 0) + 1;
    });
    const topSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([subject]) => subject);

    // Find tutors who teach these subjects
    const tutors = await User.find({
      isEducator: true,
      expertise: { $in: topSubjects }
    }).select("username expertise img");

    res.json({ recommendedTutors: tutors, topSubjects });
  } catch (err) {
    next(createError(500, "Failed to recommend tutors"));
  }
};

export const recommendWorkPlan = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const activities = await Activity.find({ studentId });
    const subjectCounts = {};
    activities.forEach(a => {
      if (a.subject) subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
      if (a.details && a.details.query) subjectCounts[a.details.query] = (subjectCounts[a.details.query] || 0) + 1;
    });
    const sortedSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([subject]) => subject);

    // Simple plan: suggest 2 sessions/week for top 2 subjects
    const plan = sortedSubjects.slice(0, 2).map(subject => ({
      subject,
      sessionsPerWeek: 2
    }));

    res.json({ plan });
  } catch (err) {
    next(createError(500, "Failed to recommend work plan"));
  }
}; 