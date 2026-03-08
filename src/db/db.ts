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
    await db.modules.bulkPut([
      { id: 'coding-1', type: 'coding', title: 'Move the Robot', description: 'Learn basic sequencing by moving the robot to the target.' },
      { id: 'coding-2', type: 'coding', title: 'Turn Around', description: 'Learn how to rotate the robot.' },
      { id: 'coding-3', type: 'coding', title: 'The Maze Runner', description: 'Navigate through a simple maze using sequences.' },
      { id: 'coding-4', type: 'coding', title: 'Loop De Loop', description: 'Introduction to repeating actions (concept).' },
      { id: 'coding-5', type: 'coding', title: 'Zig-Zag Path', description: 'Use turns and moves to follow a complex path.' },
      { id: 'coding-6', type: 'coding', title: 'Rescue Mission', description: 'Reach the target in the minimum number of steps.' },
      { id: 'coding-7', type: 'coding', title: 'The Great Escape', description: 'Navigate a complex maze with multiple obstacles.' },
      { id: 'coding-8', type: 'coding', title: 'Precision Path', description: 'Move the robot with exact turns and steps.' },
      { id: 'safety-1', type: 'safety', title: 'Spot the Scam', description: 'Learn how to identify phishing emails and unsafe links.' },
      { id: 'safety-2', type: 'safety', title: 'Protect Your Password', description: 'Learn how to create strong passwords.' },
      { id: 'safety-3', type: 'safety', title: 'Social Media Safety', description: 'Sharing safely on the internet.' },
      { id: 'safety-4', type: 'safety', title: 'Privacy Settings', description: 'Understanding who can see your information.' },
      { id: 'safety-5', type: 'safety', title: 'Cyberbullying', description: 'How to stay kind and safe online.' },
      { id: 'safety-6', type: 'safety', title: 'Safe Searching', description: 'How to find the right information safely.' },
      { id: 'safety-7', type: 'safety', title: 'Digital Footprint', description: 'Understand what you leave behind online.' },
      { id: 'safety-8', type: 'safety', title: 'Fake News', description: 'How to spot misinformation online.' }
    ]);
  }
};
