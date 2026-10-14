import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import type { MemberSkill } from '@vq/shared';

const SCAN = '#22d3ee';
const QUEST = '#f5b301';
const INK = '#e6edf7';

export default function SkillRadar({ skills }: { skills: MemberSkill[] }) {
  const data = skills.map((s) => ({ name: s.name, level: s.level }));
  return (
    <div role="img" aria-label={`กราฟทักษะ: ${skills.map((s) => `${s.name} ${s.level}/5`).join(', ')}`} className="min-w-0 max-w-full">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke={SCAN} strokeOpacity={0.25} />
          <PolarAngleAxis dataKey="name" tick={{ fill: INK, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
          <Radar
            dataKey="level"
            stroke={SCAN}
            strokeWidth={2}
            fill={SCAN}
            fillOpacity={0.25}
            dot={{ r: 3, fill: QUEST, stroke: QUEST }}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
