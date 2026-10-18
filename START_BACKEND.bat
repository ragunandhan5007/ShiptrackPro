@echo off
title ShipTracePro - Spring Boot Backend
echo Starting Spring Boot Backend on port 8080...
cd /d "%~dp0backend"
call .\mvnw.cmd spring-boot:run
pause
