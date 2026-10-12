#!/bin/sh
set -eu
BRCTL=${BRCTL:-.build/bradmin}; BRVERIFY=${BRVERIFY:-.build/brverify}; T=.build/constant_fold
mkdir -p "$T"
cat > "$T/fold.lctlc" <<'EOT'
LCTLC/1.1
@unit id=t.fold version=4.7.0 profile=brvm-native network=deny image_version=8 requested_caps=CONTROL max_steps=4 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=main parent=root module=fold
ID|LANE|OP|OUT|CTRL|IN|ARG|META
F001|core|MOVI|R0|C0|_|u64:40+2|width=WIDE
F002|core|HALT|_|C0|_|_|_
@end
EOT
"$BRCTL" compile-lctlc "$T/fold.lctlc" "$T/fold.brimg" >/dev/null
"$BRVERIFY" --disasm "$T/fold.brimg" > "$T/fold.disasm"
grep -Eq 'MOVI.*42' "$T/fold.disasm"
echo 'BR-460 constant-expression folding: PASS u64:40+2 -> 42'
