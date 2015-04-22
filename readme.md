##System requirement:

###Server side:
1. Unix/Unix-like server (the file locking depends on the unix-like sytem)

2. Web server with Perl 5.8 CGI support

###Client side:
1. Web browser with Javascript, xmlHttpRequest support. (IE 5, 6 and Firefox 2.0.0.9 are tested, but the Firefox of Lab2 have bugs =_=)

##For the coding, just 4 files:

swords.html <- html only, starting point of the game
swords.js <- javascript, front end control
server.pl <- perl cgi, as a server, control the game flow
view.pl <- just for fun, a console mode script to view the steps of 4 players ^_^

##for the data, there are 2 directories:

./games/ <- files for games, make sure the cgi user can read/write this directory.
./images/ <- images of the game


##How do I hold the data ?
1. data of each is stored in a file at ./games.
2. the game file name is MD5 hash of "sWoRd" + [game name], which is 32 byte long.
3. the data file will be locked for every request, and unlock it after everything done, so there is ONLY 1 player read/write the file each time.



