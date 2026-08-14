{
  pkgs ? import <nixpkgs> { },
}:
let
  inherit (pkgs)
    lib
    buildNpmPackage
    gitMinimal
    nodejs_26
    svelte-check
    ;
in

buildNpmPackage (finalAttrs: {
  name = "uconfig-builder";

  src = ./.;

  nodejs = nodejs_26;

  postPatch = ''
    cp ${./package-lock.json} package-lock.json
  '';

  npmDepsHash = "sha256-3+D2TVaPh8nNAq2IapYcaD++OH0A4UDTbvtb6XpTcsQ=";
  npmPackFlags = [ "--ignore-scripts" ]; # Unclear if this is necessary

  nativeBuildInputs = [
    gitMinimal
    svelte-check
  ];

  dontNpmInstall = true;
  installPhase = ''
    runHook preInstall

    # buildNpmPackage doesn't have a checkPhase so we run tests here
    svelte-check

    cp -r dist $out

    runHook postInstall
  '';

  meta = {
    description = "uconfig configuration builder UI";
  };
})
