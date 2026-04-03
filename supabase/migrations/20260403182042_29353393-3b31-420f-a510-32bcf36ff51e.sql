
-- Audit trigger for roles table
CREATE TRIGGER audit_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('rol');

-- For rol_permisos we need a workaround since it has a composite PK and no 'id' column
-- The audit_log_trigger_fn expects NEW.id / OLD.id, so we skip audit on this junction table
-- (changes are tracked implicitly via the roles audit + the edge function logs)
