#!/bin/sh
set -eu
: "${BRCTL:?}" "${BRVERIFY:?}"
T=$(mktemp -d "${TMPDIR:-/tmp}/br430-sem.XXXXXX")
trap 'rm -rf "$T"' EXIT INT TERM
pass=0
fail(){ echo "FAIL: $1" >&2; exit 1; }
expect_bad(){ name=$1; file=$2; rm -f "$T/$name.brimg"; if "$BRCTL" verify-lctlc "$file" >/dev/null 2>&1; then fail "$name verifier accepted invalid source"; fi; if "$BRCTL" compile-lctlc "$file" "$T/$name.brimg" >/dev/null 2>&1; then fail "$name compiler created image"; fi; [ ! -e "$T/$name.brimg" ] || fail "$name left image after rejection"; pass=$((pass+1)); }
write(){ cat > "$T/$1"; }

write good.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.good version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t.good
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|NOP|_|C0|_|_|_
I1|x|HALT|_|C0|_|_|_
@end
SRC
"$BRCTL" verify-lctlc "$T/good.lctlc" >/dev/null
"$BRCTL" lctl-to-brir "$T/good.lctlc" "$T/good.brir" >/dev/null
"$BRCTL" compile-lctlc "$T/good.lctlc" "$T/good.brimg" >/dev/null
python3 "${PROVTOOL:-tools/provenance.py}" "$T/good.lctlc" "$T/good.brir" "$T/good.brimg" "$T/good.json" >/dev/null
"$BRVERIFY" "$T/good.brimg" "$T/good.lctlc" "$T/good.brir" >/dev/null
pass=$((pass+5))
rm -f "$T/override.brimg"
if "$BRCTL" compile-lctlc "$T/good.lctlc" "$T/override.brimg" --image-version 5 >/dev/null 2>&1; then fail "compiler allowed image-version override to supersede source authority"; fi
[ ! -e "$T/override.brimg" ] || fail "conflicting image-version override left an image"
pass=$((pass+1))

sed 's/LCTLC\/1.1/LCTLC\/1.0/' "$T/good.lctlc" > "$T/legacy.lctlc"; expect_bad legacy "$T/legacy.lctlc"
printf 'LCTLC/1.1\r\n' > "$T/crlf.lctlc"; expect_bad crlf "$T/crlf.lctlc"
sed 's/@unit /@unit unknown=x /' "$T/good.lctlc" > "$T/unknownfield.lctlc"; expect_bad unknownfield "$T/unknownfield.lctlc"
awk 'NR==2{u=$0;next} NR==3{print;print u;next}1' "$T/good.lctlc" > "$T/order.lctlc"; expect_bad order "$T/order.lctlc"
sed 's/I0|x|NOP|_|C0|_|_|_/I0|x|NOP|_|C0|_|_|f=MODEL/' "$T/good.lctlc" > "$T/hiddenmeta.lctlc"; expect_bad hiddenmeta "$T/hiddenmeta.lctlc"
sed 's/I0|x|NOP/I0|x|BOGUS/' "$T/good.lctlc" > "$T/opcode.lctlc"; expect_bad opcode "$T/opcode.lctlc"
sed 's/I0|x|NOP/I0|x|CALL/' "$T/good.lctlc" > "$T/call.lctlc"; expect_bad call "$T/call.lctlc"
sed 's/I0|x|NOP/I0|x|RET/' "$T/good.lctlc" > "$T/ret.lctlc"; expect_bad ret "$T/ret.lctlc"

write nowidth.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.nowidth version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|MOVI|R0|C0|_|u64:1|_
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad nowidth "$T/nowidth.lctlc"
sed 's/u64:1|_/u64:1|mode=CHECKED;width=WIDE/' "$T/nowidth.lctlc" > "$T/badmode.lctlc"; expect_bad badmode "$T/badmode.lctlc"
sed 's/R0|C0/R16|C0/' "$T/nowidth.lctlc" | sed 's/u64:1|_/u64:1|width=WIDE/' > "$T/reg.lctlc"; expect_bad reg "$T/reg.lctlc"
sed 's/C0|_|_|_/C1|_|_|_/' "$T/good.lctlc" > "$T/capreg.lctlc"; expect_bad capreg "$T/capreg.lctlc"

write capmissing.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.cap version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|MOVI|R0|C0|_|u64:1|width=WIDE
I1|x|ADD|R1|C0|R0›R0|_|width=WIDE
I2|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad capmissing "$T/capmissing.lctlc"
sed 's/requested_caps=CONTROL /requested_caps=CONTROL|ARITH /' "$T/good.lctlc" > "$T/capexcess.lctlc"; expect_bad capexcess "$T/capexcess.lctlc"

