import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Caller from '../models/Caller.js';

const modelMap = {
    user: User,
    admin: Admin,
    superadmin: Admin,  // Superadmin uses Admin model
    uploader: Admin,    // Uploader uses Admin model
    caller: Caller
};

const getUserModel = (role) => modelMap[role] || null;

export default getUserModel;
