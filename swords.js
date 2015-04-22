
/*** [start ]game settings ***/

var battle_size = 9;	//battle field size, >= 2
//var playerA = "playerA";
//var playerB = "playerB";
var player = "player";
var player_num = 4;

var IMG_DIR = "images/";
var img_empty = IMG_DIR+"empty.gif";
var COLOR_WALK = "#444444";
var COLOR_STEP = "#888888";
var COLOR_DIR = "#550055";
var COLOR_SWORD = "#ff00ff";
var COLOR_BG = "black";

var playerSelf = 0; // user player type
var	players = new Array();

/* login data */
var game = "";
var uname = "";
var passwd = "";

/* flow control */
var round = -100;
var state_join = false;
var keep_update = false;
var winner = -1;

var cmds = new Array();

/*** [end] game settings ***/

/*** [start] page loaded ***/

//alert(getPlayer(playerA));
//alert(getPlayer(playerB));

/*** [end] page loaded ***/

/** [start] functions ***/
function initPlayer(p_no, name, x, y, dir){
	players[p_no] = new Player();
	players[p_no].id = p_no;
	players[p_no].name = name;
	players[p_no].x = x;
	players[p_no].y = y;
	players[p_no].dir = dir;
	players[p_no].hp = 100;
	players[p_no].seq = -1000;
	players[p_no].alive = true;

	for(var i=0; i <= 8; i++){
			
		players[p_no].img[i] = IMG_DIR + "p_" + p_no + "_" + i + ".gif";
	}

}
function gameLoad(self_size){
	battle_size = self_size;
	makeBattleField(battle_size);


	document.getElementById("battle_field").style.display = "none";

	for(var i=0; i < player_num; i++){
		document.getElementById("row_p"+i).style.display = "none";
	}	

	gamePlay();
}

function gamePlay(){
	
	// create players, should be used by command on live
	initPlayer(0, "April", 0, 0, 5);
	initPlayer(1, "Berry", battle_size-1 , battle_size-1, 1);
	initPlayer(2, "Cherry", 0, battle_size-1, 3);
	initPlayer(3, "David", battle_size-1, 0, 7);

	updateBattle();
}

function updateBattle(){
	// clear the field
	allEmpty();
	colorAllLand(COLOR_BG);
	// go through all player
	for(var i=0; i < players.length; i++){
		var tmp = players[i];
		// if player used, and alive
		if(tmp.use && tmp.alive){
			// put the players on the field
			if(playerSelf != i && players[playerSelf].walkX == tmp.x && players[playerSelf].walkY == tmp.y){
			}else{
				getLand(tmp.x, tmp.y).src = tmp.img[tmp.dir];
			}

			// if I control that player
			if(tmp.me){
					// set the possible walk path
					colorNextLand(tmp.x, tmp.y, COLOR_WALK);
					colorLand(tmp.x, tmp.y, COLOR_WALK);

					if(tmp.walk){
						colorNextLand(tmp.walkX, tmp.walkY, COLOR_DIR);
						colorLand(tmp.walkX, tmp.walkY, COLOR_STEP);
						getLand(tmp.x, tmp.y).src = img_empty;
						getLand(tmp.walkX, tmp.walkY).src = tmp.img[tmp.dir];
						
					}
					if(tmp.turn){
							colorLand(tmp.turnX, tmp.turnY, COLOR_SWORD);
							getLand(tmp.walkX, tmp.walkY).src = tmp.img[tmp.turnDir];
						
					}
			}
		}
	}
}


function Player(){
	this.me = false;
	this.use = false;
	this.seq = -1000;
	this.x = 0;
	this.y = 0;
	this.dir = 0;
	this.hp = 100;
	this.id = 0;
	this.name = "";	
	this.img = new Array();
	this.walk = false;
	this.walkX = -1;
	this.walkY = -1;
	this.turn = false;
	this.turnX = -1;
	this.turnY = -1;
	this.turnDir = 1;
	this.alive = true;
}

function Position(){
	this.x = 0;
	this.y = 0;
}

function reset(){
	players[playerSelf].walk = false;	
	players[playerSelf].turn = false;	
	updateControl();
}

