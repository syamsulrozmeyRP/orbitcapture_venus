DO $$
BEGIN
  IF to_regclass('public."Workspace"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS workspace_isolation ON "Workspace"';
    EXECUTE '
      CREATE POLICY workspace_isolation ON "Workspace"
      USING (
        "ownerId" = current_setting(''app.current_user_id'', true)
        OR EXISTS (
          SELECT 1
          FROM "WorkspaceMember" wm
          WHERE wm."workspaceId" = "Workspace"."id"
            AND wm."userId" = current_setting(''app.current_user_id'', true)
        )
      )
      WITH CHECK (
        "ownerId" = current_setting(''app.current_user_id'', true)
      );
    ';
  END IF;

  IF to_regclass('public."WorkspaceMember"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS workspace_member_isolation ON "WorkspaceMember"';
    EXECUTE '
      CREATE POLICY workspace_member_isolation ON "WorkspaceMember"
      USING (
        EXISTS (
          SELECT 1
          FROM "WorkspaceMember" wm
          WHERE wm."workspaceId" = "WorkspaceMember"."workspaceId"
            AND wm."userId" = current_setting(''app.current_user_id'', true)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM "WorkspaceMember" wm
          WHERE wm."workspaceId" = "WorkspaceMember"."workspaceId"
            AND wm."userId" = current_setting(''app.current_user_id'', true)
            AND wm."role" = ''ADMIN''
        )
      );
    ';
  END IF;

  IF to_regclass('public."WorkspaceInvite"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "WorkspaceInvite" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS workspace_invite_admins ON "WorkspaceInvite"';
    EXECUTE '
      CREATE POLICY workspace_invite_admins ON "WorkspaceInvite"
      USING (
        EXISTS (
          SELECT 1
          FROM "WorkspaceMember" wm
          WHERE wm."workspaceId" = "WorkspaceInvite"."workspaceId"
            AND wm."userId" = current_setting(''app.current_user_id'', true)
            AND wm."role" = ''ADMIN''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM "WorkspaceMember" wm
          WHERE wm."workspaceId" = "WorkspaceInvite"."workspaceId"
            AND wm."userId" = current_setting(''app.current_user_id'', true)
            AND wm."role" = ''ADMIN''
        )
      );
    ';
  END IF;
END $$;
