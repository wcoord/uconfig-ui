{
  pkgs ? import <nixpkgs> { },
}:
let
  inherit (pkgs)
    lib
    nodejs_26
    buildNpmPackage
    svelte-check
    ;
in

buildNpmPackage (finalAttrs: {
  name = "uconfig-builder";

  src = lib.cleanSource ./.;

  nodejs = nodejs_26;

  postPatch = ''
    cp ${./package-lock.json} package-lock.json
  '';

  npmDepsHash = "sha256-3+D2TVaPh8nNAq2IapYcaD++OH0A4UDTbvtb6XpTcsQ=";
  npmPackFlags = [ "--ignore-scripts" ]; # Unclear if this is necessary

  nativeBuildInputs = [ svelte-check ];

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
