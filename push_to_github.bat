@echo off
cd /d "%~dp0"
echo ==============================================================================
echo   Pushing FarmwiseAI to GitHub: https://github.com/Rithu1382005/FarmwiseAI
echo ==============================================================================
echo.
echo If prompted, please click "Sign in with your browser" to authenticate.
echo.
git push -u origin feature/farmer-ux-chatbot-passport:main
git push -u origin feature/farmer-ux-chatbot-passport
echo.
echo ==============================================================================
echo   SUCCESS! View your project live on GitHub:
echo   https://github.com/Rithu1382005/FarmwiseAI
echo ==============================================================================
pause
