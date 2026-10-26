SELECT id, session_item_id, user_id, mime_type, size_bytes, sort_order, status, submitted_at, created_at,
       storage_key
FROM hs_math_train_session_item_images
WHERE id IN (25, 26) OR session_item_id = 330
ORDER BY sort_order, id;
