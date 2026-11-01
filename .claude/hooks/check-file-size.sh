#!/bin/bash
# PostToolUse hook (Edit|Write|MultiEdit): reject god files. Exit 2 => message is fed back to the agent.
MAX=300
f=$(jq -r '.tool_input.file_path // empty')
[ -n "$f" ] && [ -f "$f" ] || exit 0
case "$f" in
  */generated/*|*/graphify-out/*|*/migrations/*|*.lock|*lock.yaml|*.json|*.md|*.svg|*.prisma) exit 0 ;;
esac
n=$(wc -l < "$f" | tr -d ' ')
if [ "$n" -gt "$MAX" ]; then
  echo "GOD FILE REJECTED: $f is $n lines (limit $MAX). Split it by responsibility now — see .agent/rules/file-size.md." >&2
  exit 2
fi
