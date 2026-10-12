@echo off
setlocal
set ROOT=%~dp0..
pushd "%ROOT%\vm" && make operational && popd
python "%ROOT%\validation\reseal_tree.py"
call "%ROOT%\validation\VERIFY_ALL.cmd"
call "%ROOT%\validation\VERIFY_L4_L9_OPEN_GATES.cmd"