write branchbad.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.branch version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|JMP|_|C0|_|label:NOPE|_
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad branchbad "$T/branchbad.lctlc"
write unreachable.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.unreach version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|JMP|_|C0|_|label:I2|_
I1|x|NOP|_|C0|_|_|_
I2|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad unreachable "$T/unreachable.lctlc"
write infinite.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.loop version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|JMP|_|C0|_|label:I0|_
@end
SRC
expect_bad infinite "$T/infinite.lctlc"
write pop.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.pop version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL|STACK max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|POP|R0|C0|_|_|width=WIDE
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad pop "$T/pop.lctlc"
write merge.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.merge version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL|ARITH|STACK max_steps=16 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|MOVI|R0|C0|_|u64:0|width=WIDE
I1|x|CMP|R1|C0|R0›R0|_|width=WIDE
I2|x|JZ|_|C0|_|label:I4|_
I3|x|PUSH|_|C0|R0|_|width=WIDE
I4|x|NOP|_|C0|_|_|_
I5|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad merge "$T/merge.lctlc"

write membad.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.mem version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL|MEMORY max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|LOAD|R0|C0|_|mem:4089|width=SCALAR64
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad membad "$T/membad.lctlc"
sed 's/mem:4089|width=SCALAR64/mem:0|width=WIDE/' "$T/membad.lctlc" > "$T/memwidth.lctlc"; expect_bad memwidth "$T/memwidth.lctlc"
write shiftbad.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.shift version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL|ARITH max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|SHL|R0|C0|R0|u32:1048576|width=WIDE
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad shiftbad "$T/shiftbad.lctlc"
write svcbad.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.svc version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL|SERVICE max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|SVC|R0|C0|R0›R0|svc:NOPE|width=WIDE
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad svcbad "$T/svcbad.lctlc"
sed 's/svc:NOPE/svc:CONFIGURE/' "$T/svcbad.lctlc" > "$T/statecap.lctlc"; expect_bad statecap "$T/statecap.lctlc"
sed 's/svc:NOPE/svc:ED25519_VERIFY/' "$T/svcbad.lctlc" > "$T/updatecap.lctlc"; expect_bad updatecap "$T/updatecap.lctlc"

write dataoverlap.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.data version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
D0|data|DATA|MEMORY[0]|_|_|hex:AABB|_
D1|data|DATA|MEMORY[1]|_|_|hex:CC|_
I0|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad dataoverlap "$T/dataoverlap.lctlc"
sed 's/AABB/aabb/' "$T/dataoverlap.lctlc" | grep -v '^D1' > "$T/datahex.lctlc"; expect_bad datahex "$T/datahex.lctlc"
write dataafter.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.after version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|NOP|_|C0|_|_|_
D0|data|DATA|MEMORY[0]|_|_|hex:AA|_
I1|x|HALT|_|C0|_|_|_
@end
SRC
expect_bad dataafter "$T/dataafter.lctlc"
write fallthrough.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.fall version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=8 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|NOP|_|C0|_|_|_
@end
SRC
expect_bad fallthrough "$T/fallthrough.lctlc"

write loopok.lctlc <<'SRC'
LCTLC/1.1
@unit id=t.loopok version=4.7.0 profile=brvm-native network=deny image_version=4 requested_caps=CONTROL max_steps=16 termination=bounded
@defaults mode=WRAP width=WIDE
@frame id=F parent=ROOT module=t
ID|LANE|OP|OUT|CTRL|IN|ARG|META
I0|x|NOP|_|C0|_|_|_
I1|x|JZ|_|C0|_|label:I3|_
I2|x|JMP|_|C0|_|label:I1|_
I3|x|HALT|_|C0|_|_|_
@end
SRC
"$BRCTL" verify-lctlc "$T/loopok.lctlc" >/dev/null || fail "bounded loop rejected"
pass=$((pass+1))

cp "$T/good.brimg" "$T/corrupt.brimg"; printf '\001' | dd of="$T/corrupt.brimg" bs=1 seek=100 conv=notrunc >/dev/null 2>&1
if "$BRVERIFY" "$T/corrupt.brimg" >/dev/null 2>&1; then fail "independent verifier accepted corrupted BRIM"; fi; pass=$((pass+1))
printf 'x' >> "$T/good.brir.bad" 2>/dev/null || true
cp "$T/good.brir" "$T/wrong.brir"; echo x >> "$T/wrong.brir"
if "$BRVERIFY" "$T/good.brimg" "$T/good.lctlc" "$T/wrong.brir" >/dev/null 2>&1; then fail "provenance accepted wrong BRIR"; fi; pass=$((pass+1))
cp "$T/good.brimg" "$T/provtamper.brimg"
python3 - "$T/provtamper.brimg" <<'PYTAMPER'
import hashlib, struct, sys
p=sys.argv[1]
b=bytearray(open(p,'rb').read())
ext=struct.unpack_from('<I',b,24)[0]
assert ext==96
cc=struct.unpack_from('<H',b,28)[0]
dl=struct.unpack_from('<H',b,30)[0]
off=80+cc*16+dl
assert b[off:off+4]==b'BRPV'
struct.pack_into('<I',b,off+20,0)
b[32:64]=hashlib.sha256(b[80:]).digest()
open(p,'wb').write(b)
PYTAMPER
if "$BRCTL" run "$T/provtamper.brimg" >/dev/null 2>&1; then fail "runtime accepted semantically forged provenance with a recomputed payload seal"; fi
if "$BRVERIFY" "$T/provtamper.brimg" >/dev/null 2>&1; then fail "independent verifier accepted semantically forged provenance"; fi
pass=$((pass+2))

echo "BR-430 semantic tests: PASS cases=$pass"
