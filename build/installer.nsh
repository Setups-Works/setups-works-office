; Extra steps for the Windows uninstaller. electron-builder's deleteAppDataOnUninstall clears the
; app's own data; this also clears the updater cache and (after asking) the teams' data.
; Nothing here runs when the uninstaller is invoked by an update (${isUpdated}).
!macro customUnInstall
  ${ifNot} ${isUpdated}
    RMDir /r "$APPDATA\Setups Works Office"
    RMDir /r "$LOCALAPPDATA\Setups Works Office"
    RMDir /r "$LOCALAPPDATA\setups-works-office-updater"
    RMDir /r "$LOCALAPPDATA\@setupsworks"
    ${ifNot} ${Silent}
      MessageBox MB_YESNO|MB_ICONQUESTION "Also delete your teams' data (agent folders, plans and tokens in $PROFILE\.swoffic)?$\r$\n$\r$\nYour git repositories are not touched." /SD IDNO IDNO swo_keep_teams
        RMDir /r "$PROFILE\.swoffic"
      swo_keep_teams:
    ${endIf}
  ${endIf}
!macroend
