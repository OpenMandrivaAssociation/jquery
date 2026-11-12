Name:		jquery
Version:	3.7.1
Release:	1
Summary:	jQuery minified for Gradle HTML reports
Group:		Development/Java
License:	MIT
URL:		https://jquery.com/
# Tag 3.7.1 (f79d5f1a337528940ab7029d4f8bbba72326f269). src/ only.
# dist/jquery.min.js is produced in %%build and is not in this archive.
Source0:	jquery-%{version}.tar.gz
# Build tools pinned by jQuery 3.7.1 package.json: requirejs 2.3.6 (r.js),
# uglify-js 3.4.7, and its source-map 0.6.1. Not installed.
Source1:	jquery-%{version}-build-tools.tar.gz
Source2:	build-jquery.js
Source3:	check-jquery.js

BuildArch:	noarch
BuildRequires:	java-current-devel
BuildRequires:	sysjar
BuildRequires:	javapackages-filesystem
BuildRequires:	nodejs

%description
jquery:jquery.min %{version}. Gradle loads this JavaScript file into
generated reports. The RPM builds it from the jQuery %{version} sources
with the requirejs optimizer and uglify-js, then publishes the result
as a sysjar coordinate.

%prep
%autosetup -n jquery-%{version} -p1
set -eo pipefail
tar -xf %{SOURCE1}
python3 - << 'PY'
import os
bad = []
for dirpath, dirs, files in os.walk("."):
    for fn in files:
        path = os.path.join(dirpath, fn)
        if fn.endswith((".jar", ".class", ".so", ".node", ".wasm", ".dll", ".a", ".o")):
            bad.append(path)
            continue
        try:
            with open(path, "rb") as fh:
                mag = fh.read(4)
        except OSError:
            continue
        if mag in (b"\x7fELF", b"\xca\xfe\xba\xbe"):
            bad.append(path)
if bad:
    print("\n".join(bad))
    raise SystemExit(1)
PY
if [ -e dist/jquery.min.js ]; then
	echo "prebuilt dist/jquery.min.js"
	exit 1
fi
test -s src/jquery.js
test -s src/wrapper.js
test -s jquery-build-tools/node_modules/requirejs/bin/r.js
test -s jquery-build-tools/node_modules/uglify-js/lib/minify.js
test -s jquery-build-tools/node_modules/source-map/source-map.js

%build
set -eo pipefail
export JAVA_HOME=%{_jvmdir}/java-openjdk
export PATH="$JAVA_HOME/bin:/usr/bin:/bin"
export NODE_PATH="$PWD/jquery-build-tools/node_modules"
node %{SOURCE2} "$PWD" "$PWD/dist"
test -s dist/jquery.min.js
echo 'fc9a93dd241f6b045cbff0481cf4e1901becd0e12fb45166a8f17f95823f0b1a  dist/jquery.min.js' | sha256sum -c -
mkdir -p jarroot
cp -a dist/jquery.min.js jarroot/jquery.min.js
printf '%%s\n' 'Manifest-Version: 1.0' "Implementation-Version: %{version}" > manifest.mf
jar cfm jquery.min.jar manifest.mf -C jarroot jquery.min.js
jar i jquery.min.jar

cat > jquery.min.pom << 'END'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>jquery</groupId>
  <artifactId>jquery.min</artifactId>
  <version>%{version}</version>
  <name>jquery.min</name>
  <description>jQuery minified build.</description>
  <url>https://jquery.com/</url>
  <licenses>
    <license>
      <name>MIT</name>
      <url>https://jquery.org/license</url>
    </license>
  </licenses>
</project>
END

%install
set -eo pipefail
sysjar install --buildroot %{buildroot} \
	--artifact jquery.min.pom:jquery.min.jar \
	--file-name jquery.min \
	--filelist .mfiles
idx="%{buildroot}/usr/share/sysjar/index/jquery/jquery.min.sysjar"
test -s "$idx"
grep -F -q '"version": "%{version}"' "$idx"
grep -F -q '"artifactId": "jquery.min"' "$idx"
test -s %{buildroot}%{_javadir}/jquery.min.jar

%check
set -eo pipefail
export PATH="/usr/bin:/bin"
mkdir -p check
cp -a %{SOURCE3} check/check-jquery.js
unzip -p %{buildroot}%{_javadir}/jquery.min.jar jquery.min.js > check/jquery.min.js
test -s check/jquery.min.js
node check/check-jquery.js "$PWD/check/jquery.min.js" > check/out.txt
cat check/out.txt
grep -F -qx 'jquery_ok 3.7.1 jQuery' check/out.txt

%files -f .mfiles
%license LICENSE.txt