function upPlayerAct(){

	players[playerSelf].walkX = parseInt(cmds["p_nx_"+playerSelf]);
	players[playerSelf].walkY = parseInt(cmds["p_ny_"+playerSelf]);
	players[playerSelf].turnDir = parseInt(cmds["p_ndir_"+playerSelf]);
	players[playerSelf].walk = true;
	players[playerSelf].turn = true;

	switch(players[playerSelf].turnDir){
		case 1: case 7: case 8:
			players[playerSelf].turnX = players[playerSelf].walkX - 1;
			break;
		case 3: case 4: case 5:
			players[playerSelf].turnX = players[playerSelf].walkX + 1;
			break;
		default:
			players[playerSelf].turnX = players[playerSelf].walkX;
	}

	switch(players[playerSelf].turnDir){
		case 1: case 2: case 3:
			players[playerSelf].turnY = players[playerSelf].walkY - 1;
			break;
		case 5: case 6: case 7:
			players[playerSelf].turnY = players[playerSelf].walkY + 1;
			break;
		default:
			players[playerSelf].turnY = players[playerSelf].walkY;
	}
}

function showXY(obj){
	//document.title = obj.id + " | " + getPosition(obj).x + ", " + getPosition(obj).y;
}

/*
 * Get the direction number by reference to (ox,oy)
 * 123
 * 8P4
 * 765
 * */
function getDir(ox, oy, tx, ty){
	
	if(tx == ox-1 && ty == oy-1) return 1;
	if(tx == ox && ty == oy-1) return 2;
	if(tx == ox+1 && ty == oy-1) return 3;

	if(tx == ox-1 && ty == oy) return 8;
	if(tx == ox+1 && ty == oy) return 4;

	if(tx == ox-1 && ty == oy+1) return 7;
	if(tx == ox && ty == oy+1) return 6;
	if(tx == ox+1 && ty == oy+1) return 5;
	
	return 0;
}

function atNext(ox, oy, tx, ty){
	if(tx >= ox - 1 && tx <= ox + 1 && ty >= oy - 1 && ty <= oy + 1){
		return true;
	}	
	return false;
}

function showWalk(obj){
	var post = getPosition(obj);
	var p = players[playerSelf];

	if(!p.me) return;
	if(p.walk) return;

	if(atNext(p.x, p.y, post.x, post.y)){
		colorNextLand(post.x, post.y, COLOR_DIR);
		colorLand(post.x, post.y, COLOR_STEP);
	}
	//document.title = getDir(p.x, p.y, post.x, post.y);

}
function doWalk(obj){


	var post = getPosition(obj);
	var p = players[playerSelf];

	if(!p.me) return;
	if(p.walk) return;
	if(atNext(p.x, p.y, post.x, post.y)){
		p.walkX = post.x;	
		p.walkY = post.y;	
		p.walk = true;
	}

	updateBattle();
}
function showSword(obj){
	var post = getPosition(obj);
	var p = players[playerSelf];
	var d = getDir(p.walkX, p.walkY, post.x, post.y);

	if(!p.me) return;
	if(!p.walk) return;
	if(p.turn) return;

	//alert("p.turn = " + p.turn);
	if(atNext(p.walkX, p.walkY, post.x, post.y) && d > 0){
		colorLand(post.x, post.y, COLOR_SWORD);
		getLand(p.walkX, p.walkY).src = p.img[d];
	}
	//document.title = getDir(p.x, p.y, post.x, post.y);

}
function doSword(obj){
	var post = getPosition(obj);
	var p = players[playerSelf];
	var d = getDir(p.walkX, p.walkY, post.x, post.y);

	if(!p.me) return;
	if(!p.walk) return;
	if(p.turn) return;

	if(atNext(p.walkX, p.walkY, post.x, post.y) && d > 0){
		//colorLand(post.x, post.y, COLOR_SWORD);
		//getLand(p.walkX, p.walkY).src = p.img[d];
		p.turnX = post.x;
		p.turnY = post.y;
		p.turnDir = d;
		p.turn = true;
	}
	updateControl();	
}
function mover(obj){
	if(winner >= 0) return;
	if(!players[playerSelf].alive) return;
	if(round < 0) return;	
	showWalk(obj);
	showSword(obj);
	//showXY(obj);
}

function mout(obj){
	if(winner >= 0) return;
	if(!players[playerSelf].alive) return;
	if(round < 0) return;	
	var post = getPosition(obj);
	updateBattle();	
}
function mclick(obj){
	if(winner >= 0) return;
	if(!players[playerSelf].alive) return;
	if(round < 0) return;	
	doWalk(obj);	
	doSword(obj);
}

function getPosition(obj){
	var post = new Position();
	post.x = parseInt(obj.getAttribute("gameX"));
	post.y = parseInt(obj.getAttribute("gameY"));
	return post;
}
/* get the id of the player */
function getPlayer(p){
	var tmp = document.getElementsByTagName("img");

	for(i=0; i < tmp.length; i++){
	   if (tmp[i].getAttribute(player) ==  p){
		//alert( tmp[i].getAttribute("id"));
		return tmp[i].getAttribute("id");
	    }
	}
	//alert(false);
	return false;
}
    
