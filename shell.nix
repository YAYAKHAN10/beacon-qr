{
  pkgs ? import <nixpkgs> { },
}:

# Single source of truth for the dev environment.
# `flake.nix` wraps this so `nix develop` and `nix-shell` give the same shell.
pkgs.mkShell {
  name = "beacon-qr-dev";

  packages = with pkgs; [
    # The project's package manager and runtime. The app uses bun strictly;
    # nodejs is here only so tools that shell out to a `node` binary work
    # (wrangler, the OpenNext build).
    bun
    nodejs_24

    lefthook
    git
  ];

  shellHook = ''
    # Prefer project-local binaries (eslint, wrangler, ...).
    export PATH="$PWD/node_modules/.bin:$PATH"
    export NEXT_TELEMETRY_DISABLED=1

    # Install git hooks on entry; harmless to re-run.
    if command -v lefthook >/dev/null 2>&1; then
      lefthook install >/dev/null 2>&1 || true
    fi

    echo "beacon-qr dev shell — bun $(bun --version), node $(node --version)"
  '';
}
