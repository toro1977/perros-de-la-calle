-- Client now resizes photos to a 1600px max side before upload, but keep
-- some headroom above the old 5 MB cap for edge cases (dense/detailed images
-- that don't compress much, or a resize step that fails and falls back to
-- the original).
update storage.buckets
set file_size_limit = 10485760 -- 10 MB
where id = 'dog-photos';
