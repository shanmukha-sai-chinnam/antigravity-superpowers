export async function swarmCommand(args, { cwd, stdout, stderr }) {
  const [action] = args;

  if (!action || action === "help" || action === "--help") {
    stdout.write(
      "antigravity-superpowers swarm\n\n" +
      "Note: Herdr multi-agent orchestration has been removed.\n" +
      "Use Antigravity native Planning Mode artifacts and Single-Flow task execution.\n"
    );
    return 0;
  }

  if (action === "status") {
    stdout.write("Swarm: disabled (Herdr removed; using Antigravity Single-Flow mode)\n");
    return 0;
  }

  stderr.write(
    "Error: Herdr multi-agent swarms have been removed. Use Antigravity Planning Mode.\n"
  );
  return 1;
}
