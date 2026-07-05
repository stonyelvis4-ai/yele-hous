@echo off
set "DATABASE_URL=postgresql://postgres:0797186095@localhost:5432/yele"
set "PORT=4174"
cd /d "C:\MES PROJETS\YELE"
"C:\Program Files\nodejs\node.exe" server\index.mjs
