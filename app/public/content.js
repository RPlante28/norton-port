// =====================================================================
//  content.js ,  ALL PORTFOLIO CONTENT lives here.
//  Edit THIS file to change what shows on the site. You never need to
//  touch index.html for content changes.
//
//  HOW IT WORKS
//  ------------
//  `root` is the file browser you see on the left. Every folder and file
//  is a plain object:
//
//    Folder:  { name:'PROJECTS', kind:'dir', size:'\u25b6SUB-DIR\u25c4',
//               date:'06.26.26', children:[ ...more items... ] }
//
//    Document:{ name:'WEBDEV .LOG', kind:'file', size:'3 584',
//               date:'08.20.23', doc: D({ ...the page content... }) }
//
//  Inside D({...}) the common fields are:
//    title     , big heading
//    meta      , small line under the title (dates / place)
//    sub       , one-line summary in italics
//    bullets   , array of paragraph/bullet strings
//    tags      , array of little pill labels
//    link      , a URL for the button;  linkLabel, the button text
//    imgSrc    , 'uploads/yourfile.png' to show an image
//    viz       , name of an ASCII animation (see animations.js for the list)
//    vizLabel  , caption shown above that animation
//
//  TO ADD A PROJECT: copy an existing { name:..., doc:D({...}) } block and
//  paste it into the children:[ ] array of the folder you want it in.
//
//  TO CHANGE THE INTRO CARD (name, GPA, AVAILABLE, paragraph): edit the
//  'WHOAMI .TXT' entry at the very top of `root`.
//
//  Helpers (don't change these):  D = document,  T = plain text,  A = ascii art
// =====================================================================
(function () {
    const D = (o)=>({ kind:'doc', ...o });
    const T = (body)=>({ kind:'text', body, editable:false });
    const A = (body)=>({ kind:'art', body, editable:false });
    const ART = {
portrait:
" .:      ..  .   ..   ..            ::-=-*\n"+
"::.   .   :       ..:               --=-:-\n"+
"-..         ..     .-               +*+=-:\n"+
"-. .:      :..      :             .:+**+-:\n"+
":. .-: ..  ...   .. ::--:         ::=##*+:\n"+
".. .-: .:.  .:.  .-=**##*=:      .-:=*#*+=\n"+
"::::-  ::.  .-.  .*%%%%%%%*-     .-:+****#\n"+
"-:.:-. ...  .:  .*%%%%%%%%%#=    .-:-+*#*#\n"+
"::::-. ...:...  *%%%###%%@%%#:   .=-=#***#\n"+
"::.:=. ::.     +#%%##+*%%%%%%*.  .+-=+**##\n"+
"-.:-=- ..   . .#####*++#%%%#%#+  .=--=-+#*\n"+
"=:--=-  :: :...#%##*+==+%%@%###  .--=+-*#%\n"+
"-:-::...   .  =#@#**+=-=*%#%#%%  .---*++*#\n"+
"-.  :  :.  .  +%%#*++=--=#%%%%%  :-==****#\n"+
"-   .  .--.:.-%@%#*+==--:#%%%%%- :---+++##\n"+
"...     :-=- -%%%#*+=---=*@%#%%* ::--==+*#\n"+
":--.   .:=+= :%%####+--+*#@%%%%#  .---++*#\n"+
"=---. . ..-- -%%##%%#:=**%@#%%%%  .---++##\n"+
"=:--.      . +%%#**#*:=*+#%#%%@%= :--==-*#\n"+
"==-.        :*%@#**#*:-++%#%#%%%* -==+==*#\n"+
":+=.  .   .--+%@#**#*:-=+*+%%%%%+=+=+*+=+#\n"+
":--. .:.. :=.+%%***+=.:-=+##%%@%#*+==+=-+*\n"+
"++-   ==.  ..+%%+**#-:----+#@%%%%#+=:::::=\n"+
"++:    .    .*%@+**#=-:--=%%@@%@%+-:.:-::-\n"+
"++-.        -%%@****+=--==+#@%@@*+-::--::#\n"+
"-:..        =%%@%***+=--==#%%%@@#=::=+--+%\n"+
":. .       :**%@@#**+=--==*%%%@@*:-+**==##\n"+
":....     .-#%%%@%**+=--=+%%%%@@#=+***++##\n"+
":..:.:-:.:==#%%#%%#*==-==#@%@%@@#++*#*+*%#\n"+
":--:::=--=+*%@%%%###+===+#@%%@@@#+++***##*\n"+
":==-:.---=**#%%%%#*#+=-=+#%@%@@@#=+*++*###\n"+
"-=-:::-:...##%%@#**#+=-=+##@@@@@%+=-++**#%\n"+
":=.-=.    +=%@%%*++**=-=*##@@%@@%+--=+**#*\n"+
"::-==     %#@@@%*+===*=+%#%@@@@%%#+=+***#+\n"+
"-:-=:.  =+#%%@%%%+=---+#%**@@@@@*#++*####+\n"+
"-::=-.:+=+@@@@%@%++=--=*%++%%@@@*#****%%%%",
fortune:
" ___________________________________\n"+
"/ \"Talk is cheap. Show me the code.\" \\\n"+
"\\          - Linus Torvalds          /\n"+
" -----------------------------------\n"+
"        \\   ^__^\n"+
"         \\  (oo)\\_______\n"+
"            (__)\\       )\\/\\\n"+
"                ||----w |\n"+
"                ||     ||",
coffee:
"            (  )   (   )  )\n"+
"             ) (   )  (  (\n"+
"             ( )  (    ) )\n"+
"            _____________\n"+
"           <_____________>___\n"+
"           |             |  \\\n"+
"           |             |   |\n"+
"           |             |   |\n"+
"        ___|             |  /\n"+
"       /   \\_____________/_/\n"+
"       \\_________________/\n"+
"\n"+
"   fueled by coffee & curiosity",
boot:
"   .----------------.\n"+
"   | .--------------.|\n"+
"   | |   ROHAN-DOS  ||\n"+
"   | |  PORTFOLIO   ||\n"+
"   | |  COMMANDER   ||\n"+
"   | '--------------'|\n"+
"   '----------------'\n"+
"      [::::::::::::]",
snake:
"          _________\n"+
"         / ___ ___ \\\n"+
"        | / o \\ o \\ |\n"+
"        | \\___/\\__/ |  ~~~~~~~~\n"+
"         \\____   ___/  ssssss\n"+
"  ___________ \\ /\n"+
" /            \\|\n"+
" \\_____________/   SNAKE.BAS  (c) 1982",
    };
    // (ART exposed via window.PORTFOLIO below)
    const root = { name:'C:\\ROHAN', path:'C:\\ROHAN', children:[
      { name:'WHOAMI .TXT', kind:'file', size:'3 072', date:'06.26.26', doc:{ kind:'info', body:
          'ROHAN-DOS, PORTFOLIO OPERATING MANUAL\n'+
          '=========================================\n\n'+
          'Welcome. You have booted into ROHAN-DOS: my portfolio,\n'+
          'built as a working homage to Norton Commander (1986).\n'+
          'Under the hood it is React, Vite, and Tailwind, compiled\n'+
          'to a fully static site, no server required.\n\n'+
          'WHO\n'+
          '  Rohan Plante, Computer Science, Marist University.\n'+
          '  I build systems with moving parts you can see.\n\n'+
          'GETTING AROUND\n'+
          '  \u2022 Click a folder on the left, then a file, to read it.\n'+
          '  \u2022 Arrows move \u00b7 Enter opens \u00b7 Backspace goes up a level.\n'+
          '  \u2022 Press  O  (or type  cli ) for a full-screen terminal.\n\n'+
          'WHAT TO EXPLORE\n'+
          '  EDUCATION/    Marist + Essex Tech, coursework\n'+
          '  EXPERIENCE/   roles, projects, and clubs\n'+
          '  SKILLS/       languages, tools, technologies\n'+
          '  AWARDS/       Eagle Scout, CTF, STEM honors\n'+
          '  PROGRAMS/     a real 6502 CPU emulator you can run\n'+
          '  HOBBIES/      music, climbing, hiking, cooking\n\n'+
          'KEYBOARD\n'+
          '  O   toggle CLI       Esc  close / back\n'+
          '  F1  help window      F6   contact\n\n'+
          'TRY TYPING\n'+
          '  help \u00b7 tree \u00b7 cat WHOAMI.TXT \u00b7 open raven \u00b7 mail\n\n'+
          'This file is the permanent manual, come back any time\n'+
          'with  cat WHOAMI.TXT  or by opening  WHOAMI.TXT .\n\n'+
          'For the full handbook, open  MANUAL.TXT  or type  guide .\n\n'+
          '- Rohan'
        } },
      { name:'MANUAL .TXT', kind:'file', size:'6 144', date:'07.10.26', doc:T(
        'ROHAN-DOS  \u00b7  USER\u2019S GUIDE                            v5.51\n'+
        '\n'+
        '  A portfolio that boots. This machine is a working DOS-style\n'+
        '  desktop: a two-pane file browser, a real command line, and a\n'+
        '  6502 CPU that runs actual machine code. This guide covers the\n'+
        '  documented parts. Poke around for the rest.\n'+
        '\n'+
        '..............................................................\n'+
        '1.  GETTING AROUND\n'+
        '..............................................................\n'+
        '\n'+
        '  The screen has two panes. The LEFT pane is a file browser; the\n'+
        '  RIGHT pane shows whatever is selected.\n'+
        '\n'+
        '    Arrows / Enter     move, open a folder or file\n'+
        '    Backspace          go up a directory\n'+
        '    O                  drop into the full command line\n'+
        '    F1 .. F10          the labeled keys along the bottom\n'+
        '\n'+
        '  Files open on the right: project write-ups, a resume viewer,\n'+
        '  photo galleries, and this manual.\n'+
        '\n'+
        '..............................................................\n'+
        '2.  THE COMMAND LINE\n'+
        '..............................................................\n'+
        '\n'+
        '  Press  O  for a full-screen terminal. Type  help  for the whole\n'+
        '  list; man <cmd> for detail. The essentials:\n'+
        '\n'+
        '    cd <dir> / ..      move around        ls \u00b7 dir \u00b7 tree\n'+
        '    open <file> / cat  read a file        ( cat *.txt globs )\n'+
        '    find / grep <t>    search names / contents\n'+
        '    edit <file>        the text editor    ( section 4 )\n'+
        '    6502              the CPU VM          ( section 3 )\n'+
        '    mail              send me a message\n'+
        '    go <github|linkedin>   open a link\n'+
        '    theme <amber|green|white>   change the phosphor\n'+
        '\n'+
        '  Commands chain with a pipe, like Unix:\n'+
        '\n'+
        '    grep foo | wc -l      ls | sort      cat *.txt | head 5\n'+
        '\n'+
        '  Up / Down recall history. Tab completes commands and files.\n'+
        '\n'+
        '..............................................................\n'+
        '3.  THE 6502 CPU\n'+
        '..............................................................\n'+
        '\n'+
        '  PROGRAMS holds a scalar-pipelined MOS 6502 that executes real\n'+
        '  machine code, one pipeline stage per clock. Open it from the\n'+
        '  PROGRAMS folder, or type  6502 .\n'+
        '\n'+
        '    Step / Run / Reload    drive the clock\n'+
        '    program: <dropdown>    pick a sample\n'+
        '    Edit code              write your own\n'+
        '\n'+
        '  Write your own: make a file ending in  .6502  or  .ASM  and it\n'+
        '  opens pre-filled with a working template. The full instruction\n'+
        '  set, addressing modes, and system calls are one command away:\n'+
        '\n'+
        '    6502 ref\n'+
        '\n'+
        '  Then:   6502 load MYPROG      6502 run\n'+
        '\n'+
        '..............................................................\n'+
        '4.  YOUR FILES, THE EDITOR & CONFIG\n'+
        '..............................................................\n'+
        '\n'+
        '  MY-FILES is yours. Create files with  make <name> , edit them\n'+
        '  with  edit <name> . The editor is modal, like vi:\n'+
        '\n'+
        '    i   insert     Esc  normal mode\n'+
        '    :w  save       :q   quit       :wq  save and quit\n'+
        '\n'+
        '  Your files persist in the browser between visits.\n'+
        '\n'+
        '  Configuration ( F5 ) sets panels, display, sound, and\n'+
        '  screensavers. The monitor comes in blue, amber, green, and\n'+
        '  white phosphor.\n'+
        '\n'+
        '..............................................................\n'+
        '5.  COLOPHON\n'+
        '..............................................................\n'+
        '\n'+
        '  Built with React, Vite, and Tailwind; ships as a static bundle\n'+
        '  with no server (the contact form is one PHP script). Source,\n'+
        '  and the rest of my work:\n'+
        '\n'+
        '    github.com/RPlante28        type  go github\n'+
        '    RESUME.PDF                  press  F4  or type  resume\n'+
        '\n'+
        '  Not everything this machine does is written down here.\n'
      ) },
      { name:'EDUCATION', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'09.01.24', children:[
        { name:'MARIST .EDU', kind:'file', size:'2 048', date:'09.01.24', doc:{ kind:'edu' } },
        { name:'ESSEX .EDU', kind:'file', size:'2 304', date:'06.01.24', doc:D({ title:'Essex North Shore Agricultural & Technical School', meta:'INFORMATION TECHNOLOGY SERVICES \u00b7 2020 \u2013 2024 \u00b7 DANVERS, MA', sub:'Vocational-technical high school, IT Services track \u00b7 GPA 4.48 / 5.0.', link:'https://www.essextech.net', linkLabel:'VISIT \u25b8', tags:['IT Essentials','Networks & Cybersecurity','Routing & Switching','Linux Essentials','Robotics','AP CS Principles (5)','AP CS A (5)'], bullets:[
          'Graduated with Academic High Honors; named MAVA Outstanding Vocational Technical Student for Essex Tech (2024).',
          'Completed 1,500+ hours of IT coursework spanning hardware, software, networking, Linux, cybersecurity, robotics, and data science.',
          'Self-studied and scored 5 on both AP Computer Science Principles and AP Computer Science A.',
          'Mentored younger students through their AP Computer Science coursework.' ] }) },
      ]},
      { name:'EXPERIENCE', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'09.05.25', children:[
        { name:'EMPLOYMENT', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'09.05.25', children:[
        { name:'CLASSIFY.LOG', kind:'file', size:'█ ███', date:'██.██.26', doc:D({ viz:'classified', vizLabel:'CONFIDENTIAL FILE · DETAILS REDACTED', title:'Internship', meta:'2026 – PRESENT · [[9]], [[2]]', sub:'A current internship on the infrastructure side; a few details are redacted until the term ends.', redacted:true, tags:['Internship','Infrastructure','[[8]]','[[6]]'], bullets:[
          'Currently interning on an infrastructure team, working on deployment, automation, and reliability.',
          'Hands-on with [[10]] and [[8]], plus the pipelines that move code and data between systems.',
          'Learning how large systems get provisioned, monitored, and kept healthy under real load.',
          'A full write-up is coming once the internship wraps up and I can share the details.' ] }) },
        { name:'DATA-ANL.LOG', kind:'file', size:'4 096', date:'09.05.25', doc:D({ viz:'dash', vizLabel:'CAMPUS ANALYTICS · LIVE', title:'Data Analyst Assistant', meta:'SEP 2025 \u2013 PRESENT', sub:'Office of Community & Belonging, Marist University · Poughkeepsie, NY', link:'https://www.marist.edu', linkLabel:'VISIT \u25b8', dataviz:true, bullets:[
          'Collect, organize, and analyze quantitative and qualitative campus data to surface trends and insights.',
          'Prepare reports and visualizations that help guide university leadership.',
          'Design and maintain internal databases and dashboards.' ] }) },
        { name:'WEBDEV .LOG', kind:'file', size:'3 584', date:'08.20.23', doc:D({ viz:'sheets', vizLabel:'SHEETS API → CURRICULUM MAPS', title:'Web Developer · Intern', meta:'SUMMER 2023', sub:'Essex North Shore Agricultural & Technical School · Danvers, MA', link:'https://www.essextech.net', linkLabel:'VISIT \u25b8', bullets:[
          'Built prototype pages integrating the Google Sheets API to create responsive curriculum maps.',
          'Automated Google Forms to Docs workflows, improving faculty efficiency.',
          'Presented prototypes to the school committee, administrators, and faculty.' ] }) },
        { name:'HERITAGE.LOG', kind:'file', size:'5 120', date:'06.01.25', doc:D({ viz:'blast', vizLabel:'HISTORIC PRESERVATION · BLAST FURNACE', title:'Future Leader to Supervisor', meta:'2020 \u2013 2025', sub:'Essex Heritage · Saugus & Salem, MA', link:'https://essexheritage.org', linkLabel:'VISIT \u25b8', bullets:[
          'Promoted to Supervisor (2025); lead peer workers in historic preservation alongside Park Rangers.',
          'Assisted the museum curator with archival care and collections management.',
          'Worked on carpentry, blacksmithing, fence building, and landscaping projects.' ] }) },
        ]},
      { name:'PROJECTS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.18.26', children:[
        { name:'EAGLE .PRJ', kind:'file', size:'7 168', date:'06.01.23', doc:D({ title:'Eagle Scout: King Pines Trail', meta:'MIDDLETON, MA · 2021\u20132023', sub:'A hiking trail and 40-ft boardwalk on conservation land.', link:'https://www.alltrails.com', linkLabel:'VIEW ON ALLTRAILS \u25b8', photoset:'trail', timeline:{ intro:['Over 10 years ago I joined Scouting as a Tiger Scout. Back then I could never have imagined the things I would learn or the bonds I would make, it has become an important part of who I am, and I bring the values of Scouting into every project I do.','In March 2023 I earned the rank of Eagle Scout, the highest rank in Scouting. For my Eagle Project I built a new trail in town, the King Pines Trail. Working with my beneficiary, the Middleton Stream Team, I kept the trail on town land by building a 40-ft elevated walkway from local decayed and dying cedar, and created educational materials about the trail and environment, linked for visitors via a QR code. The project was over 400 hours of work across 2 years.' ], entries:[{ date:'January 17, 2021', title:'Preliminary Planning and Initial Hike', desc:'The project began with a hike for preliminary planning, discussing trail markers, bench placements, and homeowner notifications, marking the start of the journey.', imgs:['uploads/eagle/firstHike.jpg'] },{ date:'January 31, 2021', title:'Trail Signage Planning and Second Hike', desc:'Detailed planning for trail direction and signage, and a rough map of the route. Engaged with conservation authorities for the necessary permissions.', imgs:['uploads/eagle/sign1.jpg','uploads/eagle/sign2.jpg'] },{ date:'February 28, 2021', title:'Trail Marking and Fourth Hike', desc:'Successful trail marking with flags and land-ownership confirmation. A detailed GPS map was created to guide the project\u2019s next steps.', imgs:['uploads/eagle/trailmarking.jpg'] },{ date:'April 1-6, 2021', title:'Elevated Walkway Planning and Initial Construction', desc:'Initiated the elevated walkway planning, presentations, dirt sampling for research, and kayak surveys for materials.', imgs:['uploads/eagle/dirt.jpg','uploads/eagle/boat.jpg'] },{ date:'April 29, 2021', title:'Project Approval and Preparations', desc:'The project was officially approved, addressing key concerns about environmental impact and material sourcing for the elevated walkway.', imgs:['uploads/eagle/presentation.jpg'] },{ date:'July 17, 2021 - September 25, 2022', title:'Walkway Construction', desc:'Extensive material gathering, construction, and community engagement, the phase that brought the walkway to life.', imgs:['uploads/eagle/walkway1.jpg','uploads/eagle/walkway2.jpg','uploads/eagle/walkway3.png','uploads/eagle/walkway4.png'] },{ date:'October 1 - November 3, 2022', title:'Final Touches and Cleanup', desc:'Debris clearance, signage installation, and trail beautification, ensuring a lasting impact on the community.', imgs:['uploads/eagle/cleanup1.jpg','uploads/eagle/service_project2.jpg'] },{ date:'December 2022 - January 2023', title:'Project Completion and Documentation', desc:'Finalized with a presentation for the Middleton Stream Team, completion of the Eagle Report, and thanking all contributors, the official end of the project.', imgs:['uploads/eagle/finaltrail.jpg'] } ], footer:{ text:'Watch a more detailed explanation of the project:', link:'https://middletonma.gov/CivicMedia?VID=463', linkLabel:'Board of Selectmen Presentation \u25b8', note:'Watch from 34:00, 49:00.' } }, bullets:[
          'Directed creation of a hiking trail and a 40-ft elevated boardwalk on conservation land.',
          'Coordinated 400+ volunteer hours, managing logistics, funding, and approvals.',
          'The trail is now featured on AllTrails with a 4.1-star community rating.' ] }) },
        { name:'WEB-DEV', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.26.26', children:[
          { name:'MCWSTARZ.WEB', kind:'file', size:'5 120', date:'06.15.23', doc:D({ viz:'court', vizLabel:'MCW STARZ \u00b7 GAME DAY', title:'MCW Starz Basketball Club', meta:'2022 \u2013 2023', sub:'A mobile-friendly club site, built to be handed down.', link:'https://www.mcwstarz.com', linkLabel:'VISIT SITE \u25b8', imgSrc:'uploads/mcwstarz-logo.png', tags:['HTML','CSS','JavaScript','Responsive','Social Feeds'],
            beforeSrc:'uploads/mcwstarz-before.png', afterSrc:'uploads/mcwstarz-after.png', beforeLabel:'BEFORE \u00b7 2021', afterLabel:'AFTER \u00b7 2023', beforeAfterLabel:'BEFORE / AFTER \u00b7 VIA WAYBACK MACHINE', bullets:[
            'Built a secure, mobile-friendly website for the MCW Starz basketball club with integrated social-media feeds.',
            'Designed responsive layouts that improved accessibility and engagement across phones and tablets.',
            'Most importantly: structured the code and content so future students could maintain and extend it without starting from scratch.',
            'The site has since been redesigned by later students, but much of the structure and many of the ideas we put in place are still there.' ] }) },
          { name:'ISWPHIL .PHP', kind:'file', size:'10 240', date:'08.30.26', doc:D({ viz:'web', vizLabel:'RESPONSIVE REBUILD', title:'ISW Philosophy, Website Redesign', meta:'WINTER 2025 \u2013 SUMMER 2026', sub:'International Society for World Philosophy · iswphil.org', link:'https://iswphil.org', linkLabel:'VISIT SITE \u25b8', tags:['WordPress','PHP','Custom Theme','UX'], imgSrc:'uploads/ISWP_SUP_SIMP_LOGO.svg', imgFilter:true,
            bullets:[
            'Redesigned and modernized the site for the International Society for World Philosophy over last winter and this summer.',
            'Built a backend largely in PHP, kept WordPress-compatible so it slots cleanly into the existing stack.',
            'Structured the theme and admin so the site owner can manage and update content easily, without touching code.',
            'Modernized the layout, typography, and responsiveness while preserving the society\u2019s identity.' ] }) },
          { name:'NORTON .PRJ', kind:'file', size:'14 336', date:'06.26.26', doc:D({ viz:'boot', vizLabel:'NORTON COMMANDER \u00b7 BOOT SEQUENCE', title:'This Portfolio', meta:'REACT · VITE · TAILWIND · 2026', sub:'A DOS-era interface that boots, runs real programs, and showcases my work.', link:'#', linkLabel:'- YOU ARE HERE -', tags:['React','Vite','Tailwind','6502 Emulator','DOS UI','Static Deploy'], bullets:[
            'Built as a faithful Norton Commander / DOS text-mode interface: a boot / POST sequence, a two-pane file browser, a block mouse cursor, dithered scrollbars, a function-key bar, and an optional CRT scanline effect.',
            'The front end is React 18 with Vite and Tailwind CSS, organized into small single-purpose components (the shell, the content views, and the dialogs) so it stays easy to maintain and extend.',
            'All the behavior lives in a framework-agnostic engine that React subscribes to and renders, which keeps the logic and the interface cleanly separated.',
            'Runs a small in-page operating system: a virtual file system, a vim-style editor, a command line with its own parser (cd, ls, cat, tree, grep, and more), folder management saved to local storage, and an email composer.',
            'Embeds a live scalar-pipeline 6502 CPU emulator you can step through one instruction at a time, and opens interactive Tableau dashboards in popup windows.',
            'Content, the ASCII animations, and the CPU core each live in their own plain files, so the site can be updated without touching the app code.',
            'Compiles to a fully static bundle with Vite and deploys to GoDaddy with no server; the only backend is a small PHP script that powers the contact form. Linted and formatted with ESLint and Prettier.' ] }) },
        ]},
        { name:'FULL-STACK', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.26.26', children:[
          { name:'MARISTMAPS.PRJ', kind:'file', size:'12 480', date:'04.20.26', doc:D({ viz:'route', vizLabel:'INDOOR / OUTDOOR ROUTE SOLVER', title:'MaristMaps', meta:'BEST OVERALL · APR 2026', sub:'A campus navigation platform with a voice-enabled AI agent, built with a team.', link:'https://github.com/RPlante28/MaristMaps', linkLabel:'OPEN REPO \u25b8', tags:['Flask','MapLibre GL','PostGIS','NetworkX','LangChain'], bullets:[
            'Won Best Overall at Marist\u2019s Spring 2026 hackathon: a Google Maps-style navigator for indoor and outdoor routing.',
            'Designed an indoor routing algorithm that flattens multi-floor paths and stitches them through shared stairs and elevators.',
            'Built mobile GPS surveying and desktop editing tools to map entrances, stairs, elevators, rooms, and hallways across campus.' ] }) },
          { name:'KITCHEN .SQL', kind:'file', size:'6 656', date:'12.10.25', doc:D({ viz:'pantry', vizLabel:'RECIPE RECOMMENDER · LIVE', title:'Kitchen Management Suite', meta:'SEP \u2013 DEC 2025', sub:'A full-stack pantry and recipe manager for households, built with a team.', link:'https://github.com/Kitchen-Management-Suite/kitchen_management_suite', linkLabel:'OPEN REPO \u25b8', tags:['Flask','PostgreSQL','Custom JS'], bullets:[
            'Built a full-stack app with a relational database supporting multi-household recipe and pantry management.',
            'Implemented recipe creation and recommendation, role-based access control, and household membership.',
            'Wrote a seeding script that populates the database with realistic users, groups, items, and recipes.' ] }) },
        ]},
        { name:'SYSTEMS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.26.26', children:[
          { name:'CPU6502 .TS', kind:'file', size:'8 192', date:'05.02.26', doc:D({ viz:'pipe', vizLabel:'SCALAR PIPELINE · LIVE TRACE', title:'6502 Emulator', meta:'MAR \u2013 MAY 2026', sub:'A scalar-pipelined CPU, rebuilt one stage at a time.', demo:true, tags:['TypeScript','Node.js'], bullets:[
            'Built a 6502 with fetch, decode, execute, writeback, and interrupt-check stages advancing one slot per clock cycle.',
            'Implemented hazard handling: fetch stalls on register dependencies, multi-cycle execute stalls, and pipeline flushes on branches.',
            'Measured performance with IPC, stall, and flush metrics, validated against hand-written machine code.',
            'A faithful port of this CPU runs live on this site, press RUN THE LIVE DEMO to open it in PROGRAMS.' ] }) },
          { name:'RAVEN-V .ML', kind:'file', size:'9 216', date:'08.15.24', doc:D({ viz:'radar', vizLabel:'LiDAR SWEEP · OBJECT DETECTION', title:'RAVEN-V', meta:'2023 \u2013 2024', sub:'An autonomous self-driving car prototype.', photoset:'raven', tags:['LiDAR','OpenCV','Machine Learning'], bullets:[
            'Designed and built a working prototype integrating LiDAR, computer vision, and ML for real-time navigation.',
            'Handled object detection and path-finding live from sensor data.' ] }) },
        ]},
        { name:'HGCHESTS .JAR', kind:'file', size:'5 632', date:'09.10.25', doc:D({ viz:'loot', vizLabel:'HUNGER GAMES · CHEST TIER ROLL', title:'Randomized Tiered Chests', meta:'MARIST MINECRAFT SERVER · EVENT TOOLING', sub:'A Minecraft plugin that auto-tiers Hunger Games loot chests.', link:'https://github.com/RPlante28/Randomized_Tiered_Chests', linkLabel:'OPEN REPO ▸', tags:['Java','Spigot/Paper','Gradle','Minecraft','Plugin Dev'], goto:'MCSERVER', gotoLabel:'MARIST MC SERVER ▸', bullets:[
          'Built a Spigot/Paper plugin in Java (Gradle, Kotlin DSL) to automate loot setup for the server’s Hunger Games events.',
          'Scans every chest in an arena and rolls each one a randomized tier from a weighted probability table, so no two matches loot the same.',
          'Companion to the HungerGames plugin: it reads that plugin’s arena file structure and writes the tier assignments back into it.',
          'Turned a slow, manual, per-chest chore into a one-command roll, so event nights start faster.' ] }) },
      ]},
      { name:'EXTRACURRICULARS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'09.10.25', children:[
        { name:'SCOUTING.LOG', kind:'file', size:'3 584', date:'12.03.23', doc:D({ title:'Scouting, Eagle Scout', meta:'SCOUTS BSA · TROOP 19, MIDDLETON, MA · 2016 – 2024', imgSrc:'uploads/eagle-citation.jpg', dither:true, tags:['Eagle Scout','Order of the Arrow','Leadership','Service'], goto:'EAGLE', gotoLabel:'EAGLE SCOUT PROJECT ▸', goto2:'ARROW', gotoLabel2:'ORDER OF THE ARROW ▸', bullets:[
          'In Scouting from a young age through Scouts BSA, roughly 5th grade to 12th grade (graduated 2024), with Troop 19 in Middleton, MA.',
          'Earned the rank of Eagle Scout in March 2023, the highest rank in Scouting.',
          'For my Eagle Scout Project I designed and built the King Pines Trail: a hiking trail and 40-ft elevated boardwalk on conservation land, over 400 volunteer hours across 2 years.',
          'Inducted into the Order of the Arrow, Scouting’s national honor society, and earned three Silver Palms.',
          'Honored by the Massachusetts State Senate with an Official Citation for attaining Eagle Scout (December 2023).',
          'Scouting shaped how I lead, plan, and follow through, I carry its values into every project I do.' ] }) },

        { name:'MCSERVER.LOG', kind:'file', size:'3 328', date:'09.10.25', doc:D({ viz:'mc', vizLabel:'MARIST MC SERVER \u00b7 EVENT NIGHT', title:'Event Coordinator, Marist Minecraft Server', meta:'MARIST UNIVERSITY \u00b7 2024 \u2013 PRESENT', tags:['Java','Spigot/Paper Plugins','Server Admin','Event Ops','Community'], goto:'HGCHESTS', gotoLabel:'RANDOMIZED TIERED CHESTS \u25b8', bullets:[
          'Plan, set up, and run community events on the Marist Minecraft server, from concept through game-night execution.',
          'Manage server plugins, and built custom plugins to automate event flow and smooth out the rough edges.',
          'Handle backend server management: configuration, uptime, performance, and world/data upkeep.',
          'Coordinate and communicate with players, keeping events organized and the community engaged.' ] }) },
        { name:'COMPSOC .LOG', kind:'file', size:'2 816', date:'09.01.26', doc:D({ title:'Marist Computer Society', meta:'MARIST UNIVERSITY \u00b7 2026 \u2013 PRESENT', tags:['Leadership','Event Planning','Hackathon','Community'], bullets:[
          'Elected Secretary in Spring 2026, then Vice President for Fall 2026.',
          'Help plan all club meetings and keep the semester running smoothly.',
          'Bring in new ideas and work to expand the club\u2019s activities.',
          'Especially focused on growing our hackathon.' ] }) },
      ]},
      ]},
      { name:'SKILLS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.26.26', children:[
        { name:'LANGUAGES.TXT', kind:'file', size:'1 280', date:'06.26.26', doc:D({ title:'Languages', meta:'PROGRAMMING LANGUAGES', tags:['Python','TypeScript','JavaScript','Java','C','SQL','PHP','HTML/CSS'], bullets:[
          'Daily drivers are Python and TypeScript, Flask backends, tooling, and a fully pipelined CPU emulator.',
          'Java and C for systems work and coursework; SQL for relational schema design and seeding.',
          'PHP, HTML, and CSS for the ISW Philosophy WordPress theme.' ] }) },
        { name:'TOOLS .TXT', kind:'file', size:'1 280', date:'06.26.26', doc:D({ title:'Tools', meta:'TOOLCHAIN & PLATFORMS', tags:['Git','Node.js','Flask','PostgreSQL','PostGIS','Linux','VS Code','Tableau'], bullets:[
          'Git for everything; Node.js and Flask for app servers.',
          'PostgreSQL + PostGIS for relational and spatial data.',
          'Tableau for the analytics dashboards in EXPERIENCE.' ] }) },
        { name:'TECH .TXT', kind:'file', size:'1 280', date:'06.26.26', doc:D({ title:'Technologies', meta:'DOMAINS & LIBRARIES', tags:['Machine Learning','OpenCV','LiDAR','MapLibre GL','NetworkX','LangChain','WordPress'], bullets:[
          'Computer vision and ML for the RAVEN-V autonomous prototype (OpenCV, LiDAR fusion).',
          'Geospatial routing with MapLibre GL and NetworkX for MaristMaps.',
          'LLM agents via LangChain; WordPress/PHP theming for client work.' ] }) },
      ]},
      { name:'AWARDS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'11.20.24', children:[
        { name:'HARRIS .AWD', kind:'file', size:'1 280', date:'07.01.21', doc:D({ title:'Bernard Harris STEM Supernova Award', meta:'2021', sub:'Recognized for excellence in STEM at the Bernard Harris Summer Science Camp.', link:'https://www.thespacecenter.org/bernard-harris-summer-science-camp', linkLabel:'SOURCE \u25b8', bullets:[] }) },
        { name:'ARROW .AWD', kind:'file', size:'1 280', date:'05.10.21', doc:D({ title:'Order of the Arrow Inductee', meta:'2021', sub:'Inducted into Scouting\u2019s national honor society; earned three Silver Palms.', link:'https://oa-bsa.org', linkLabel:'SOURCE \u25b8', bullets:[] }) },
        { name:'MAVA .AWD', kind:'file', size:'1 280', date:'05.20.24', doc:D({ title:'2024 Outstanding Vocational Technical Student Award', meta:'DATE EARNED: MAY 2024 · FOR ESSEX TECH', sub:'Massachusetts Association of Vocational Administrators honoree.', link:'https://www.essextech.net', linkLabel:'SOURCE \u25b8', imgSrc:'uploads/mava_award.jpg', dither:true, bullets:['Awarded in recognition of exceptional academic achievement and leadership in the vocational technical field.'] }) },
        { name:'CYBER .AWD', kind:'file', size:'1 536', date:'11.15.22', doc:D({ title:'Fall 2022 National Cyber League', meta:'DATE EARNED: FALL 2022', sub:'National collegiate cybersecurity competition (Cyber Skyline).', link:'https://nationalcyberleague.org', linkLabel:'SOURCE \u25b8', imgSrc:'uploads/genCyber.jpg', dither:true, bullets:[
          'Team Game: placed 369th of 3,926 competing teams in the country.',
          'Individual Game: placed 1,137th of 6,679 individuals across the country.',
          'Also placed 1st of 40 at the UMass Lowell GenCyber CTF.' ] }) },
      ]},
      { name:'PROGRAMS', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.22.26', children:[
        { name:'CPU6502 .SYS', kind:'file', size:'4 096', date:'06.22.26', doc:{ kind:'vm' } },
        { name:'DOOM .EXE', kind:'file', size:'2 322', date:'06.22.26', doc:T(
          'DOS/4GW Protected Mode Run-time\n'+
          '----------------------------------------\n'+
          'Cannot run DOOM.EXE:\n'+
          '  requires an Intel 486DX and 8 MB RAM.\n\n'+
          'This machine is a 6502 @ 1.79 MHz.'
        ) },
      ]},
      { name:'HOBBIES', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.28.26', children:[
        { name:'MUSIC .TXT', kind:'file', size:'1 920', date:'06.28.26', doc:D({ viz:'wave', vizLabel:'WAVEFORM \u00b7 LIVE TAKE', title:'Music', meta:'PLAYING \u00b7 WRITING \u00b7 LISTENING', tags:['Drums','Bass','Guitar','Songwriting'], bullets:[
          'Play guitar, bass, and drums, currently in a band in college.',
          'In high school, played with friends for the talent shows and graduation.',
          'I spend time across all of it: writing, playing, and listening closely. (Videos coming once I dig them up.)' ] }) },
        { name:'GAMING .TXT', kind:'file', size:'2 048', date:'06.28.26', doc:D({ viz:'hud', vizLabel:'PLAYER HUD \u00b7 NO HITS TAKEN', title:'Gaming', meta:'SOULS-LIKE \u00b7 METROIDVANIA \u00b7 ROGUELIKE', tags:['Elden Ring','Dark Souls','Hollow Knight','Silksong'], bullets:[
          'Drawn to Souls-likes, Metroidvanias, and roguelikes, genres that reward patience and pattern reading.',
          'Favorites: Elden Ring, Dark Souls, Hollow Knight, and Silksong.',
          'Same instinct as debugging: read the system, fail, adjust, and run it back until it clicks.' ] }) },
        { name:'CLIMBING.TXT', kind:'file', size:'1 792', date:'06.28.26', doc:D({ viz:'ascent', vizLabel:'PROBLEM \u00b7 SEND', title:'Climbing', meta:'BOULDERING', tags:['Bouldering','Problem-solving','Progression'], bullets:[
          'Boulder regularly, short, hard problems where the route is the puzzle.',
          'Got a group of friends into it; now it is how we hang out and push each other.',
          'Love the progression: a wall that felt impossible last month becomes a warm-up.' ] }) },
        { name:'HIKING', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'06.28.26', children:[
          { name:'NOTABLE .TXT', kind:'file', size:'2 048', date:'06.28.26', doc:D({ viz:'ridge', vizLabel:'ELEVATION PROFILE \u00b7 SUMMITS', title:'Notable Hikes', meta:'NEW ENGLAND \u00b7 CATSKILLS', tags:['Monadnock','Devil\u2019s Path'], bullets:[
            'Mt. Monadnock (NH, 3,165 ft), my baseline mountain. Where I first hiked as a scout; climbed it many times, most recently June 2026.',
            'Devil\u2019s Path (Catskills, NY), Summer 2025. ~24 mi point-to-point, ~9,000 ft of elevation gain over 6 peaks, with steep ledgy scrambles. Widely cited as one of the hardest day hikes in the Eastern US.',
            'Monadnock keeps me honest; the Devil\u2019s Path proved I could go further than I thought.' ] }) },
          { name:'FUTURE .TXT', kind:'file', size:'2 048', date:'06.28.26', doc:D({ viz:'ridge', vizLabel:'ROUTE PLAN \u00b7 PROGRESSION', title:'Future Hikes', meta:'THE TICK LIST', tags:['NH','MA','NY','ME','WA'], bullets:[
            'Mt. Chocorua (NH, 3,490 ft), Piper Trail ~8.8 mi round trip, ~2,600 ft gain; moderate, rocky open summit. A natural step up from Monadnock.',
            'Mt. Greylock (MA, 3,489 ft), highest point in MA. Cheshire Harbor Trail ~6.6 mi round trip, ~1,900 ft gain; moderate, longer day.',
            'Mt. Washington (NH, 6,288 ft), Northeast\u2019s tallest. Tuckerman Ravine ~8.4 mi round trip, ~4,250 ft gain; strenuous, notoriously severe weather.',
            'Great Range Traverse (Adirondacks, NY), ~25 mi, ~9,000+ ft gain over ~9 High Peaks incl. Gothics, Saddleback, Basin, Haystack, and Marcy. One of the toughest ridge days in the East.',
            'Katahdin (ME, 5,269 ft), Knife Edge loop ~10\u201311 mi, ~4,200 ft gain; exposed 1.1-mi arete finish. The hardest day-hike on the Northeast list.',
            'Mt. Rainier (WA, 14,411 ft), THE END GOAL. A glaciated alpine climb (Disappointment Cleaver ~9 mi, ~9,000 ft gain) needing rope, crampons, and ice axe. Everything else on this list is training for it.' ] }) },
        ]},
        { name:'COOKING .TXT', kind:'file', size:'1 920', date:'06.28.26', doc:D({ viz:'steam', vizLabel:'HEAT \u00b7 EXPERIMENT', title:'Cooking', meta:'EXPLORATORY \u00b7 FUSION', tags:['Indian','Asian','Greek','Mexican','Fusion'], bullets:[
          'Cook constantly and experiment more than I follow recipes.',
          'Range across Indian, Asian, Greek, and Mexican food, and like mashing them together.',
          'Best dishes usually come from "what happens if I combine these two things" rather than a plan.' ] }) },
      ]},
      { name:'DEVLOG', kind:'dir', size:'\u25b6SUB-DIR\u25c4', date:'07.08.26', children:[
        { name:'CLITOOLS.LOG', kind:'file', size:'2 560', date:'07.08.26', doc:D({ title:'A real shell', meta:'DEVLOG \u00b7 JULY 2026', sub:'Turning the command line into something you can actually work in.', tags:['grep','find','wc','man','themes'], bullets:[
          'Made grep, find, and wc search the whole tree, including project text and tech tags, so you can grep for a skill (try  grep python ).',
          'Added man pages, head / tail / stat, echo redirection, and a neofetch-style sysinfo card.',
          'Gave the monitor amber, green, and white phosphor modes, and shareable deep links to any file or folder.' ] }) },
        { name:'REBUILD .LOG', kind:'file', size:'2 304', date:'06.26.26', doc:D({ title:'The React rebuild', meta:'DEVLOG \u00b7 JUNE 2026', sub:'From one giant HTML file to a modular React, Vite, and Tailwind app.', tags:['React','Vite','Tailwind','ESLint'], bullets:[
          'Split the old single file into small single-purpose components, with all the behavior in one framework-agnostic engine.',
          'Kept the content, the ASCII animations, and the 6502 core as plain, editable files.',
          'Compiles to a fully static bundle and still deploys to cPanel with a single zip.' ] }) },
      ]},
      { name:'MY-FILES', kind:'dir', home:true, size:'\u25b6SUB-DIR\u25c4', date:'06.25.26', children:[] },
      { name:'SENDMAIL.EXE', kind:'file', size:'1 024', date:'06.25.26', doc:{ kind:'contact' } },
    ]};

    const edu = { school:'Marist University', degree:'B.S. in Computer Science', dates:'2024 \u2013 PRESENT', gpa:'3.67 / 4.0', location:'POUGHKEEPSIE, NY',
      meta:'B.S. COMPUTER SCIENCE \u00b7 2024 \u2013 PRESENT \u00b7 POUGHKEEPSIE, NY',
      sub:'Undergraduate, Computer Science \u00b7 GPA 3.67 / 4.0.',
      notes:[ 'Dean\u2019s List, all semesters.', 'A majority of my Computer Science classes center on hands-on, project-based work: building real systems rather than just studying them.' ],
      coursework:['Software Systems Analysis','Software Development I/II','System Design','Internetworking','Computer Organization & Architecture','Database Management','Data Communications','Discrete Math','Calculus II'] };

  // Expose everything to the app. (index.html reads window.PORTFOLIO.)
  window.PORTFOLIO = { D, T, A, ART, root, edu };
})();
