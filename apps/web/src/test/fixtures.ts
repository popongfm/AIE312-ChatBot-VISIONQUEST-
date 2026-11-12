import type { Member, Portfolio } from '@vq/shared';

export const mickie: Member = {
  slug: 'mickie', name: 'Mick Example', nickname: 'Mickie', role: 'Lead · AI', bio: 'ทำ AI และ CI/CD',
  avatarUrl: null, sortOrder: 1,
  skills: [
    { name: 'Python', category: 'ai', level: 4 },
    { name: 'PostgreSQL', category: 'backend', level: 3 },
    { name: 'Docker', category: 'other', level: 2 },
    { name: 'React', category: 'frontend', level: 1 },
  ],
  projects: [{
    title: 'Blood Cell Detection', summary: 'เปรียบเทียบโมเดลตรวจจับเซลล์เม็ดเลือด', tech: ['PyTorch'],
    repoUrl: null, demoUrl: null, imageUrl: null, isTeamProject: false, contribution: 'ทำ benchmark',
  }],
};

export const nat: Member = {
  slug: 'nat', name: 'Nat Example', nickname: null, role: 'Backend', bio: null,
  avatarUrl: null, sortOrder: 2, skills: [], projects: [],
};

export const portfolio: Portfolio = {
  team: { name: 'VISIONQUEST', tagline: 'ถาม AI ได้ทุกเรื่องเกี่ยวกับทีมเรา', concept: 'เว็บ Portfolio ที่คุยกับ AI ได้', highlights: ['ตอบแบบสตรีม', 'CI/CD อัตโนมัติ'] },
  contacts: [{ type: 'github', label: 'GitHub', url: 'https://github.com/example/visionquest' }],
  members: [mickie, nat],
  teamProjects: [{
    title: 'VISIONQUEST Chat AI Portfolio', summary: 'เว็บ Portfolio พร้อมแชต AI', tech: ['React', 'Express'],
    repoUrl: 'https://github.com/example/visionquest', demoUrl: null, imageUrl: null,
    members: [
      { slug: 'mickie', name: 'Mick Example', nickname: 'Mickie', contribution: 'ทำส่วน AI' },
      { slug: 'nat', name: 'Nat Example', nickname: null, contribution: null },
    ],
  }],
};
