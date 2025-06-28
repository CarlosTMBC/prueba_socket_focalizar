const express = require('express');
const router = express.Router();
const { verificarCaptcha } = require('../../controladores/ctrCaptcha');

router.post('/verificarCaptcha', verificarCaptcha);

module.exports = router;
