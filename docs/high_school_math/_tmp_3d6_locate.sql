SELECT si.id AS session_item_id, si.session_id, si.item_id, si.item_code, si.grade_result, si.grade_reason,
       si.answered_at, si.ai_attempt_count, si.ai_model,
       s.user_id, s.status AS session_status, s.created_at AS session_created, s.submitted_at,
       s.planned_count, s.actual_count, s.difficulty, s.category_id,
       CAST(si.user_answer_payload_json AS CHAR) AS answer_json
FROM hs_math_train_session_items si
JOIN hs_math_train_sessions s ON s.id = si.session_id
WHERE s.user_id = 2 AND si.item_id = 151 AND si.grade_result = 'review_required'
ORDER BY si.id DESC
LIMIT 10;
