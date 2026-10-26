SELECT COUNT(*) AS kp_total FROM hs_math_knowledge_points;
SELECT COUNT(*) AS drawable FROM hs_math_train_items WHERE pool='formal' AND status='approved' AND is_active=1;
SELECT COUNT(*) AS formal_total FROM hs_math_train_items WHERE pool='formal';
SELECT code FROM hs_math_methods WHERE is_active=1 ORDER BY code;
