import React, { useState, useMemo } from "react";
import { Plus, Search, Filter, MoreVertical, Eye, EyeOff, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User, UserRole, CreateUserData, UpdateUserData, UserFormErrors } from "@/types/auth";
import { ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS } from "@/types/auth";
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus, filterUsers, getUserStats } from "@/lib/usersMockData";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [perfilFilter, setPerfilFilter] = useState<UserRole | 'todos'>('todos');
  const [ativoFilter, setAtivoFilter] = useState<boolean | 'todos'>('todos');
  
  // Form data
  const [formData, setFormData] = useState<CreateUserData>({
    nome: "",
    email: "",
    senha: "",
    perfil: "visualizador"
  });
  
  const [formErrors, setFormErrors] = useState<UserFormErrors>({});

  // Filter users
  const filteredUsers = useMemo(() => {
    return filterUsers(users, {
      search: searchTerm,
      perfil: perfilFilter,
      ativo: ativoFilter === 'todos' ? undefined : ativoFilter
    });
  }, [users, searchTerm, perfilFilter, ativoFilter]);

  // Stats
  const stats = useMemo(() => getUserStats(), [users]);

  // Form validation
  const validateForm = (data: CreateUserData, isEdit = false): UserFormErrors => {
    const errors: UserFormErrors = {};

    if (!data.nome.trim()) {
      errors.nome = "Nome é obrigatório";
    } else if (data.nome.trim().length < 3) {
      errors.nome = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!data.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Email inválido";
    }

    if (!isEdit && !data.senha) {
      errors.senha = "Senha é obrigatória";
    } else if (data.senha && data.senha.length < 6) {
      errors.senha = "Senha deve ter pelo menos 6 caracteres";
    }

    return errors;
  };

  // Handle create user
  const handleCreateUser = async () => {
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const newUser = createUser(formData, 1); // ID 1 = admin atual
      setUsers(getUsers());
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Usuário criado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const errors = validateForm({ ...formData, senha: formData.senha || editingUser.senha }, true);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateUserData = {
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil
      };

      if (formData.senha && formData.senha !== editingUser.senha) {
        updateData.senha = formData.senha;
      }

      updateUser(editingUser.id, updateData);
      setUsers(getUsers());
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      toast.success("Usuário atualizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) {
      return;
    }

    try {
      deleteUser(user.id);
      setUsers(getUsers());
      toast.success("Usuário excluído com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir usuário");
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (user: User) => {
    try {
      toggleUserStatus(user.id);
      setUsers(getUsers());
      toast.success(`Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar status");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      senha: "",
      perfil: "visualizador"
    });
    setFormErrors({});
    setShowPassword(false);
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: "",
      perfil: user.perfil
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
                {formErrors.nome && (
                  <p className="text-sm text-destructive mt-1">{formErrors.nome}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formErrors.senha && (
                  <p className="text-sm text-destructive mt-1">{formErrors.senha}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="perfil">Perfil</Label>
                <Select value={formData.perfil} onValueChange={(value: UserRole) => setFormData({ ...formData, perfil: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_DESCRIPTIONS[formData.perfil]}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.viewerUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={perfilFilter} onValueChange={(value: UserRole | 'todos') => setPerfilFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ativoFilter.toString()} onValueChange={(value) => setAtivoFilter(value === 'todos' ? 'todos' : value === 'true')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Usuários ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Perfil</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Criado em</th>
                  <th className="text-left p-3 font-medium">Último acesso</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.nome}</div>
                        {user.id === 1 && (
                          <div className="text-xs text-muted-foreground">Admin principal</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <Badge className={ROLE_COLORS[user.perfil]}>
                        {ROLE_LABELS[user.perfil]}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.ativo ? "default" : "secondary"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">
                      {new Date(user.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-xs">
                      {user.ultimo_acesso 
                        ? new Date(user.ultimo_acesso).toLocaleDateString('pt-BR')
                        : "Nunca"
                      }
                    </td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.ativo ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive"
                            disabled={user.id === 1}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || perfilFilter !== 'todos' || ativoFilter !== 'todos'
                    ? "Nenhum usuário encontrado com os filtros aplicados."
                    : "Nenhum usuário cadastrado."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
              {formErrors.nome && (
                <p className="text-sm text-destructive mt-1">{formErrors.nome}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
              {formErrors.email && (
                <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
              <div className="relative">
                <Input
                  id="edit-senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Deixe em branco para manter atual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formErrors.senha && (
                <p className="text-sm text-destructive mt-1">{formErrors.senha}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-perfil">Perfil</Label>
              <Select value={formData.perfil} onValueChange={(value: UserRole) => setFormData({ ...formData, perfil: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="visualizador">Visualizador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {ROLE_DESCRIPTIONS[formData.perfil]}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateUser} disabled={isLoading}>
                {isLoading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
