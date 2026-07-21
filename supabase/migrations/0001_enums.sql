-- 0001_enums.sql — enum types (docs/03-DATABASE §3)
create type user_role as enum ('super_admin','school_admin','teacher','parent');
create type gender as enum ('male','female','other');
create type enrollment_status as enum ('active','inactive','graduated','withdrawn','transferred');
create type attendance_status as enum ('present','absent','late');
create type announcement_audience as enum ('everyone','parents','teachers');
create type guardian_relationship as enum ('mother','father','guardian','other');
create type inquiry_status as enum ('new','reviewing','accepted','rejected','converted');
create type invoice_status as enum ('unpaid','partial','paid');
create type payment_method as enum ('cash','bank_transfer','mobile_money','cheque','other');
