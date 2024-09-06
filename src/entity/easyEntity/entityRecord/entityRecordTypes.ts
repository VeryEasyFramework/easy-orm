interface EntityRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
export type HookFunction = () => Promise<void> | void;
