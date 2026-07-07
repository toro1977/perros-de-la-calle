-- ============================================================
-- Indexes — performance and PostGIS spatial queries
-- ============================================================

-- PostGIS spatial index (used by match suggestions via ST_DWithin)
create index dog_posts_location_gix on public.dog_posts using gist (location);

-- Dog posts: frequent filters
create index dog_posts_user_id_idx on public.dog_posts (user_id);
create index dog_posts_type_status_idx on public.dog_posts (type, status);

-- Adoption dogs: by shelter and status
create index adoption_dogs_shelter_id_idx on public.adoption_dogs (shelter_id);
create index adoption_dogs_status_idx on public.adoption_dogs (status);

-- Match suggestions: lookup by either post, and by status
create index match_suggestions_lost_post_id_idx on public.match_suggestions (lost_post_id);
create index match_suggestions_found_post_id_idx on public.match_suggestions (found_post_id);
create index match_suggestions_status_idx on public.match_suggestions (status);

-- Reports: moderation queue by status
create index reports_status_idx on public.reports (status);

-- Donations: by shelter, donor and status
create index donations_shelter_id_idx on public.donations (shelter_id);
create index donations_donor_id_idx on public.donations (donor_id);
create index donations_status_idx on public.donations (status);

-- Notifications: by user + status
create index push_notifications_user_id_status_idx
  on public.push_notifications (user_id, status);
