-- Add user_email column to bug_reports table
ALTER TABLE bug_reports 
ADD COLUMN user_email text;