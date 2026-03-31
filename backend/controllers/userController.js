// controllers/userController.js
import express from "express";
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
import jobApplicationModel from "../models/jobApplicationModel.js";
import vacancyModel from "../models/vacancyModel.js";
import { uploadToCloudinary } from "../middlewares/multer.js"; // robust helper

// ---------- API TO REGISTER USER ----------
const registerUser = async (req, res) => {
  try {
    console.log("Registration attempt:", req.body);
    const {
      name,
      email,
      password,
      phone,
      gender,
      dob,
      address,
      pincode,
      city,
      state,
    } = req.body;
    const imageFile = req.file; // multer single upload

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !gender ||
      !dob ||
      !address ||
      !pincode ||
      !city ||
      !state
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle image upload via uploadToCloudinary (supports path or buffer)
    let imageURL = "";
    if (imageFile) {
      try {
        const imageUpload = await uploadToCloudinary(
          imageFile,
          "healwise/profile-images",
          "image"
        );
        imageURL = imageUpload.url || "";
      } catch (imgErr) {
        console.log("Image upload error:", imgErr.message);
        // continue without failing registration - optional behavior
      }
    }

    // Parse address
    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(address);
    } catch {
      parsedAddress = { line1: "", line2: "" };
    }

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      dob,
      address: parsedAddress,
      image: imageURL,
      pincode,
      city,
      state,
    };

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const newUser = new userModel(userData);
    const user = await newUser.save();

    // Create token with consistent id field
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("registerUser error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API FOR USER LOGIN ----------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("loginUser error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO GET USER PROFILE DATA ----------
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log("getProfile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO UPDATE USER PROFILE ----------
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender, pincode, city, state } =
      req.body;
    const imageFile = req.file;

    if (
      !name ||
      !phone ||
      !address ||
      !dob ||
      !gender ||
      !pincode ||
      !city ||
      !state
    ) {
      return res.json({ success: false, message: "Data missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
      pincode,
      city,
      state,
    });

    if (imageFile) {
      try {
        // upload image via helper
        const imageUpload = await uploadToCloudinary(
          imageFile,
          "healwise/profile-images",
          "image"
        );
        const imageURL = imageUpload.url;
        await userModel.findByIdAndUpdate(userId, { image: imageURL });
      } catch (imgErr) {
        console.log("updateProfile image upload error:", imgErr.message);
      }
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log("updateProfile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO BOOK APPOINTMENT ----------
const bookAppointment = async (req, res) => {
  try {
    const { userId, doctorId, slotDate, slotTime } = req.body;

    // Get doctor data
    const docData = await doctorModel.findById(doctorId).select("-password");

    if (!docData || !docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // Check if slot is already booked
    let slots_booked = docData.slots_booked || {};

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [slotTime];
    }

    // Get user data
    const userData = await userModel.findById(userId).select("-password");

    // Create appointment
    const appointmentData = {
      userId,
      docId: doctorId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Update doctor's slots_booked
    await doctorModel.findByIdAndUpdate(doctorId, { slots_booked });

    // Send Email notification to user (best-effort)
    try {
      const sendEmail = (await import("../utils/sendEmail.js")).default;
      if (userData && userData.email) {
        const emailMessage = `Hi ${userData.name}, your appointment with Dr. ${docData.name} on ${slotDate} at ${slotTime} has been booked successfully.`;
        await sendEmail(userData.email, "Appointment Confirmation", emailMessage);
      }
    } catch (emailErr) {
      console.log("Failed to send email notification:", emailErr.message);
    }

    // Send SMS notification to user (best-effort)
    try {
      const sendSMS = (await import("../utils/sendSms.js")).default;
      if (userData && userData.phone) {
        const smsMessage = `Hi ${userData.name}, your appointment with Dr. ${docData.name} on ${slotDate} at ${slotTime} has been booked successfully.`;
        await sendSMS(userData.phone, smsMessage);
      }
    } catch (smsErr) {
      console.log("Failed to send SMS notification:", smsErr.message);
    }

    res.json({ success: true, message: "Appointment booked successfully" });
  } catch (error) {
    console.log("bookAppointment error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO GET USER APPOINTMENT FOR FRONTEND ----------
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log("listAppointment error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO CANCEL APPOINTMENT ----------
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }
    if (String(appointmentData.userId) !== String(userId)) {
      return res.json({ success: false, message: "Unauthorized action" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // making slot available for others
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked || {};
    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e != slotTime);
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    }

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log("cancelAppointment error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- Razorpay setup ----------
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API TO MAKE PAYMENT USING RAZORPAY
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }
    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY || "INR",
      receipt: appointmentId,
    };
    // CREATION OF AN ORDER
    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.log("paymentRazorpay error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API TO VERIFY PAYMENT
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log("verifyRazorpay error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ---------- API TO APPLY FOR VACANCY ----------
const applyToVacancy = async (req, res) => {
  try {
    const { id } = req.params; // vacancy id
    const userId = req?.user?.userId || req.body.userId;
    const { name, email, age, phone, additionalInfo } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Validate vacancy
    const vacancy = await vacancyModel.findById(id);
    if (!vacancy || !vacancy.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Vacancy not found or inactive" });
    }

    if (!name || !email || !age || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Prevent duplicate application
    const existing = await jobApplicationModel.findOne({
      vacancy: vacancy._id,
      user: userId,
    });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You have already applied to this vacancy.",
        });
    }

    const files = req.files || {};
    const profileImageFile = files.profileImage?.[0];
    const resumeFile = files.resume?.[0];

    if (!profileImageFile || !resumeFile) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Profile image and resume are required",
        });
    }

    // Upload files to Cloudinary (profile image as image, resume as raw)
    let profileImageUrl = "";
    let profileImagePublicId = "";
    let resumeUrl = "";
    let resumePublicId = "";

    try {
      // Upload profile image (image)
      const profileResult = await uploadToCloudinary(
        profileImageFile,
        "healwise/profile-images",
        "image"
      );
      profileImageUrl = profileResult.url;
      profileImagePublicId = profileResult.publicId;

      // Upload resume (IMPORTANT: resourceType 'raw')
      const resumeResult = await uploadToCloudinary(
        resumeFile,
        "healwise/resumes",
        "raw"
      );
      resumeUrl = resumeResult.url;
      resumePublicId = resumeResult.publicId;

      console.log("profileResult.raw:", profileResult.raw || profileResult);
      console.log("resumeResult.raw:", resumeResult.raw || resumeResult);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload files to Cloudinary",
      });
    }

    // Create job application with Cloudinary URLs
    let appDoc;
    try {
      appDoc = await jobApplicationModel.create({
        vacancy: vacancy._id,
        user: userId,
        name,
        email,
        age: Number(age),
        phone,
        additionalInfo: additionalInfo || "",
        profileImageUrl,
        profileImagePublicId,
        resumeUrl,
        resumePublicId,
      });
    } catch (e) {
      // Handle race condition hitting unique index
      if (e && e.code === 11000) {
        return res
          .status(409)
          .json({
            success: false,
            message: "You have already applied to this vacancy.",
          });
      }
      throw e;
    }

    return res.status(201).json({ success: true, data: appDoc });
  } catch (err) {
    console.error("applyToVacancy error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------- API TO GET USER'S JOB APPLICATIONS ----------
const myApplications = async (req, res) => {
  try {
    const userId = req?.user?.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const apps = await jobApplicationModel
      .find({ user: userId })
      .populate("vacancy", "specialization location experience vacancies")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: apps });
  } catch (err) {
    console.error("myApplications error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------- API TO STREAM RESUME FROM CLOUDINARY ----------
const streamMyApplicationResume = async (req, res) => {
  try {
    const { id } = req.params; // application id
    const userId = req?.user?.userId || req.body.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const appDoc = await jobApplicationModel.findById(id);
    if (!appDoc || (!appDoc.resumeUrl && !appDoc.resumePublicId)) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }

    if (String(appDoc.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Prefer secure stored URL if available
    if (appDoc.resumeUrl && appDoc.resumeUrl.includes("cloudinary.com")) {
      return res.redirect(appDoc.resumeUrl);
    }

    // Otherwise, build Cloudinary delivery URL using public id (ensure you saved it)
    if (appDoc.resumePublicId) {
      const builtUrl = cloudinary.url(appDoc.resumePublicId, {
        resource_type: "raw",
        secure: true,
      });
      return res.redirect(builtUrl);
    }

    return res.status(400).json({ success: false, message: "Invalid resume URL" });
  } catch (err) {
    console.error("streamMyApplicationResume error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------- Exports ----------
export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  applyToVacancy,
  myApplications,
  streamMyApplicationResume,
};
