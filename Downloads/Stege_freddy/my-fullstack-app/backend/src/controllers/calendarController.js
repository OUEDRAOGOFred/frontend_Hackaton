const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/**
 * @desc    Démarre l'authentification Google OAuth2
 * @route   GET /api/integrations/google/auth
 */
exports.startAuth = (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar'
    ];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
    res.redirect(url);
};

/**
 * @desc    Callback OAuth2 Google
 * @route   GET /api/integrations/google/callback
 */
exports.handleCallback = async (req, res) => {
    const code = req.query.code;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Stocker les tokens dans la session ou la base si besoin
        res.json({ message: 'Google Calendar connecté', tokens });
    } catch (error) {
        res.status(500).json({ message: 'Erreur OAuth Google', error });
    }
};

/**
 * @desc    Crée un événement dans Google Calendar
 * @route   POST /api/integrations/google/event
 */
exports.createEvent = async (req, res) => {
    try {
        const { summary, description, start, end } = req.body;
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
            summary,
            description,
            start: { dateTime: start },
            end: { dateTime: end }
        };
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });
        res.json({ eventId: response.data.id, htmlLink: response.data.htmlLink });
    } catch (error) {
        res.status(500).json({ message: 'Erreur création événement', error });
    }
};
