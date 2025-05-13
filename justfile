current_version := `git describe --tags --abbrev=0`
next_version := `git describe --tags --abbrev=0 | calver --layout YY.MM.MICRO --next`

tag:
  git tag {{ next_version }}

build:
  docker build \
    --build-arg VERSION={{ current_version }} \
    -t eliyip/rocket-control:{{ current_version }} \
    -t eliyip/rocket-control:latest \
    --load .