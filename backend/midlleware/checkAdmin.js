import { User } from "../model/user.model.js";

export const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied or not found" });
    }

    next();
  } catch (error) {
    console.log("Error in checkAdmin ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
