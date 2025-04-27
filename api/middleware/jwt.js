// server/middleware/jwt.js
import jwt from "jsonwebtoken";
import createError from "../utils/createError.js";
import User from "../models/user.model.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next(createError(401, "You are not authenticated!"));

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return next(createError(403, "Token is not valid!"));
    req.userId = payload.id;
    req.isEducator = payload.isEducator;
    next();
  });
};

export const educator = (req, res, next) => {
  if (!req.isEducator) {
    return next(createError(403, "You are not authorized as an educator!"));
  }
  next();
};
