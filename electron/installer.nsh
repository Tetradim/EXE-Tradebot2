; Custom NSIS installer script for Trading Bot
; Creates uninstall shortcut in Start Menu and Desktop

!macro customInstall
  ; Create Uninstall shortcut in Start Menu
  CreateShortCut "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk" "$INSTDIR\Uninstall Trading Bot.exe" "" "$INSTDIR\Uninstall Trading Bot.exe" 0
  ; Create Uninstall shortcut on Desktop
  CreateShortCut "$DESKTOP\Uninstall Trading Bot.lnk" "$INSTDIR\Uninstall Trading Bot.exe" "" "$INSTDIR\Uninstall Trading Bot.exe" 0
!macroend

!macro customUnInstall
  ; Remove the uninstall shortcuts
  Delete "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk"
  Delete "$DESKTOP\Uninstall Trading Bot.lnk"
!macroend
