# SPDX-FileCopyrightText: 2026 Devan Carpenter <devan@informatics.coop>
# SPDX-FileCopyrightText: 2026 Zach Mandeville <webmaster@coolguy.website>
#
# SPDX-License-Identifier: GPL-2.0-only

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
  name = "uconfig-ui";

  src = ./.;

  nodejs = nodejs_26;

  postPatch = ''
    cp ${./package-lock.json} package-lock.json
  '';

  npmDepsHash = "sha256-hdGp64ojUQr2Vv3kyfCxqOJca2YT9ZBsb1zen/g67e4=";
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
