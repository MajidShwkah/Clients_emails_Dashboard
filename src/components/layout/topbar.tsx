import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function Topbar({ email }: { email: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <MobileNav />
        <span className="text-sm text-muted-foreground hidden md:inline">
          Master control · violation-email recipients
        </span>
      </div>
      <UserMenu email={email} />
    </header>
  );
}
