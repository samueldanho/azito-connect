DELETE FROM notifications WHERE user_id IN ('0d9e22db-2819-4cbe-b381-a08b4f3f10ff', 'a220621b-6622-4e96-bce6-5bb04d01520f');
DELETE FROM user_roles WHERE user_id IN ('0d9e22db-2819-4cbe-b381-a08b4f3f10ff', 'a220621b-6622-4e96-bce6-5bb04d01520f');
DELETE FROM activity_logs WHERE user_id IN ('0d9e22db-2819-4cbe-b381-a08b4f3f10ff', 'a220621b-6622-4e96-bce6-5bb04d01520f');
DELETE FROM profiles WHERE id IN ('0d9e22db-2819-4cbe-b381-a08b4f3f10ff', 'a220621b-6622-4e96-bce6-5bb04d01520f');
DELETE FROM auth.users WHERE id IN ('0d9e22db-2819-4cbe-b381-a08b4f3f10ff', 'a220621b-6622-4e96-bce6-5bb04d01520f');