/* set the player on a Land */
function setPlayer(x, y, p){
	var tmp = getPlayer(p);
	if(tmp){	    
		document.getElementById(tmp).setAttribute(player, "");
		document.getElementById(tmp).src = imgE;
	}
	getLand(x, y).setAttribute(player, p);
}

/* get a Land (img object) from the battle field */
function getLand(x, y){
	return document.getElementById("L_" + x + "_" + y);
}


function colorNextLand(x, y, color){

	x = parseInt(x);
	y = parseInt(y);

	colorLand(x-1, y-1, color);	
	colorLand(x-1, y, color);	
	colorLand(x-1, y+1, color);	
	colorLand(x, y-1, color);	
	colorLand(x, y+1, color);	
	colorLand(x+1, y-1, color);	
	colorLand(x+1, y, color);	
	colorLand(x+1, y+1, color);	
}

function colorAllLand(color){
	for(var i=0; i < battle_size; i++){
	    for(var j=0; j < battle_size; j++){
				colorLand(i, j, color);
	    }
	}
}

function colorLand(x, y ,color){
	var tmp = getLand(x, y);
	if(tmp){
		// Firefox only, IE sucks
		//tmp.parentNode.setAttribute("style", "background-color:" + color);
	
		// works for both IE and Firefox
		tmp.parentNode.style.cssText = "background-color:" + color;
	}
}
/* update the images of Land(s) */

function allEmpty(){
	for(var i=0; i < battle_size; i++){
		for(var j=0; j < battle_size; j++){
			setImg(i, j, img_empty);
		}
	}
}
function setImg(x, y, img){
	if (x >= battle_size || y >= battle_size || x < 0 || y < 0 ){
	    return false;
	}
	getLand(x, y).src = img;	
	return true;
}

function makeBattleField(s){
	var script = ' onmouseout="mout(this)" onmouseover="mover(this)" onclick="mclick(this)" ';
	var action = ' gameAction="" ';
	var id = "";
	var html = "<table id='battle_field' border='1' cellspacing='0' align='center'>";
	for(var i=0; i < s; i++){
		html += "<tr>";
		for(var j=0; j < s; j++){
			html += "<td>";
			var image = '<img ' + script + 'id="L_' + j + '_' + i + '" gameX="' + j + '" gameY="' + i + '" src="'+ img_empty +'" ' + ' />';
				html += image;
			html += "</td>";
		}
		html += "</tr>";
	}
	html += "</table>";

	document.writeln(html);
}
/*** [end] functions ***/

/*******************md5*************************/ 

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz));}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}


/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert a string to an array of little-endian words
 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
 */
function str2binl(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
  return bin;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
  return str;
}

/*
 * Convert an array of little-endian words to a hex string.
 */
function binl2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
  }
  return str;
}

/*******************[end]md5*************************/ 

/*
 * self-define hashing function 
 */

function myHash(s){
    return hex_md5("sWoRd" + s);
}



/******************AJAX*************************/
var xmlhttp;

var url = "server.pl";

function sendCmd(url, command, doFun, async)
{
	xmlhttp=null;


	// code for Mozilla, etc.
	if (window.XMLHttpRequest){
		xmlhttp=new XMLHttpRequest();
	}else if (window.ActiveXObject){
		// M$ VVind0vv$
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}

	if (xmlhttp!=null){

		command = encodeURI("cmd=" + myHash(command)+ "@" + command);
		//alert(command);
		xmlhttp.onreadystatechange=doFun;
		xmlhttp.open("POST",url, async);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Content-length", command.length);
    xmlhttp.setRequestHeader("Connection", "close");

		//send the parms with URI
		xmlhttp.send(command);
	}else{
		alert("Your browser does not support XMLHTTP.");
	}
}

function waitCmd(){
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			//document.getElementById('T1').innerHTML=xmlhttp.responseText;
		}else{
			//alert("Problem retrieving data:" + xmlhttp.statusText);
		}
	}	
}


function sendPing(){
		sendCmd(url, "act:move", waitPing);
		
}

function waitPing(){
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			//document.getElementById('T1').innerHTML=xmlhttp.responseText;
			alert(xmlhttp.responseText);
		}else{
			//alert("Problem retrieving data:" + xmlhttp.statusText);
		}
	}	
}

