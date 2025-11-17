import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async(accessToken, refreshToken, profile, cb) => {
    try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;

        // try to find existing user by googleId first
        let user = await User.findOne({ googleId });

        // if not found by googleId, try by email (user may have registered before linking Google)
        if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
                // update existing user with googleId and avatar
                user.googleId = googleId;
                user.avatar = profile.photos?.[0]?.value || user.avatar;
                await user.save();
                return cb(null, user);
            }
        }

        // create new user if neither googleId nor email match
        if (!user) {
            user = await User.create({
                googleId,
                name: profile.displayName || 'Google User',
                email,
                avatar: profile.photos?.[0]?.value,
            });
        }

        return cb(null, user);
    } catch (error) {
        return cb(error, null);
    }
  }
));

export default passport;