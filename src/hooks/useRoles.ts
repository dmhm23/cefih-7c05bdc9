import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesService } from "@/services/rolesService";
import { useToast } from "@/hooks/use-toast";

export const useRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesService.getAll(),
  });

  const usuariosQuery = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: () => rolesService.getUsuarios(),
  });

  const permisosQuery = (rolId: string) =>
    useQuery({
      queryKey: ["rol-permisos", rolId],
      queryFn: () => rolesService.getPermisos(rolId),
      enabled: !!rolId,
    });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
    queryClient.invalidateQueries({ queryKey: ["rol-permisos"] });
  };

  const createRol = useMutation({
    mutationFn: (data: { nombre: string; descripcion: string; permisos: { modulo: string; accion: string }[] }) =>
      rolesService.createRol(data.nombre, data.descripcion, data.permisos),
    onSuccess: () => {
      toast({ title: "Rol creado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRol = useMutation({
    mutationFn: (data: { id: string; nombre: string; descripcion: string; permisos: { modulo: string; accion: string }[] }) =>
      rolesService.updateRol(data.id, data.nombre, data.descripcion, data.permisos),
    onSuccess: () => {
      toast({ title: "Rol actualizado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteRol = useMutation({
    mutationFn: (id: string) => rolesService.deleteRol(id),
    onSuccess: () => {
      toast({ title: "Rol eliminado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignRole = useMutation({
    mutationFn: (data: { userId: string; rolId: string }) =>
      rolesService.assignRoleToUser(data.userId, data.rolId),
    onSuccess: () => {
      toast({ title: "Rol asignado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: (data: { userId: string; nombres: string }) =>
      rolesService.updateUser(data.userId, data.nombres),
    onSuccess: () => {
      toast({ title: "Usuario actualizado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetPassword = useMutation({
    mutationFn: (userId: string) => rolesService.resetPassword(userId),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => rolesService.deleteUser(userId),
    onSuccess: () => {
      toast({ title: "Usuario eliminado exitosamente" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { rolesQuery, usuariosQuery, permisosQuery, createRol, updateRol, deleteRol, assignRole, updateUser, resetPassword, deleteUser };
};
