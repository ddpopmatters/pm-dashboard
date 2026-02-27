-- Fix Fran's manager assignment: direct manager is Dan, not Jameen.
-- Jameen sees Fran as an indirect report (Jameen → Dan → Fran).
UPDATE user_profiles
SET manager_email = LOWER('daniel.davis@populationmatters.org')
WHERE LOWER(name) = 'francesca harrison'
  AND LOWER(manager_email) = LOWER('Jameen.Kaur@PopulationMatters.org');
