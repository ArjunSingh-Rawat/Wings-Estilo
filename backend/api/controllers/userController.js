const User = require("../models/userModel");

async function generateAccessAndRefereshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      "Something went wrong while generating referesh and access token"
    );
  }
}

async function registerUser(req, res) {
  try {
    const { fullname, email, phonenumber, password } = req.body;
    if (
      [fullname, email, phonenumber, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new Error("All fields are required");
    }

    const existedUser = await User.findOne({
      email,
    });

    if (existedUser) {
      throw new Error("User with email already exists");
    }

    const newUser = await User.create({
      fullname,
      email,
      phonenumber,
      password,
    });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new Error("Something went wrong while registering the user");
    }

    res.status(202).json({
      succsess: true,
      message: "Success!",
      data: createdUser,
    });
  } catch (err) {
    console.log("came", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new Error("email is required");
    }

    const user = await User.findOne({ email }).select(
      "-password -refreshToken"
    );

    if (!user) {
      res.status(400).send("User does not exist");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        succsess: true,
        message: "Success!",
        data: {
          loggedInUser,
          accessToken,
          refreshToken,
        },
      });
  } catch (error) {
    console.log(error);
  }
}

async function logoutUser(req, res) {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .redirect("/");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addToWishlist(req, res) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.user.userid },
      {
        $addToSet: {
          wishList: req.body.productId,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("unable to add to wishlist");
    }

    res.status(202).json({
      succsess: true,
      message: "Success!",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function addToBag(req, res) {
  try {
    const userId = req.user.userid;

    const data = await User.findOneAndUpdate(
      { _id: userId },
      {
        $addToSet: {
          bag: req.body.productId,
        },
      },
      { new: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(202).json({
      succsess: true,
      message: "Success!",
      newItem: data,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

async function getOneUser(req, res) {
  try {
    const user = await User.findOne({ _id: req.params.id }).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json("user not found!");
    }

    res.status(200).json({
      succsess: true,
      message: "success!",
      user,
    });
  } catch (error) {
    res.status(500).json({
      succsess: false,
      message: error.message,
    });
  }
}

module.exports = {
  addToWishlist,
  addToBag,
  loginUser,
  registerUser,
  logoutUser,
  getOneUser,
};
