import express from 'express';

import {userSignup, verifyUser, userLogin, googeLogin, refreshAccessToken} from '../controllers/authController.js'
import {validateRegister, validateverify} from '../validators/auth.js'
import { validator } from '../middlwares/validator.js';

const router = express.Router();

router.post('/signup', validateRegister, validator, userSignup);
router.post('/verify', validateverify, validator, verifyUser);
router.post('/login', userLogin);
router.post('/social-login', googeLogin);
router.post('/refresh-token', refreshAccessToken)

export default router;