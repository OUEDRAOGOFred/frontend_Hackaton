/**
 * Contrôleur iCalendar - Génération de fichiers .ics pour Google Calendar, Outlook, etc.
 * Compatible avec tous les calendriers (pas besoin d'OAuth)
 */

/**
 * @desc    Génère un fichier .ics pour une session synchrone
 * @route   GET /api/calendar/session/:sessionId/ics
 */
exports.generateSessionICS = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Récupérer la session depuis la DB
        const session = synchronousSessionsDB.find(s => s.id === parseInt(sessionId));
        
        if (!session) {
            return res.status(404).json({ message: 'Session non trouvée' });
        }

        // Calculer la durée depuis startTime et endTime
        const startDate = new Date(session.startTime || session.scheduledDate);
        const endDate = new Date(session.endTime);
        const durationMinutes = session.duration || Math.round((endDate - startDate) / 60000) || 60;

        const ics = generateICSContent({
            title: session.title,
            description: session.description || `Session pour le cours: ${session.course?.name || 'N/A'}`,
            location: session.meetingLink || 'En ligne',
            startDate: startDate,
            duration: durationMinutes,
            url: session.meetingLink
        });

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}.ics"`);
        res.send(ics);
    } catch (error) {
        console.error('❌ Erreur génération ICS:', error);
        res.status(500).json({ message: 'Erreur génération fichier calendrier', error: error.message });
    }
};

/**
 * @desc    Génère un fichier .ics pour un assignment
 * @route   GET /api/calendar/assignment/:assignmentId/ics
 */
exports.generateAssignmentICS = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        
        // Récupérer l'assignment depuis la DB
        const assignment = assignmentsDB.find(a => a.id === parseInt(assignmentId));
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment non trouvé' });
        }

        const course = coursesDB.find(c => c.id === assignment.courseId);
        
        const ics = generateICSContent({
            title: `📚 À rendre: ${assignment.title}`,
            description: `${assignment.description}\n\nCours: ${course?.name || 'N/A'}\nPoints: ${assignment.points}`,
            location: 'Plateforme en ligne',
            startDate: new Date(assignment.dueDate),
            duration: 15, // Rappel de 15 minutes
            url: `http://localhost:3000/assignments`,
            isReminder: true
        });

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="assignment-${assignmentId}.ics"`);
        res.send(ics);
    } catch (error) {
        console.error('❌ Erreur génération ICS:', error);
        res.status(500).json({ message: 'Erreur génération fichier calendrier', error: error.message });
    }
};

/**
 * @desc    Génère un fichier .ics pour tous les événements d'un étudiant
 * @route   GET /api/calendar/student/:studentId/ics
 */
exports.generateStudentCalendarICS = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Récupérer toutes les sessions et assignments de l'étudiant
        const enrollments = enrollmentsDB.filter(e => e.studentId === parseInt(studentId));
        const courseIds = enrollments.map(e => e.courseId);
        
        const sessions = synchronousSessionsDB.filter(s => courseIds.includes(s.courseId));
        const assignments = assignmentsDB.filter(a => courseIds.includes(a.courseId));
        
        let events = [];
        
        // Ajouter les sessions
        sessions.forEach(session => {
            const startDate = new Date(session.startTime || session.scheduledDate);
            const endDate = new Date(session.endTime);
            const durationMinutes = session.duration || Math.round((endDate - startDate) / 60000) || 60;
            
            events.push({
                title: `🎓 ${session.title}`,
                description: session.description || `Session pour le cours: ${session.course?.name || 'N/A'}`,
                location: session.meetingLink || 'En ligne',
                startDate: startDate,
                duration: durationMinutes,
                url: session.meetingLink
            });
        });
        
        // Ajouter les assignments
        assignments.forEach(assignment => {
            const course = coursesDB.find(c => c.id === assignment.courseId);
            events.push({
                title: `📚 À rendre: ${assignment.title}`,
                description: `${assignment.description}\n\nCours: ${course?.name || 'N/A'}`,
                location: 'Plateforme en ligne',
                startDate: new Date(assignment.dueDate),
                duration: 15,
                url: `http://localhost:3000/assignments`,
                isReminder: true
            });
        });
        
        const ics = generateMultipleEventsICS(events);
        
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="mon-calendrier.ics"`);
        res.send(ics);
    } catch (error) {
        console.error('❌ Erreur génération calendrier complet:', error);
        res.status(500).json({ message: 'Erreur génération calendrier', error: error.message });
    }
};

/**
 * Génère le contenu d'un fichier .ics pour un seul événement
 */
function generateICSContent({ title, description, location, url, startDate, duration, isReminder = false }) {
    const endDate = new Date(startDate.getTime() + duration * 60000); // Ajouter la durée
    
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Fonction pour échapper les caractères spéciaux iCalendar
    const escapeText = (text) => {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')  // Échapper les backslashes
            .replace(/;/g, '\\;')     // Échapper les points-virgules
            .replace(/,/g, '\\,')     // Échapper les virgules
            .replace(/\n/g, '\\n');   // Remplacer les retours à la ligne
    };
    
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@plateforme.edu`;
    const timestamp = formatDate(new Date());
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Plateforme Educative//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Plateforme Educative',
        'X-WR-TIMEZONE:Africa/Ouagadougou',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${escapeText(title)}`,
        `DESCRIPTION:${escapeText(description)}`,
        `LOCATION:${escapeText(location)}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE'
    ];
    
    if (url) {
        icsContent.push(`URL:${url}`);
    }
    
    // Ajouter des alarmes/rappels
    if (isReminder) {
        // Rappel 48h avant
        icsContent.push('BEGIN:VALARM');
        icsContent.push('TRIGGER:-P2D');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push(`DESCRIPTION:Rappel: ${title} dans 2 jours`);
        icsContent.push('END:VALARM');
        
        // Rappel 24h avant
        icsContent.push('BEGIN:VALARM');
        icsContent.push('TRIGGER:-P1D');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push(`DESCRIPTION:Rappel: ${title} demain`);
        icsContent.push('END:VALARM');
    } else {
        // Pour les sessions: rappel 24h et 1h avant
        icsContent.push('BEGIN:VALARM');
        icsContent.push('TRIGGER:-P1D');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push(`DESCRIPTION:Rappel: ${title} demain`);
        icsContent.push('END:VALARM');
        
        icsContent.push('BEGIN:VALARM');
        icsContent.push('TRIGGER:-PT1H');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push(`DESCRIPTION:Rappel: ${title} dans 1 heure`);
        icsContent.push('END:VALARM');
    }
    
    icsContent.push('END:VEVENT');
    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
}

