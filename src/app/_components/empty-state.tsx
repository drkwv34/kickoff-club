import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function EmptyState({ title, children }: Props) {
  return (
    <div className="empty-state-panel" role="status">
      <p className="empty-state-title">{title}</p>
      <div className="empty-state-body">{children}</div>
    </div>
  );
}
