import User from "../models/user.model.js";
import createError from "../utils/createError.js";

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(createError(404, "User not found!"));
    }

    if (req.userId !== user._id.toString()) {
      return next(createError(403, "You can delete only your account!"));
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: "User has been deleted." });
  } catch (err) {
    next(createError(500, "Failed to delete user."));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(createError(404, "User not found!"));
    }
    
    const { password, ...info } = user._doc;
    res.status(200).send(info);
  } catch (err) {
    next(createError(500, "Failed to retrieve user."));
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "You can update only your account!"));
    }
    
    // Make a copy of req.body to avoid modifying the original
    const updateData = { ...req.body };
    
    // Don't allow direct updates to image fields through this endpoint
    delete updateData.img;
    delete updateData.imgId;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    const { password, ...info } = updatedUser._doc;
    res.status(200).send(info);
  } catch (err) {
    next(createError(500, "Failed to update user."));
  }
};