/**
 * Génère le contenu d'un fichier .ics pour plusieurs événements
 */
function generateMultipleEventsICS(events) {
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Plateforme Educative//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Mon Calendrier - Plateforme Educative',
        'X-WR-TIMEZONE:Africa/Ouagadougou',
        'X-WR-CALDESC:Calendrier complet avec sessions et assignments'
    ];
    
    events.forEach((event, index) => {
        const endDate = new Date(event.startDate.getTime() + event.duration * 60000);
        const uid = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}@plateforme.edu`;
        const timestamp = formatDate(new Date());
        
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${uid}`);
        icsContent.push(`DTSTAMP:${timestamp}`);
        icsContent.push(`DTSTART:${formatDate(event.startDate)}`);
        icsContent.push(`DTEND:${formatDate(endDate)}`);
        icsContent.push(`SUMMARY:${event.title}`);
        icsContent.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
        icsContent.push(`LOCATION:${event.location}`);
        icsContent.push('STATUS:CONFIRMED');
        
        if (event.url) {
            icsContent.push(`URL:${event.url}`);
        }
        
        // Ajouter alarme
        if (event.isReminder) {
            icsContent.push('BEGIN:VALARM');
            icsContent.push('TRIGGER:-P1D');
            icsContent.push('ACTION:DISPLAY');
            icsContent.push(`DESCRIPTION:Rappel: ${event.title} demain`);
            icsContent.push('END:VALARM');
        } else {
            icsContent.push('BEGIN:VALARM');
            icsContent.push('TRIGGER:-PT1H');
            icsContent.push('ACTION:DISPLAY');
            icsContent.push(`DESCRIPTION:${event.title} commence dans 1h`);
            icsContent.push('END:VALARM');
        }
        
        icsContent.push('END:VEVENT');
    });
    
    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
}

// Export des databases (à importer depuis server-final.js)
let synchronousSessionsDB, assignmentsDB, coursesDB, enrollmentsDB;

exports.setDatabases = (databases) => {
    synchronousSessionsDB = databases.synchronousSessionsDB;
    assignmentsDB = databases.assignmentsDB;
    coursesDB = databases.coursesDB;
    enrollmentsDB = databases.enrollmentsDB;
};

module.exports = exports;
