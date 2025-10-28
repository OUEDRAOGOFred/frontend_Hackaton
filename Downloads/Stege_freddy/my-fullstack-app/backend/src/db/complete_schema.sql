-- ============================================================================
-- SYSTÈME DE SUIVI PÉDAGOGIQUE ET ADMINISTRATIF
-- Base de données MySQL complète et normalisée (3NF)
-- ============================================================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS learning_platform;
USE learning_platform;

-- Configuration pour les clés étrangères
SET foreign_key_checks = 0;

-- ============================================================================
-- 1. TABLES DE RÉFÉRENCE ET CONFIGURATION
-- ============================================================================

-- Table des rôles système
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON, -- Stockage des permissions sous forme JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des types d'activités pédagogiques
CREATE TABLE IF NOT EXISTS activity_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    points_base INT DEFAULT 0, -- Points de base pour la gamification
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des statuts système (réutilisable)
CREATE TABLE IF NOT EXISTS system_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    context VARCHAR(50) NOT NULL, -- 'course', 'assignment', 'group', etc.
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Code couleur hexadécimal
    sort_order INT DEFAULT 0,
    UNIQUE KEY unique_context_name (context, name)
);

-- ============================================================================
-- 2. GESTION DES UTILISATEURS
-- ============================================================================

-- Table principale des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_picture VARCHAR(500),
    
    -- Références
    role_id INT NOT NULL,
    
    -- Métadonnées système
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Gamification
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    badges_earned JSON, -- Stockage des badges obtenus
    
    -- Préférences utilisateur
    notification_preferences JSON, -- email, sms, push, etc.
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'fr',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
);

-- Table des sessions utilisateur (pour gestion avancée)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);

-- ============================================================================
-- 3. STRUCTURE ACADÉMIQUE
-- ============================================================================

-- Table des établissements/campus
CREATE TABLE IF NOT EXISTS institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'France',
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des départements/filières
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20),
    head_teacher_id INT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (head_teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_institution_code (institution_id, code)
);

-- Table des périodes académiques (semestres/années)
CREATE TABLE IF NOT EXISTS academic_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start DATE,
    registration_end DATE,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_current (is_current),
    INDEX idx_dates (start_date, end_date)
);

-- ============================================================================
-- 4. COURS ET PROGRAMMES
-- ============================================================================

-- Table des cours
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    academic_period_id INT NOT NULL,
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    objectives TEXT,
    prerequisites TEXT,
    
    -- Métadonnées pédagogiques
    credits INT DEFAULT 0,
    total_hours INT DEFAULT 0,
    max_students INT DEFAULT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    
    -- Enseignants
    main_teacher_id INT NOT NULL,
    assistant_teachers JSON, -- IDs des enseignants assistants
    
    -- Statut et métadonnées
    status ENUM('draft', 'published', 'active', 'completed', 'archived') DEFAULT 'draft',
    is_mandatory BOOLEAN DEFAULT FALSE,
    allows_late_registration BOOLEAN DEFAULT TRUE,
    
    -- Gamification
    completion_points INT DEFAULT 100,
    participation_points INT DEFAULT 50,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id) ON DELETE RESTRICT,
    FOREIGN KEY (main_teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    UNIQUE KEY unique_period_code (academic_period_id, code),
    INDEX idx_teacher (main_teacher_id),
    INDEX idx_status (status),
    INDEX idx_period (academic_period_id)
);

-- Table des inscriptions aux cours
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Métadonnées d'inscription
    enrollment_type ENUM('regular', 'audit', 'retake') DEFAULT 'regular',
    status ENUM('pending', 'active', 'completed', 'dropped', 'failed') DEFAULT 'pending',
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    
    -- Progression et évaluation
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_grade DECIMAL(5,2) NULL,
    grade_letter VARCHAR(5) NULL,
    points_earned INT DEFAULT 0,
    
    -- Métadonnées
    notes TEXT, -- Notes privées du professeur
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_course_user (course_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_progress (progress_percentage)
);

-- ============================================================================
-- 5. TRAVAUX ET ÉVALUATIONS
-- ============================================================================

