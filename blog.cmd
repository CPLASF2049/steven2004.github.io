@echo off
rem ---------------------------------------------------------------
rem  blog.cmd -- launcher for scripts\blog.ps1
rem  Usage:  blog preview | blog new "title" | blog publish ...
rem ---------------------------------------------------------------
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\blog.ps1" %*
