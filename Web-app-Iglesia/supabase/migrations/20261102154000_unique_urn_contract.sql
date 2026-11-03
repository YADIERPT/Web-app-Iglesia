-- Una urna solo puede tener un contrato activo porque el modelo no conserva contratos finalizados.
create unique index if not exists urn_contracts_one_active_idx
  on public.urn_contracts (urn_id);