-- Table des devoirs/assignments
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Type et configuration
    assignment_type ENUM('individual', 'group', 'peer_review', 'quiz', 'project') DEFAULT 'individual',
    submission_type ENUM('file', 'text', 'url', 'quiz_response') DEFAULT 'file',
    max_file_size INT DEFAULT 10485760, -- 10MB par défaut
    allowed_file_types JSON, -- ['pdf', 'doc', 'zip', etc.]
    
    -- Dates importantes
    published_at TIMESTAMP NULL,
    due_date TIMESTAMP NOT NULL,
    late_submission_allowed BOOLEAN DEFAULT TRUE,
    late_penalty_per_day DECIMAL(5,2) DEFAULT 5.00,
    
    -- Évaluation
    max_points DECIMAL(8,2) NOT NULL DEFAULT 100.00,
    rubric JSON, -- Grille d'évaluation structurée
    auto_grade BOOLEAN DEFAULT FALSE,
    peer_review_required BOOLEAN DEFAULT FALSE,
    min_peer_reviews INT DEFAULT 2,
    
    -- Statut
    status ENUM('draft', 'published', 'active', 'closed', 'graded') DEFAULT 'draft',
    is_visible BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- Table des soumissions
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    user_id INT NOT NULL,
    group_id INT NULL, -- Pour les travaux de groupe
    
    -- Contenu de la soumission
    submission_text TEXT,
    file_paths JSON, -- Chemins vers les fichiers soumis
    submission_url VARCHAR(500),
    
    -- Métadonnées
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    late_days INT DEFAULT 0,
    attempt_number INT DEFAULT 1,
    
    -- Évaluation
    grade DECIMAL(8,2) NULL,
    feedback TEXT,
    graded_by INT NULL,
    graded_at TIMESTAMP NULL,
    
    -- Statut
    status ENUM('submitted', 'under_review', 'graded', 'returned', 'resubmission_required') DEFAULT 'submitted',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_assignment_user_attempt (assignment_id, user_id, attempt_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
);

-- ============================================================================
-- 6. TRAVAIL DE GROUPE
-- ============================================================================

-- Table des groupes
CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    
    -- Informations de base
    name VARCHAR(200) NOT NULL,
    description TEXT,
    group_type ENUM('study', 'project', 'discussion', 'peer_review') DEFAULT 'project',
    
    -- Configuration
    max_members INT DEFAULT 6,
    is_public BOOLEAN DEFAULT FALSE,
    join_approval_required BOOLEAN DEFAULT FALSE,
    
    -- Leadership
    leader_id INT NULL,
    co_leaders JSON, -- IDs des co-leaders
    
    -- Statut
    status ENUM('forming', 'active', 'completed', 'disbanded') DEFAULT 'forming',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course (course_id),
    INDEX idx_status (status)
);

-- Table des membres de groupe
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Rôle dans le groupe
    role ENUM('member', 'leader', 'co_leader') DEFAULT 'member',
    
    -- Métadonnées
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contribution_score DECIMAL(5,2) DEFAULT 0.00,
    peer_rating DECIMAL(3,2) NULL, -- Note des pairs (1-5)
    
    -- Statut
    status ENUM('pending', 'active', 'inactive', 'removed') DEFAULT 'active',
    
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_group_user (group_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);

-- ============================================================================
-- 7. RENCONTRES ET ÉVÉNEMENTS
-- ============================================================================

-- Table des rencontres/réunions
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NULL,
    group_id INT NULL,
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    description TEXT,
    agenda TEXT,
    
    -- Planification
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP NULL,
    actual_end TIMESTAMP NULL,
    
    -- Type et modalité
    meeting_type ENUM('course', 'group', 'office_hours', 'evaluation', 'administrative') DEFAULT 'course',
    modality ENUM('online', 'physical', 'hybrid') DEFAULT 'online',
    
    -- Lieu/Plateforme
    location VARCHAR(300), -- Salle physique ou lien de visioconférence
    platform VARCHAR(100), -- Teams, Zoom, etc.
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    passcode VARCHAR(100),
    
    -- Configuration
    max_participants INT DEFAULT NULL,
    recording_enabled BOOLEAN DEFAULT FALSE,
    attendance_mandatory BOOLEAN DEFAULT FALSE,
    
    -- Organisateur
    organizer_id INT NOT NULL,
    
    -- Statut
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed') DEFAULT 'scheduled',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_course (course_id),
    INDEX idx_group (group_id),
    INDEX idx_scheduled_start (scheduled_start),
    INDEX idx_status (status)
);

