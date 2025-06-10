{pkgs}: {
  deps = [
    pkgs.freecad
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.xvfb_run
    pkgs.postgresql
  ];
}