function waitJoin(){
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			var cmd = xmlhttp.responseText;
			if (cmd == "join" || cmd == "rejoin" || cmd=="newjoin"){
				state_join = true;
				keep_update = true;
			}else{
				alert("Join failed!!!");
			}	
		}else{
			alert("Connection failed!!!");
		}
	}	
}

function waitUpdate(){
	keep_update = false;
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			var cmd = xmlhttp.responseText;
			//alert(chkCmd(cmd));
			if(cmd == "updatefail"){
				keep_update = false;
				alert("Game removed!!!");
				return;
			}	
				if(chkCmd(cmd)){
						if(players[playerSelf].seq > round){
							//alert("");
							upPlayerAct();
							updateControl();
							updateBattle();
						}
						updateControl();
						if (updateWin()){
							updateControl();
							updateBattle();
							return;
						}
				}else{
						keep_update = false;
						alert("Game error!");
						return;
				}
				
		}else{
				keep_update = false;
			alert("Connection failed!!!");
				
		}
	}	
	keep_update = true;
}

function waitStart(){
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			var cmd = xmlhttp.responseText;
				updateControl();
				
		}else{
				keep_update = false;
			alert("Connection failed!!!");
				
		}
	}	
}
function waitMove(){
		keep_update = false;
	// if xmlhttp shows "loaded"
	if (xmlhttp.readyState==4){

		// if "OK"
		if (xmlhttp.status==200){
			var cmd = xmlhttp.responseText;
				updateControl();
				
		}else{
				keep_update = false;
			alert("Connection failed!!!");
				
		}
	}	
		keep_update = true;
}
/******************[end]AJAX*************************/

function updateWin(){
	if(!players[playerSelf].alive){
		alert("You are a dead man!!!");
		keep_update = false;
		return true;
	}else	if(winner >= 0 && winner == playerSelf){
		alert("You Win!");
		keep_update = false;
		return true;
	}
	return false;
}

function updateControl(){
		
		var p = players[playerSelf];
		document.getElementById("btnJoin").disabled = state_join;
		document.getElementById("btnStart").disabled = !(state_join && canStart());


		var btnGo = true;
		if(round >= 0){
			if (p.walk && p.turn && p.seq <= round){
				btnGo = false;
			}			
		}

		document.getElementById("btnGo").disabled = btnGo; 

		document.getElementById("btnReset").disabled = p.seq > round; 


		if(round >= 0){
			document.title = "Swords --- " + players[playerSelf].name;
			document.getElementById("battle_field").style.display = "inline";
			document.getElementById("txtGame").innerHTML = "Game: " + game;
			document.getElementById("txtState").innerHTML = "Round: " + round;
		}else{
			document.title = "Swords";
			document.getElementById("battle_field").style.display = "none";
			document.getElementById("txtGame").innerHTML = "";
			document.getElementById("txtState").innerHTML = "";
		}
		for(var i=0; i < players.length; i++){
				//alert(i + ":" + players[i].use + ":" + players[i].name);
				if(players[i].use){
						document.getElementById("row_p"+i).style.display = "inline";
				}else{
						document.getElementById("row_p"+i).style.display = "none";
				}
				document.getElementById("hp"+i).innerHTML = players[i].hp + " (-"+players[i].hp_dam+")";
				document.getElementById("img_hp"+i).setAttribute("width", players[i].hp);
				var tmp_name = players[i].name;
				if(playerSelf == i){
					tmp_name = "<b>" + players[i].name+ "</b>";
				}
				document.getElementById("pname"+i).innerHTML = tmp_name;
		}

	// if winner comes out
	if(winner >= 0){
		document.getElementById("btnJoin").disabled = true;
		document.getElementById("btnStart").disabled = true; 
		document.getElementById("btnGo").disabled = true; 
		document.getElementById("btnReset").disabled = true; 
		document.getElementById("txtGame").innerHTML = "Game: " + game;
		document.getElementById("txtState").innerHTML = "<b style='color:red'>" + players[winner].name + " wins !!!</b>";

		return;
	}

	if(!players[playerSelf].alive){
		document.getElementById("btnJoin").disabled = true;
		document.getElementById("btnStart").disabled = true; 
		document.getElementById("btnGo").disabled = true; 
		document.getElementById("btnReset").disabled = true; 
		document.getElementById("txtGame").innerHTML = "Game: " + game;
		document.getElementById("txtState").innerHTML = "<b style='color:red'>You are a dead man !!!</b>";
	}


		updateBattle();
}

