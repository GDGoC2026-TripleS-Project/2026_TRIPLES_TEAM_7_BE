// config/firebaseConfig.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const saPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!admin.apps.length) {
  if (fs.existsSync(saPath)) {
    const serviceAccount = require(saPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[firebase] initialized');
  } else {
    console.warn('[firebase] init skipped: missing firebase-service-account.json');
  }
}

module.exports = admin;