-- Table des participants aux réunions
CREATE TABLE IF NOT EXISTS meeting_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Participation
    invitation_status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    attendance_status ENUM('absent', 'present', 'late', 'left_early') NULL,
    
    -- Métadonnées de participation
    joined_at TIMESTAMP NULL,
    left_at TIMESTAMP NULL,
    participation_duration INT DEFAULT 0, -- en minutes
    participation_quality ENUM('excellent', 'good', 'fair', 'poor') NULL,
    
    -- Notes
    notes TEXT, -- Notes prises par le participant
    instructor_notes TEXT, -- Notes de l'instructeur sur ce participant
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_meeting_user (meeting_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_attendance (attendance_status)
);

-- ============================================================================
-- 8. SYSTÈME DE GAMIFICATION
-- ============================================================================

-- Table des types de jetons/points
CREATE TABLE IF NOT EXISTS token_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100), -- Nom de l'icône ou emoji
    base_value INT DEFAULT 1,
    is_transferable BOOLEAN DEFAULT FALSE,
    expiration_days INT DEFAULT NULL, -- NULL = pas d'expiration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des transactions de jetons
CREATE TABLE IF NOT EXISTS token_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_type_id INT NOT NULL,
    
    -- Transaction details
    amount INT NOT NULL, -- Peut être négatif pour les dépenses
    transaction_type ENUM('earned', 'spent', 'transferred', 'expired', 'penalty') NOT NULL,
    
    -- Source/Contexte
    source_type ENUM('assignment', 'participation', 'achievement', 'peer_review', 'attendance', 'manual') NOT NULL,
    source_id INT NULL, -- ID de l'objet source (assignment_id, meeting_id, etc.)
    
    -- Métadonnées
    description TEXT,
    expires_at TIMESTAMP NULL,
    processed_by INT NULL, -- Pour les attributions manuelles
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (token_type_id) REFERENCES token_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_type (token_type_id),
    INDEX idx_source (source_type, source_id),
    INDEX idx_created_at (created_at)
);

-- Table des achievements/badges
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    
    -- Conditions d'obtention
    criteria JSON, -- Conditions structurées pour l'obtention
    points_reward INT DEFAULT 0,
    is_repeatable BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    category VARCHAR(100), -- 'academic', 'social', 'participation', etc.
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des achievements obtenus
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    
    -- Métadonnées d'obtention
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_data JSON, -- Données de progression vers cet achievement
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user (user_id),
    INDEX idx_earned_at (earned_at)
);

-- ============================================================================
-- 9. SYSTÈME DE NOTIFICATIONS
-- ============================================================================

-- Table des modèles de notifications
CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    
    -- Contenu du template
    subject_template TEXT,
    email_template TEXT,
    sms_template TEXT,
    push_template TEXT,
    
    -- Configuration
    channels JSON, -- ['email', 'sms', 'push', 'in_app']
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Délais et conditions
    default_delay_minutes INT DEFAULT 0,
    conditions JSON, -- Conditions d'envoi
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NULL,
    
    -- Contenu
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    
    -- Type et canal
    notification_type ENUM('info', 'warning', 'success', 'error', 'reminder') DEFAULT 'info',
    channels JSON, -- Canaux utilisés pour cette notification
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Contexte
    context_type VARCHAR(50), -- 'assignment', 'meeting', 'course', etc.
    context_id INT NULL,
    
    -- Planification
    scheduled_for TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    
    -- Statut de livraison
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled') DEFAULT 'pending',
    delivery_status JSON, -- Statut par canal
    
    -- Interaction utilisateur
    read_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_scheduled (scheduled_for),
    INDEX idx_status (status),
    INDEX idx_context (context_type, context_id)
);

-- ============================================================================
-- 10. SYSTÈME D'ANALYTIQUES ET LOGS
-- ============================================================================

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'course', 'assignment', etc.
    entity_id INT NULL,
    
    -- Détails
    description TEXT,
    metadata JSON, -- Données supplémentaires
    
    -- Contexte technique
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- Table des métriques de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NULL,
    
    -- Période de mesure
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Métriques académiques
    assignments_submitted INT DEFAULT 0,
    assignments_on_time INT DEFAULT 0,
    average_grade DECIMAL(5,2) NULL,
    participation_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Métriques d'engagement
    login_count INT DEFAULT 0,
    total_time_spent INT DEFAULT 0, -- en minutes
    forum_posts INT DEFAULT 0,
    peer_reviews_given INT DEFAULT 0,
    
    -- Métriques de gamification
    points_earned INT DEFAULT 0,
    achievements_unlocked INT DEFAULT 0,
    
    -- Prédictions IA (extension future)
    risk_score DECIMAL(5,2) NULL, -- Score de risque d'échec
    engagement_score DECIMAL(5,2) NULL,
    predicted_grade DECIMAL(5,2) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_course_period (user_id, course_id, period_start, period_end),
    INDEX idx_period (period_start, period_end),
    INDEX idx_risk_score (risk_score)
);

