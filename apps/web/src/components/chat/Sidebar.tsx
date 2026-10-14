import type { Conversation } from '@vq/shared';

type Props = {
  id: string;
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function Sidebar({ id, open, conversations, activeId, disabled, onSelect, onNew }: Props) {
  return (
    <aside
      id={id}
      aria-label="ประวัติบทสนทนา"
      className={`${open ? 'flex' : 'hidden'} min-h-0 w-full shrink-0 flex-col border-b md:flex md:w-64 md:border-r md:border-b-0`}
    >
      <button type="button" onClick={onNew} disabled={disabled} className="m-3 rounded border px-3 py-2 disabled:opacity-50">
        เควสต์ใหม่
      </button>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              disabled={disabled}
              aria-current={c.id === activeId ? 'true' : undefined}
              className="w-full truncate rounded px-2 py-1 text-left aria-[current=true]:font-bold disabled:opacity-50"
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
