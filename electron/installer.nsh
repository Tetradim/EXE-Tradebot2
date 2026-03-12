; installer.nsh — custom NSIS script included by electron-builder
; Adds an Uninstall shortcut to the Desktop and Start Menu alongside the app shortcut.

!macro customInstall
  ; Desktop uninstall shortcut
  CreateShortcut "$DESKTOP\Uninstall Trading Bot.lnk" "$INSTDIR\Uninstall Trading Bot.exe"

  ; Start Menu uninstall shortcut (in the same folder as the app shortcut)
  CreateShortcut "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk" "$INSTDIR\Uninstall Trading Bot.exe"
!macroend

!macro customUninstall
  ; Clean up the uninstall shortcuts when uninstalling
  Delete "$DESKTOP\Uninstall Trading Bot.lnk"
  Delete "$SMPROGRAMS\Trading Bot\Uninstall Trading Bot.lnk"
!macroend
