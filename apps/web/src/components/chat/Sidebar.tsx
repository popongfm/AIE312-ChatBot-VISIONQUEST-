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
      className={`${open ? 'flex' : 'hidden'} max-h-[50dvh] min-h-0 w-full shrink-0 flex-col border-b border-line bg-panel md:flex md:max-h-none md:w-64 md:border-r md:border-b-0`}
    >
      <button
        type="button"
        onClick={onNew}
        disabled={disabled}
        className="m-3 flex min-h-11 items-center justify-center gap-2 border border-quest bg-quest/10 px-3 font-semibold text-quest transition-[background-color,color] motion-reduce:transition-none hover:bg-quest hover:text-void disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-quest/10 disabled:hover:text-quest"
      >
        <span aria-hidden="true" className="font-mono">+</span>
        เควสต์ใหม่
      </button>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              disabled={disabled}
              aria-current={c.id === activeId ? 'true' : undefined}
              className="min-h-10 w-full truncate border-l-2 border-transparent px-3 text-left text-sm text-ink-muted transition-[background-color,border-color,color] motion-reduce:transition-none hover:border-scan/50 hover:bg-scan/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 aria-[current=true]:border-scan aria-[current=true]:bg-scan/10 aria-[current=true]:font-semibold aria-[current=true]:text-scan"
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
