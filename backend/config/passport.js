import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Caller from '../models/Caller.js';

console.log('Passport Config - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Passport Config - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***exists***' : 'MISSING');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:4000/api/auth/google/callback"
  },
  async(accessToken, refreshToken, profile, cb) => {
    try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;

        // try to find existing caller by googleId first
        let caller = await Caller.findOne({ googleId });

        // if not found by googleId, try by email (caller may have registered before linking Google)
        if (!caller && email) {
            caller = await Caller.findOne({ email });
            if (caller) {
                // update existing caller with googleId and avatar
                caller.googleId = googleId;
                caller.avatar = profile.photos?.[0]?.value || caller.avatar;
                caller.isVerified = true;
                await caller.save();
                return cb(null, caller);
            }
        }

        // create new caller if neither googleId nor email match
        if (!caller) {
            // Generate unique callerId
            const callerCount = await Caller.countDocuments();
            const callerId = `CALLER${String(callerCount + 1).padStart(3, '0')}`;
            
            caller = await Caller.create({
                callerId,
                googleId,
                name: profile.displayName || 'Google User',
                email,
                avatar: profile.photos?.[0]?.value,
                isVerified: true,
                role: 'caller'
            });
        }

        return cb(null, caller);
    } catch (error) {
        return cb(error, null);
    }
  }
));

export default passport;