-- ============================================================================
-- 11. RÉINSCRIPTIONS ADMINISTRATIVES
-- ============================================================================

-- Table des périodes de réinscription
CREATE TABLE IF NOT EXISTS registration_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_period_id INT NOT NULL,
    
    -- Informations de base
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Dates
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    early_registration_end TIMESTAMP NULL,
    
    -- Configuration
    max_courses_per_student INT DEFAULT 10,
    requires_advisor_approval BOOLEAN DEFAULT FALSE,
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Statut
    status ENUM('upcoming', 'open', 'closed', 'archived') DEFAULT 'upcoming',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (academic_period_id) REFERENCES academic_periods(id) ON DELETE CASCADE,
    INDEX idx_period (academic_period_id),
    INDEX idx_dates (start_date, end_date)
);

-- Table des demandes de réinscription
CREATE TABLE IF NOT EXISTS registration_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    registration_period_id INT NOT NULL,
    
    -- Cours demandés
    requested_courses JSON, -- Array des IDs de cours
    
    -- Statut et validation
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'partially_approved') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    admin_notes TEXT,
    
    -- Paiement
    fees_total DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_reference VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (registration_period_id) REFERENCES registration_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_user_period (user_id, registration_period_id),
    INDEX idx_status (status),
    INDEX idx_payment (payment_status)
);

-- ============================================================================
-- 12. DONNÉES DE RÉFÉRENCE INITIALES
-- ============================================================================

-- Insertion des rôles de base
INSERT INTO roles (name, description, permissions) VALUES
('student', 'Étudiant - Accès aux cours et devoirs', '["course.view", "assignment.submit", "group.join", "notification.receive"]'),
('teacher', 'Professeur - Gestion des cours et évaluations', '["course.manage", "assignment.create", "grade.assign", "group.manage", "meeting.create"]'),
('admin', 'Administrateur - Accès complet au système', '["system.admin", "user.manage", "course.admin", "analytics.view", "notification.send"]'),
('assistant', 'Assistant pédagogique - Support aux cours', '["course.assist", "assignment.grade", "group.moderate", "meeting.assist"]');

-- Insertion des types d'activités
INSERT INTO activity_types (name, description, points_base) VALUES
('lecture', 'Cours magistral', 10),
('tutorial', 'Travaux dirigés', 15),
('lab', 'Travaux pratiques', 20),
('project', 'Projet', 50),
('exam', 'Examen', 100),
('quiz', 'Quiz rapide', 5),
('discussion', 'Discussion de groupe', 5),
('peer_review', 'Évaluation par les pairs', 25);

-- Insertion des statuts système
INSERT INTO system_statuses (context, name, description, color_code, sort_order) VALUES
('course', 'draft', 'Brouillon', '#9E9E9E', 1),
('course', 'published', 'Publié', '#2196F3', 2),
('course', 'active', 'Actif', '#4CAF50', 3),
('course', 'completed', 'Terminé', '#FF9800', 4),
('course', 'archived', 'Archivé', '#607D8B', 5),
('assignment', 'draft', 'Brouillon', '#9E9E9E', 1),
('assignment', 'published', 'Publié', '#2196F3', 2),
('assignment', 'active', 'Actif', '#4CAF50', 3),
('assignment', 'closed', 'Fermé', '#FF9800', 4),
('assignment', 'graded', 'Noté', '#9C27B0', 5);

-- Insertion des types de jetons
INSERT INTO token_types (name, description, icon, base_value, is_transferable) VALUES
('participation', 'Points de participation', '🎯', 1, FALSE),
('achievement', 'Points de réussite', '🏆', 5, FALSE),
('collaboration', 'Points de collaboration', '🤝', 3, TRUE),
('excellence', 'Points d\'excellence', '⭐', 10, FALSE),
('help', 'Points d\'entraide', '🆘', 2, TRUE);

