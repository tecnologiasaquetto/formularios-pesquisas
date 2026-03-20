import type { User, UserRole, CreateUserData, UpdateUserData } from "@/types/auth";

// Mock users data
let users: User[] = [
  {
    id: 1,
    nome: "Admin Sistema",
    email: "admin@saquetto.com.br",
    senha: "admin123", // Em produção seria hash
    perfil: "administrador",
    ativo: true,
    criado_em: "2025-01-01T00:00:00Z",
    ultimo_acesso: new Date().toISOString()
  },
  {
    id: 2,
    nome: "João Silva",
    email: "joao.silva@saquetto.com.br",
    senha: "joao123",
    perfil: "visualizador",
    ativo: true,
    criado_em: "2025-02-15T10:30:00Z",
    criado_por: 1,
    ultimo_acesso: new Date(Date.now() - 86400000).toISOString() // Ontem
  },
  {
    id: 3,
    nome: "Maria Santos",
    email: "maria.santos@saquetto.com.br",
    perfil: "visualizador",
    senha: "maria123",
    ativo: true,
    criado_em: "2025-03-10T14:20:00Z",
    criado_por: 1,
    ultimo_acesso: new Date(Date.now() - 172800000).toISOString() // 2 dias atrás
  },
  {
    id: 4,
    nome: "Pedro Oliveira",
    email: "pedro.oliveira@saquetto.com.br",
    senha: "pedro123",
    perfil: "administrador",
    ativo: true,
    criado_em: "2025-03-20T09:15:00Z",
    criado_por: 1,
    ultimo_acesso: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
  },
  {
    id: 5,
    nome: "Ana Costa",
    email: "ana.costa@saquetto.com.br",
    senha: "ana123",
    perfil: "visualizador",
    ativo: false, // Usuário inativo
    criado_em: "2025-04-01T16:45:00Z",
    criado_por: 1
  }
];

let nextUserId = 6;

// CRUD Operations
export function getUsers(): User[] {
  return users.sort((a, b) => b.id - a.id);
}

export function getUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(data: CreateUserData, createdBy: number): User {
  // Check if email already exists
  if (getUserByEmail(data.email)) {
    throw new Error('Email já cadastrado');
  }

  const newUser: User = {
    id: nextUserId++,
    nome: data.nome.trim(),
    email: data.email.toLowerCase().trim(),
    senha: data.senha, // Em produção seria hash
    perfil: data.perfil,
    ativo: true,
    criado_em: new Date().toISOString(),
    criado_por: createdBy
  };

  users.push(newUser);
  return newUser;
}

export function updateUser(id: number, data: UpdateUserData): User {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('Usuário não encontrado');
  }

  const user = users[userIndex];

  // Check email conflict if changing email
  if (data.email && data.email !== user.email) {
    const existingUser = getUserByEmail(data.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Email já cadastrado');
    }
  }

  // Update user
  const updatedUser: User = {
    ...user,
    ...(data.nome && { nome: data.nome.trim() }),
    ...(data.email && { email: data.email.toLowerCase().trim() }),
    ...(data.senha && { senha: data.senha }), // Em produção seria hash
    ...(data.perfil && { perfil: data.perfil }),
    ...(typeof data.ativo === 'boolean' && { ativo: data.ativo })
  };

  users[userIndex] = updatedUser;
  return updatedUser;
}

export function deleteUser(id: number): boolean {
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('Usuário não encontrado');
  }

  // Don't allow deletion of the main admin (id: 1)
  if (id === 1) {
    throw new Error('Não é possível excluir o administrador principal');
  }

  users.splice(userIndex, 1);
  return true;
}

export function toggleUserStatus(id: number): User {
  const user = getUserById(id);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Don't allow deactivation of the main admin
  if (id === 1) {
    throw new Error('Não é possível desativar o administrador principal');
  }

  return updateUser(id, { ativo: !user.ativo });
}

// Authentication
export function authenticateUser(email: string, senha: string): User | null {
  const user = getUserByEmail(email);
  
  if (!user || !user.ativo) {
    return null;
  }

  // Em produção, usaria bcrypt.compare(senha, user.senha)
  if (user.senha !== senha) {
    return null;
  }

  // Update last access
  updateUser(user.id, { ultimo_acesso: new Date().toISOString() });
  
  return user;
}

// Filter functions
export function filterUsers(users: User[], filters: {
  search?: string;
  perfil?: UserRole | 'todos';
  ativo?: boolean | 'todos';
}): User[] {
  return users.filter(user => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        user.nome.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Profile filter
    if (filters.perfil && filters.perfil !== 'todos') {
      if (user.perfil !== filters.perfil) return false;
    }

    // Status filter
    if (typeof filters.ativo === 'boolean') {
      if (user.ativo !== filters.ativo) return false;
    }

    return true;
  });
}

// Statistics
export function getUserStats() {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.ativo).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = users.filter(u => u.perfil === 'administrador').length;
  const viewerUsers = users.filter(u => u.perfil === 'visualizador').length;

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    viewerUsers
  };
}

// Export for testing
export function resetUsersMock() {
  users = [
    {
      id: 1,
      nome: "Admin Sistema",
      email: "admin@saquetto.com.br",
      senha: "admin123",
      perfil: "administrador",
      ativo: true,
      criado_em: "2025-01-01T00:00:00Z",
      ultimo_acesso: new Date().toISOString()
    }
  ];
  nextUserId = 2;
}
