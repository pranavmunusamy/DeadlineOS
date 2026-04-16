const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { getAuthUrl, getTokens, createAuthenticatedClient } = require('../config/google');
const User = require('../models/User');

const getGoogleLoginUrl = (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: 'Failed to generate login URL' });
  }
};

const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    const tokens = await getTokens(code);
    const authClient = createAuthenticatedClient(tokens);

    // Fetch user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
    const { data: profile } = await oauth2.userinfo.get();

    // Upsert user
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      user.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || user.googleTokens.refresh_token,
        expiry_date: tokens.expiry_date,
      };
      user.name = profile.name;
      user.picture = profile.picture || '';
      await user.save();
    } else {
      user = await User.create({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture || '',
        googleTokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
        },
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      lastEmailSync: user.lastEmailSync,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

module.exports = { getGoogleLoginUrl, handleGoogleCallback, getProfile };