function join(){

		game = prompt("Which game you wanna join/create ?");	
		uname = prompt("What is your name ?");	
		passwd = prompt("Your password for this game ?");	
		
		// check login info format
		var loginOK = (game != null) && (uname != null) && (passwd != null) && chkLogin(game, true) && chkLogin(uname, true) && chkLogin(passwd, false);

		if(!loginOK){
				alert("Game name, player name, password must be given");
				return;
		}

		// if format ok, send command
		var cmd = cmdHead("join");
		sendCmd(url, cmd, waitJoin, false);
		updateControl();
		
}

function gstart(){
		keep_update = false;
		var cmd = cmdHead("start");
		sendCmd(url, cmd, waitStart, false);
		keep_update = true;
}

function sendUpdate(){
		if(keep_update){
				var cmd = cmdHead("update");
				//sendCmd(url, cmd, waitUpdate, false);
				sendCmd(url, cmd, waitUpdate, true);
		}
}

function move(){
		//	var post = getPosition(obj);
		keep_update = false;
	var p = players[playerSelf];
	if(p.walk && p.turn){
		//alert("mmmmmove");
		var cmd = cmdHead("move");
		cmd = cmdAdd(cmd, "x", p.walkX);
		cmd = cmdAdd(cmd, "y", p.walkY);
		cmd = cmdAdd(cmd, "dir", p.turnDir);
		cmd = cmdAdd(cmd, "round", round);
		sendCmd(url, cmd, waitMove, true);
		sendUpdate();
	}	
		//alert(".....");
		keep_update = true;

}

/******************** my functions*****************************/

function trim(s){
		return s.replace(/^\s*/, "").replace(/\s*$/, "");
}

function cmdAdd(cmd, tname, tval){
		return cmd + "|" + tname + ":" + tval;
}

function cmdHead(act){
		var cmd = "act:" + act;
		cmd = cmdAdd(cmd, "game", game);
		cmd = cmdAdd(cmd, "uname", uname);
		cmd = cmdAdd(cmd, "passwd", myHash(passwd));
		return cmd;
}

function chkLogin(s, empty){
		if(empty && s.replace(/ /, "").length < 1){
				return false;
		}
		if(s.length < 1){
				return false;
		}
		var t = s.replace(/\|/, "").replace(/:/, "");
		return s == t;
}

// make the special chars display in HTML
function encodeHTML(s){
		s = s.replace(/&/, "&amp");
		s = s.replace(/</, "&lt");
		s = s.replace(/>/, "&gt");
		s = s.replace(/"/, "&quot");
		s = s.replace(/'/, "&apos");
		return s;
}

function waitTime(){
		return 5000 + Math.floor(Math.random() * 1000);
}

function chkCmd(s){
		var tmp = new Array();
		cmds = new Array();
		tmp = s.split("@");
		if (tmp.length != 2) return false;
		if (myHash(tmp[1]) == tmp[0]){
				var t = tmp[1].split("|");
				for(var i=0; i < t.length; i++){
						var r = t[i].split(":");
						if(r.length == 2){
								cmds[r[0]] = r[1];
						}
				}
			cmd2val();	
			return true;
		}
		return false;
}

function cmd2val(){
		playerSelf = parseInt(cmds["me"]);		
		
		var newround = parseInt(cmds["round"]);
		if (newround > round){
				players[playerSelf].walk = false;
				players[playerSelf].turn = false;
		}
		round = newround;
		game = cmds["game"];
		winner = parseInt(cmds["winner"]);

		for(var i=0; i < player_num; i++){
				if (parseInt(cmds["p_ok_"+i]) == 1){
					players[i].use = true;
				}else{
					players[i].use = false;
				}

			players[i].me = false;
			players[i].x = parseInt(cmds["p_x_"+i]);
			players[i].y = parseInt(cmds["p_y_"+i]);
			players[i].dir = parseInt(cmds["p_dir_"+i]);
			players[i].hp = parseInt(cmds["p_hp_"+i]);
			players[i].hp_dam = parseInt(cmds["p_hp_dam_"+i]);
			players[i].id = parseInt(cmds["p_id_"+i]);
			players[i].name = cmds["p_name_"+i];	
			players[i].seq = parseInt(cmds["p_seq_"+i]);

			if(cmds["p_alive_"+i] == 1){
				players[i].alive = true;
			}else{
				players[i].alive = false;
			}
				
		}
		players[playerSelf].me = true;
}

function canStart(){
		var tmp = 0;
		for(var i=0; i < players.length; i++){
				if(players[i].use){
						tmp++;
				}
		}
		return (tmp >= 2) && (round < 0);
}


/* try update every 3.xxx sec */
setInterval("sendUpdate()", waitTime());
