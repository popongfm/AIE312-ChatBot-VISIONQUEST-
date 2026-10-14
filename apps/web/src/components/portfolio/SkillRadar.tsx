import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { MemberSkill } from '@vq/shared';

export default function SkillRadar({ skills }: { skills: MemberSkill[] }) {
  const data = skills.map((s) => ({ name: s.name, level: s.level }));
  return (
    <div role="img" aria-label={`กราฟทักษะ: ${skills.map((s) => `${s.name} ${s.level}/5`).join(', ')}`}>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <Radar dataKey="level" fillOpacity={0.4} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
