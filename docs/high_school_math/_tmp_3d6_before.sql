SELECT id, grade_result, ai_model, ai_graded_at, ai_attempt_count FROM hs_math_train_session_items WHERE session_id IN (51,55,56) ORDER BY id;
SELECT id, correct_count, wrong_count, pending_count FROM hs_math_train_sessions WHERE id IN (51,55,56,107);
SELECT id, grade_result, grade_reason, ai_model, ai_graded_at, ai_attempt_count FROM hs_math_train_session_items WHERE id=330;
