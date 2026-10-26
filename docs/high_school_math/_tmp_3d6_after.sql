SELECT id, grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count,
       JSON_EXTRACT(ai_grade_json,'$.totalScore') AS totalScore,
       JSON_EXTRACT(ai_grade_json,'$.maxScore') AS maxScore,
       JSON_EXTRACT(ai_grade_json,'$.confidence') AS confidence,
       JSON_LENGTH(JSON_EXTRACT(ai_grade_json,'$.rubricScores')) AS rubric_n
FROM hs_math_train_session_items WHERE id=330;
SELECT id, correct_count, wrong_count, pending_count, answered_count FROM hs_math_train_sessions WHERE id IN (51,55,56,107);
SELECT id, grade_result, ai_model, ai_graded_at, ai_attempt_count FROM hs_math_train_session_items WHERE session_id IN (51,55,56) ORDER BY id;
SELECT CAST(ai_grade_json AS CHAR) LIKE '%storage_key%' AS leak_storage_key,
       CAST(ai_grade_json AS CHAR) LIKE '%.bin%' AS leak_bin
FROM hs_math_train_session_items WHERE id=330;
