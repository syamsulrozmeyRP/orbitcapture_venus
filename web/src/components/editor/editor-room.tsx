'use client'

import type { ReactNode } from "react";

type EditorRoomProps = {
  children: ReactNode;
};

export function EditorRoom({ children }: EditorRoomProps) {
  return <>{children}</>;
}
