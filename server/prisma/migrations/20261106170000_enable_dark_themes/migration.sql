-- Enable dark themes (Obsidian Dark and Nord Slate)
UPDATE "themes"
SET "isActive" = true, "updatedAt" = now()
WHERE "code" IN ('obsidian', 'nord');

