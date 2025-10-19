9:39:13 PM: Netlify Build                                                 
9:39:13 PM: ────────────────────────────────────────────────────────────────
9:39:13 PM: ​
9:39:13 PM: ❯ Version
9:39:13 PM:   @netlify/build 35.1.10
9:39:13 PM: ​
9:39:13 PM: ❯ Flags
9:39:13 PM:   accountId: 68f41ef453e83cc3eff816e1
9:39:13 PM:   baseRelDir: true
9:39:13 PM:   buildId: 68f44133370b880008c80fb1
9:39:13 PM:   deployId: 68f44133370b880008c80fb3
9:39:13 PM: ​
9:39:13 PM: ❯ Current directory
9:39:13 PM:   /opt/build/repo
9:39:13 PM: ​
9:39:13 PM: ❯ Config file
9:39:13 PM:   No config file was defined: using default values.
9:39:13 PM: ​
9:39:13 PM: ❯ Context
9:39:13 PM:   production
9:39:13 PM: ​
9:39:13 PM: Build command from Netlify app                                
9:39:13 PM: ────────────────────────────────────────────────────────────────
9:39:13 PM: ​
9:39:13 PM: $ npm run build
9:39:13 PM: > atl-stock-exchange@0.1.0 build
9:39:13 PM: > react-scripts build
9:39:14 PM: Creating an optimized production build...
9:39:24 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
9:39:24 PM: Failed to compile.
9:39:24 PM: 
9:39:24 PM: [eslint]
9:39:24 PM: src/App.js
9:39:24 PM:   Line 1414:35:  Unexpected use of 'confirm'  no-restricted-globals
9:39:24 PM:   Line 1523:27:  Unexpected use of 'confirm'  no-restricted-globals
9:39:24 PM:   Line 1544:27:  Unexpected use of 'confirm'  no-restricted-globals
9:39:24 PM:   Line 1645:27:  Unexpected use of 'confirm'  no-restricted-globals
9:39:24 PM:   Line 1662:27:  Unexpected use of 'confirm'  no-restricted-globals
9:39:24 PM: Search for the keywords to learn more about each error.
9:39:24 PM: ​
9:39:24 PM: "build.command" failed                                        
9:39:24 PM: ────────────────────────────────────────────────────────────────
9:39:24 PM: ​
9:39:24 PM:   Error message
9:39:24 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
9:39:24 PM: ​
9:39:24 PM:   Error location
9:39:24 PM:   In Build command from Netlify app:
9:39:24 PM:   npm run build
9:39:24 PM: ​
9:39:24 PM:   Resolved config
9:39:24 PM:   build:
9:39:24 PM:     command: npm run build
9:39:24 PM:     commandOrigin: ui
9:39:24 PM:     publish: /opt/build/repo/build
9:39:24 PM:     publishOrigin: ui
9:39:24 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
9:39:24 PM: Failing build: Failed to build site
9:39:24 PM: Finished processing build request in 24.526s
