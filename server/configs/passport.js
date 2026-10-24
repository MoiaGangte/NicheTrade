import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const isVercelDeployment = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const callbackURL = process.env.NODE_ENV === 'development' && !isVercelDeployment
  ? process.env.GOOGLE_CLIENT_URL_LOCAL
  : process.env.GOOGLE_CLIENT_URL;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  passReqToCallback: true,
  callbackURL
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const studentDetails = req.session?.googleStudentDetails;
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google sign-in requires complete student information'));
      }

      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email }
        ]
      });

      const hasCompleteStudentDetails = user && ['department', 'registerNumber', 'mobileNumber', 'studentType', 'dateOfBirth']
        .every((field) => user[field]);
      if (!studentDetails && !hasCompleteStudentDetails) {
        return done(new Error('Google sign-in requires complete student information'));
      }

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: studentDetails.name,
          email,
          department: studentDetails.department,
          registerNumber: studentDetails.registerNumber,
          mobileNumber: studentDetails.mobileNumber,
          studentType: studentDetails.studentType,
          dateOfBirth: studentDetails.dateOfBirth,
          cartItems: {},
          favorites: {}
        });
      } else if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }

      const missingStudentDetails = ['department', 'registerNumber', 'mobileNumber', 'studentType', 'dateOfBirth']
        .some((field) => !user[field]);
      if (missingStudentDetails) {
        user.set({
          name: user.name || studentDetails.name,
          department: user.department || studentDetails.department,
          registerNumber: user.registerNumber || studentDetails.registerNumber,
          mobileNumber: user.mobileNumber || studentDetails.mobileNumber,
          studentType: user.studentType || studentDetails.studentType,
          dateOfBirth: user.dateOfBirth || studentDetails.dateOfBirth,
        });
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
