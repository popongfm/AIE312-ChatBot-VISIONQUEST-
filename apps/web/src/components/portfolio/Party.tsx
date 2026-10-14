import { Fragment, useState } from 'react';
import type { Member } from '@vq/shared';
import { MemberCard } from './MemberCard';
import { MemberDetail } from './MemberDetail';
import { SectionHeading } from './SectionHeading';

export function Party({ members }: { members: Member[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  return (
    <section id="party" aria-labelledby="party-title" className="px-4 py-16 sm:px-8 sm:py-20">
      <SectionHeading id="party-title">สมาชิก</SectionHeading>
      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const open = openSlug === m.slug;
          const detailId = `member-detail-${m.slug}`;
          return (
            <Fragment key={m.slug}>
              <div id={`member-${m.slug}`} className="min-w-0 scroll-mt-20">
                <MemberCard
                  member={m}
                  expanded={open}
                  controlsId={detailId}
                  onOpen={() => setOpenSlug(open ? null : m.slug)}
                />
              </div>
              {open ? (
                <div className="col-span-full min-w-0">
                  <MemberDetail member={m} id={detailId} />
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
