export type SkillCategory = 'frontend' | 'backend' | 'ai' | 'data' | 'design' | 'other';
export interface Team { name: string; tagline: string | null; concept: string | null; highlights: string[] }
export interface Contact { type: string; label: string; url: string }
export interface MemberSkill { name: string; category: SkillCategory; level: number } // 1–5
export interface MemberProject {
  title: string; summary: string; tech: string[];
  repoUrl: string | null; demoUrl: string | null; imageUrl: string | null;
  isTeamProject: boolean; contribution: string | null;
}
export interface Member {
  slug: string; name: string; nickname: string | null; role: string; bio: string | null;
  avatarUrl: string | null; sortOrder: number; skills: MemberSkill[]; projects: MemberProject[];
}
export interface TeamProjectMember { slug: string; name: string; nickname: string | null; contribution: string | null }
export interface TeamProject {
  title: string; summary: string; tech: string[];
  repoUrl: string | null; demoUrl: string | null; imageUrl: string | null; members: TeamProjectMember[];
}
export interface Portfolio { team: Team; contacts: Contact[]; members: Member[]; teamProjects: TeamProject[] }
export interface Conversation { id: string; title: string; createdAt: string }
export type Role = 'user' | 'model';
export interface Message { id: number; role: Role; content: string; citedMembers: string[]; createdAt: string }
export type ChatErrorCode = 'RATE_LIMITED' | 'AI_ERROR';
export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'done'; messageId: number; citedMembers: string[] }
  | { type: 'error'; code: ChatErrorCode; message: string };
export interface ApiErrorBody { error: { code: string; message: string } }

export const CHAT_ERROR_COPY: Record<ChatErrorCode, string> = {
  RATE_LIMITED: 'AI คิวเต็ม ลองใหม่ในอีกสักครู่',
  AI_ERROR: 'Oracle ขัดข้อง ลองใหม่อีกครั้ง',
};

export function displayName(m: { name: string; nickname: string | null }): string {
  return m.nickname ?? m.name;
}
