-- Grant support role access to full user management in admin panel

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('users.read', 'users.create', 'users.update', 'users.delete')
where r.slug = 'support'
on conflict (role_id, permission_id) do nothing;
