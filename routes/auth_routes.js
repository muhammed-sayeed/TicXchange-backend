import express from 'express';

import {userSignup, verifyUser} from '../controllers/authController.js'
import {validateRegister, validateverify} from '../validators/auth.js'
import { validator } from '../middlwares/validator.js';

const router = express.Router();

router.post('/signup', validateRegister, validator, userSignup);
router.post('/verify', validateverify, validator, verifyUser);

export default router;