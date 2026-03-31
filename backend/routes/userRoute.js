import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay, applyToVacancy, myApplications, streamMyApplicationResume } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import { uploadImage, uploadJobApplication } from '../middlewares/multer.js'
const userRouter = express.Router()

// User authentication routes
userRouter.post('/register', uploadImage.single('image'), registerUser)
userRouter.post('/login', loginUser)

// User profile routes
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', uploadImage.single('image'), authUser, updateProfile)

// Appointment routes
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)

// Payment routes
userRouter.post('/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/verify-razorpay', authUser, verifyRazorpay)

// Job application routes - using Cloudinary storage
userRouter.post('/vacancies/:id/apply', 
  authUser,
  uploadJobApplication,
  applyToVacancy
)

userRouter.get('/my-applications', authUser, myApplications)
userRouter.get('/applications/:id/resume', authUser, streamMyApplicationResume)

export default userRouter