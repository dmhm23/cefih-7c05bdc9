
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.perfiles (id, email, nombres, rol_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'rol_id')::UUID,
      'a0000000-0000-0000-0000-000000000003'
    )
  );
  RETURN NEW;
END;
$function$;
