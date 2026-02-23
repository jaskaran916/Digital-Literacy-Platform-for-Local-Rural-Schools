import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  name: string;
  pin: string;
  xp: number;
  level: number;
  avatar: string;
}

export interface Module {
  id: string;
  type: 'coding' | 'safety';
  title: string;
  description: string;
  local_url?: string;
}

export interface UserProgress {
  id?: number;
  user_id: number;
  module_id: string;
  status: 'in-progress' | 'done';
}

export interface Assessment {
  id?: number;
  user_id: number;
  module_id: string;
  pre_score: number | null;
  post_score: number | null;
}

export interface EarnedBadge {
  id?: number;
  user_id: number;
  badge_id: string;
  awarded_at: number;
}

export interface SyncQueue {
  id?: number;
  action: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'synced';
}

export class DigitalLiteracyDB extends Dexie {
  users!: Table<User, number>;
  modules!: Table<Module, string>;
  userProgress!: Table<UserProgress, number>;
  assessments!: Table<Assessment, number>;
  earnedBadges!: Table<EarnedBadge, number>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('DigitalLiteracyDB');
    this.version(1).stores({
      users: '++id, name, pin',
      modules: 'id, type',
      userProgress: '++id, user_id, module_id, [user_id+module_id]',
      assessments: '++id, user_id, module_id, [user_id+module_id]',
      earnedBadges: '++id, user_id, badge_id',
      syncQueue: '++id, status'
    });
  }
}

export const db = new DigitalLiteracyDB();

export const seedDatabase = async () => {
  const moduleCount = await db.modules.count();
  if (moduleCount === 0) {
    await db.modules.bulkAdd([
      { id: 'coding-1', type: 'coding', title: 'Move the Robot', description: 'Learn basic sequencing by moving the robot to the target.' },
      { id: 'coding-2', type: 'coding', title: 'Turn Around', description: 'Learn how to rotate the robot.' },
      { id: 'safety-1', type: 'safety', title: 'Spot the Scam', description: 'Learn how to identify phishing emails and unsafe links.' },
      { id: 'safety-2', type: 'safety', title: 'Protect Your Password', description: 'Learn how to create strong passwords.' }
    ]);
  }
};