-- Insertion des modèles de notifications de base
INSERT INTO notification_templates (name, description, subject_template, email_template, channels, priority) VALUES
('assignment_due_reminder', 'Rappel d\'échéance de devoir', 'Rappel: {{assignment_title}} - Échéance dans {{days}} jours', 'Bonjour {{user_name}},\n\nVotre devoir "{{assignment_title}}" est à rendre le {{due_date}}.\n\nCordialement,\nL\'équipe pédagogique', '["email", "in_app"]', 'normal'),
('meeting_reminder', 'Rappel de réunion', 'Rappel: {{meeting_title}} - {{meeting_date}}', 'Bonjour {{user_name}},\n\nRappel de votre réunion "{{meeting_title}}" prévue le {{meeting_date}} à {{meeting_time}}.\n\nLien: {{meeting_url}}\n\nCordialement', '["email", "push"]', 'high'),
('grade_published', 'Note publiée', 'Nouvelle note disponible', 'Bonjour {{user_name}},\n\nVotre note pour "{{assignment_title}}" est maintenant disponible.\n\nNote: {{grade}}/{{max_points}}\n\nCordialement', '["email", "in_app"]', 'normal');

-- Réactivation des clés étrangères
SET foreign_key_checks = 1;

-- ============================================================================
-- INDEX SUPPLÉMENTAIRES POUR LES PERFORMANCES
-- ============================================================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_course_enrollments_progress ON course_enrollments(course_id, progress_percentage);
CREATE INDEX idx_assignments_course_due ON assignments(course_id, due_date);
CREATE INDEX idx_submissions_assignment_status ON submissions(assignment_id, status);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_meetings_course_date ON meetings(course_id, scheduled_start);
CREATE INDEX idx_token_transactions_user_date ON token_transactions(user_id, created_at);

-- ============================================================================
-- VUES UTILES POUR L'APPLICATION
-- ============================================================================

-- Vue pour le tableau de bord étudiant
CREATE VIEW student_dashboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.total_points,
    u.current_level,
    COUNT(DISTINCT ce.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN s.status = 'submitted' THEN s.id END) as submitted_assignments,
    COUNT(DISTINCT CASE WHEN n.status = 'pending' THEN n.id END) as unread_notifications,
    AVG(ce.progress_percentage) as average_progress
FROM users u
LEFT JOIN course_enrollments ce ON u.id = ce.user_id AND ce.status = 'active'
LEFT JOIN assignments a ON ce.course_id = a.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND u.id = s.user_id
LEFT JOIN notifications n ON u.id = n.user_id
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
GROUP BY u.id;

-- Vue pour les statistiques de cours
CREATE VIEW course_statistics AS
SELECT 
    c.id as course_id,
    c.title,
    c.code,
    COUNT(DISTINCT ce.user_id) as enrolled_students,
    COUNT(DISTINCT a.id) as total_assignments,
    AVG(ce.progress_percentage) as average_progress,
    COUNT(DISTINCT m.id) as total_meetings,
    COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_submissions
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'active'
LEFT JOIN assignments a ON c.id = a.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id
LEFT JOIN meetings m ON c.id = m.course_id
GROUP BY c.id;

-- ============================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

/*
STRUCTURE ET CONCEPTION:

1. NORMALISATION: La base est conçue en 3NF pour éviter la redondance
2. EXTENSIBILITÉ: Structure modulaire permettant l'ajout de fonctionnalités
3. PERFORMANCE: Index optimisés pour les requêtes fréquentes
4. SÉCURITÉ: Contraintes d'intégrité et gestion des permissions
5. GAMIFICATION: Système complet de points, achievements et classements
6. ANALYTIQUES: Tables dédiées aux métriques et logs pour l'IA prédictive
7. NOTIFICATIONS: Système multicanal avec templates personnalisables
8. FLEXIBILITÉ: Utilisation de JSON pour les données semi-structurées

POINTS CLÉS:
- Support complet de la gamification avec points, badges et classements
- Gestion avancée des groupes et travail collaboratif
- Système de notifications multi-canal (email, SMS, push, in-app)
- Architecture prête pour l'IA prédictive et l'analytics
- Gestion complète des réinscriptions administratives
- Support des réunions physiques et virtuelles
- Conformité RGPD avec gestion des consentements
- Système de logs complet pour l'audit et le debug

Cette structure supporte tous les aspects du cahier des charges et permet
une évolution future vers des fonctionnalités d'IA et d'analytics avancées.
*/