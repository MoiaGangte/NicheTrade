import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const isVercelDeployment = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
let callbackURL = process.env.NODE_ENV === 'development' && !isVercelDeployment
  ? process.env.GOOGLE_CLIENT_URL_LOCAL
  : process.env.GOOGLE_CLIENT_URL;

if (!callbackURL && process.env.VERCEL_URL) {
  callbackURL = `https://${process.env.VERCEL_URL}/api/user/google/callback`;
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
      if (!email) return done(new Error('Google sign-in did not return an email address'));

      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email }
        ]
      });

      if (!user) {
        const newUserDetails = studentDetails || {};
        user = await User.create({
          googleId: profile.id,
          name: newUserDetails.name || profile.displayName || email.split('@')[0],
          email,
          department: newUserDetails.department || '',
          registerNumber: newUserDetails.registerNumber || undefined,
          mobileNumber: newUserDetails.mobileNumber || '',
          studentType: newUserDetails.studentType || undefined,
          dateOfBirth: newUserDetails.dateOfBirth || undefined,
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
          name: user.name || studentDetails?.name || profile.displayName || email.split('@')[0],
          department: user.department || studentDetails?.department || '',
          registerNumber: user.registerNumber || studentDetails?.registerNumber || undefined,
          mobileNumber: user.mobileNumber || studentDetails?.mobileNumber || '',
          studentType: user.studentType || studentDetails?.studentType || undefined,
          dateOfBirth: user.dateOfBirth || studentDetails?.dateOfBirth || undefined,
        });
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('[AI Studio] Google OAuth credentials not set — Google sign-in disabled');
}

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
