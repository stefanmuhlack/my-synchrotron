export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For backward compatibility
  hashedPassword?: string;
  role: 'admin' | 'coach' | 'coachee';
  mandant: string; // coach ID or "*" for admin
  avatar?: string;
  modulePermissions?: string[]; // Array of module keys the user can access
}

export interface ModuleConfig {
  name: string;
  routePrefix: string;
  rolesAllowed: ('admin' | 'coach' | 'coachee')[];
  hasWidget: boolean;
  routes?: () => Promise<any[]>;
  widget?: () => Promise<any>;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  compatibleWithCore?: string;
  hasDashboardWidget?: boolean;
  dashboardWidget?: () => Promise<any>;
  dependencies?: Array<{
    moduleKey: string;
    version?: string;
    optional?: boolean;
  }>;
  hooks?: {
    beforeLoad?: () => Promise<void> | void;
    afterLoad?: () => Promise<void> | void;
    beforeUnload?: () => Promise<void> | void;
    afterUnload?: () => Promise<void> | void;
    onError?: (error: Error) => Promise<void> | void;
    onHealthCheck?: () => Promise<boolean> | boolean;
  };
  hotReload?: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
}

export interface ModuleState {
  config: ModuleConfig;
  enabled: boolean;
  installed: boolean;
  error?: string | null;
}

export interface AppState {
  user: User | null;
  modules: Record<string, ModuleState>;
  loading: boolean;
}

export interface UserSession {
  user: User;
  loginTime: string;
  expiresAt: string;
}

export interface UsersData {
  users: User[];
}