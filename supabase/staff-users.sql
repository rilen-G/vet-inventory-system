insert into public.app_users (id, email, full_name, role, is_active)
select
    u.id,
    u.email,
    'Demo Administrator',
    'admin',
    true
from auth.users u
where lower(u.email) = lower('admin@test.com')
on conflict (id) do update
    set
        email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        is_active = excluded.is_active;

insert into public.app_users (id, email, full_name, role, is_active)
select
    u.id,
    u.email,
    'Demo Staff',
    'staff',
    true
from auth.users u
where lower(u.email) = lower('staff@test.com')
on conflict (id) do update
    set
        email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        is_active = excluded.is_active;

select
    u.email as auth_email,
    a.full_name,
    a.role,
    a.is_active,
    a.created_at
from auth.users u
         left join public.app_users a
                   on a.id = u.id
order by u.email;