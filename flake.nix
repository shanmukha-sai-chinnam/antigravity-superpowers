{
  description = "Antigravity Superpowers - Disciplined AI coding workflows for modern Antigravity 2.0";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
      };

      package = pkgs.stdenv.mkDerivation {
        pname = "antigravity-superpowers";
        version = "0.4.0";
        src = self;

        nativeBuildInputs = [pkgs.makeWrapper];
        buildInputs = [pkgs.nodejs_22];

        installPhase = ''
          runHook preInstall

          mkdir -p $out/lib/antigravity-superpowers
          cp -r bin src templates package.json README.md $out/lib/antigravity-superpowers/

          mkdir -p $out/bin
          makeWrapper ${pkgs.nodejs_22}/bin/node $out/bin/antigravity-superpowers \
            --add-flags "$out/lib/antigravity-superpowers/bin/antigravity-superpowers.js"

          runHook postInstall
        '';

        meta = with pkgs.lib; {
          description = "CLI to initialize the Antigravity Superpowers profile for modern Antigravity 2.0";
          homepage = "https://github.com/shanmukha-sai-chinnam/antigravity-superpowers";
          license = licenses.mit;
          maintainers = ["damathryxx64"];
          mainProgram = "antigravity-superpowers";
        };
      };
    in {
      packages = {
        default = package;
        antigravity-superpowers = package;
      };

      apps.default = flake-utils.lib.mkApp {
        drv = package;
      };

      formatter = pkgs.alejandra;

      devShells.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_22
          git
          ripgrep
          shellcheck
          shfmt
          alejandra
          statix
          deadnix
          herdr
        ];

        shellHook = ''
          export PATH="$PWD/bin:$PATH"
        '';
      };

      checks = {
        inherit package;
        profile =
          pkgs.runCommand "check-profile" {
            nativeBuildInputs = [pkgs.bash pkgs.ripgrep];
          } ''
            bash ${self}/templates/.agents/tests/check-antigravity-profile.sh
            touch $out
          '';
      };
    })
    // {
      overlays.default = final: _prev: {
        antigravity-superpowers = self.packages.${final.stdenv.hostPlatform.system}.default;
      };

      nixosModules.default = {
        config,
        lib,
        pkgs,
        ...
      }: let
        cfg = config.programs.antigravity-superpowers;
      in {
        options.programs.antigravity-superpowers = {
          enable = lib.mkEnableOption "Antigravity Superpowers CLI and workflows";

          package = lib.mkOption {
            type = lib.types.package;
            default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
            description = "The antigravity-superpowers package to install.";
          };

          installGlobally = lib.mkOption {
            type = lib.types.bool;
            default = true;
            description = "Automatically provision Superpowers skills and rules into ~/.gemini/config";
          };
        };

        config = lib.mkIf cfg.enable {
          environment.systemPackages = [cfg.package];

          systemd.user.services.antigravity-superpowers-sync = lib.mkIf cfg.installGlobally {
            description = "Sync Antigravity Superpowers skills into ~/.gemini/config";
            wantedBy = ["default.target"];
            serviceConfig = {
              Type = "oneshot";
              ExecStart = "${cfg.package}/bin/antigravity-superpowers init --global";
              RemainAfterExit = true;
            };
          };
        };
      };
    };
}
