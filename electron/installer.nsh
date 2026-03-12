; Custom NSIS installer script for Trading Bot
; Creates uninstall shortcut in Start Menu

!macro customInstall
  ; Create Uninstall shortcut in Start Menu
  CreateShortCut "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk" "$INSTDIR\Uninstall Trading Bot.exe" "" "$INSTDIR\Uninstall Trading Bot.exe" 0
!macroend

!macro customUnInstall
  ; Remove the uninstall shortcut
  Delete "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk"
!macroend
