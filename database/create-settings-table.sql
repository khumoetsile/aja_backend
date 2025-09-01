-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
    density VARCHAR(20) DEFAULT 'comfortable' CHECK (density IN ('comfortable', 'compact')),
    start_time TIME DEFAULT '08:00',
    end_time TIME DEFAULT '17:00',
    remember_filters BOOLEAN DEFAULT true,
    weekly_reminder BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Insert comment
COMMENT ON TABLE user_settings IS 'User preference settings for the timesheet application';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference (light/dark)';
COMMENT ON COLUMN user_settings.density IS 'UI density preference (comfortable/compact)';
COMMENT ON COLUMN user_settings.start_time IS 'Default workday start time';
COMMENT ON COLUMN user_settings.end_time IS 'Default workday end time';
COMMENT ON COLUMN user_settings.remember_filters IS 'Whether to remember dashboard filter settings';
COMMENT ON COLUMN user_settings.weekly_reminder IS 'Whether to send weekly timesheet reminders';


