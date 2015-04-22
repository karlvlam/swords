#!/usr/local/bin/perl -w

use CGI qw(:standard);
use Digest::MD5  qw(md5 md5_hex md5_base64);
use Class::Struct;
use strict;

#### server settings ####
my $data_dir = "./games/";
#my $data_dir = "";
my $battle_size = 9;
my $player_num = 4;

my $session_out = 120; #session expire time, 3min 
my $player_out = 60; #player disconnect time, 1min

my %cmd;
my %data;

my @players;

#### Player class ####
struct(
    Player=>{
        ok => '$',# player in used, 0 or 1
        seq => '$',# seq of command/round
        mtime => '$',# last update of the player 
        id => '$',# player id, 0-3
        name => '$',# player name, any char
        passwd => '$',# player password, [myHash]ed
        x => '$', # current x 
        y => '$', # current y
        dir => '$', # current direction
        hp => '$', # hit point
        hp_dam => '$', # hit point damage
        nx => '$', # next x
        ny => '$', # next y
        ndir => '$', # next direction
        alive => '$', # alive or not
    }
);

# create 4 empty player
for(my $i=0; $i < $player_num; $i++){
    push(@players, new Player);	
}

####### program start #####
### output as html first ###
print header();
### end html ###
if (param("cmd")){
    my $line = param("cmd");
    if(chkHash($line)){
        readCmd($line);
    }
}else{
    print "Hey, don't play!";
}

exit;

###### end command ######

sub chkHash{

    my $line = $_[0];
    if ($line =~ /^([a-f0-9]{32}\@)[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+((\|[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)+)$/){
        if(1){
            my @lines = split(/\@/, $line);
            if ($lines[0] eq myHash($lines[1])){
                return 1;
            }
        }
    } 
    return 0;
}

# md5 hash an input string with [my words]
sub myHash{

    return md5_hex("sWoRd".$_[0]);
}

# verify the type of command and pass to the functions
sub readCmd{
    my $line = $_[0];
    my @tmp = split(/\@/, $line);	
    $line = $tmp[1];	
    my @lines = split(/\|/, $line);
    my $i;

    foreach $i (@lines){
        @tmp = split(/:/, $i);
        $cmd{$tmp[0]} = $tmp[1];
        #print $i,"\n";
        #print $tmp[0].": ".$cmd{$tmp[0]}."\n";
    }

    # check command type	
    if ($cmd{"act"} eq "join"){
        doJoin();
    }elsif($cmd{"act"} eq "update"){
        doUpdate();
    }elsif($cmd{"act"} eq "start"){
        doStart();
    }elsif($cmd{"act"} eq "move"){
        doMove();
    }else{
        # no such command
        print "error";
    }	

    exit;	
}

# player can create a game room, or rejoin the room
sub doJoin{

    my $fin;
    my $fo;
    my $file = $data_dir.myHash($cmd{"game"}); 

    if (open($fin, "<$file")){

        #### game already exist ####

        flock $fin, 2; # lock file
        readFile($fin);

        if(!updateOnline()){
            flock $fin, 8; # unlock file
            close($fin);		
            unlink($file);
            doJoin();
            return;
        }


        #### if player exist, rejoin the game, refresh mtime ####
        for(my $i=0; $i < $player_num; $i++){
            if($players[$i]->ok == 1 && $players[$i]->name eq $cmd{"uname"}){
                if($players[$i]->passwd eq $cmd{"passwd"}){
                    $players[$i]->ok(1);	
                    $players[$i]->mtime(time());	
                    open($fo, ">$file");
                    writeFile($fo);
                    close($fo);
                    print "rejoin";	
                    exit;	
                }else{
                    print "joinfail";	
                    exit;	
                }

            }	
        }
        #### if player NOT exist, join the game ####

        ### if game already started, block it ###
        if($data{"round"} >= 0){
            print "latejoin";
            exit;
        }

        ### if not, join ###
        for(my $i=0; $i < $player_num; $i++){
            if($players[$i]->ok == 0){
                $players[$i]->ok(1);	
                $players[$i]->mtime(time());	
                $players[$i]->name($cmd{"uname"});	
                $players[$i]->passwd($cmd{"passwd"});
                open($fo, ">$file");
                writeFile($fo);
                close($fo);
                print "newjoin";
                exit;	
            }	
        }
        flock $fin, 8; # unlock file
        close($fin);

        print "joinfull";

        exit;

    }else{

        #### new game, 1st player ####
        open($fo, ">$file");
        flock $fo, 2;

        # init game data with given game name
        initGame($cmd{"game"});

        # set the first player information
        $players[0]->ok(1);
        $players[0]->mtime(time());
        $players[0]->name($cmd{"uname"});
        $players[0]->passwd($cmd{"passwd"});

        # write the data to the room file
        writeFile($fo);
        flock $fo, 8;
        close($fo);

        print "join";
    }

}

sub doUpdate{

    my $fin;
    my $fo;
    my $file = $data_dir.myHash($cmd{"game"}); 

    if (open($fin, "<$file")){

        #### game already exist ####

        flock $fin, 2; # lock file
        readFile($fin);

        #### try update the round/move ####
        updateOnline();
        updateRound();
        updateAlive();

        #### if player exist, update him ####
        for(my $i=0; $i < $player_num; $i++){
            if($players[$i]->ok == 1 && $players[$i]->name eq $cmd{"uname"}){
                if($players[$i]->passwd eq $cmd{"passwd"}){
                    $data{"me"} = $i;	
                    $players[$i]->ok(1);	
                    $players[$i]->mtime(time());	
                    open($fo, ">$file");
                    writeFile($fo);
                    close($fo);
                    #print "rejoin";	
                    #exit;	
                }else{
                    print "updatefail";	
                    exit;	
                }

            }	
        }

        flock $fin, 8; # unlock file
        close($fin);

    }else{
        print "updatefail";
        exit;
    }
    ########################################################

    my $o = "game:".$data{"game"}."|round:".$data{"round"}.
    "|me:".$data{"me"}."|winner:".$data{"winner"};

    for(my $i=0; $i < $player_num; $i++){
        $o = $o."|p_ok_$i:".$players[$i]->ok;	
        $o = $o."|p_seq_$i:".$players[$i]->seq;	
        $o = $o."|p_id_$i:".$players[$i]->id;	
        $o = $o."|p_name_$i:".$players[$i]->name;	
        $o = $o."|p_hp_$i:".$players[$i]->hp;	
        $o = $o."|p_hp_dam_$i:".$players[$i]->hp_dam;	
        $o = $o."|p_x_$i:".$players[$i]->x;	
        $o = $o."|p_y_$i:".$players[$i]->y;	
        $o = $o."|p_dir_$i:".$players[$i]->dir;	
        $o = $o."|p_nx_$i:".$players[$i]->nx;	
        $o = $o."|p_ny_$i:".$players[$i]->ny;	
        $o = $o."|p_ndir_$i:".$players[$i]->ndir;	
        $o = $o."|p_alive_$i:".$players[$i]->alive;	
    }
    $o = myHash($o)."@".$o; 
    print $o;
}

sub doStart{

    my $fin;
    my $fo;
    my $file = $data_dir.myHash($cmd{"game"}); 

    if (open($fin, "<$file")){

        #### game already exist ####

        flock $fin, 2; # lock file
        readFile($fin);

        if($data{"round"} >= 0 || !canStart()){
            print "startfail";
            exit;
        }

        #### if player exist, update him ####
        for(my $i=0; $i < $player_num; $i++){
            if($players[$i]->ok == 1 && $players[$i]->name eq $cmd{"uname"}){
                if($players[$i]->passwd eq $cmd{"passwd"}){

                    #about player	
                    $data{"me"} = $i;	
                    $players[$i]->mtime(time());	

                    # update round number to 0	
                    $data{"round"} = 0;	

                    open($fo, ">$file");
                    writeFile($fo);
                    close($fo);
                    print "start";	
                    exit;	
                }else{
                    print "startfail";	
                    exit;	
                }

            }	
        }
        flock $fin, 8; # unlock file
        close($fin);

    }
}



sub doMove{

    my $fin;
    my $fo;
    my $file = $data_dir.myHash($cmd{"game"}); 

    if (open($fin, "<$file")){

        #### game already exist ####

        flock $fin, 2; # lock file
        readFile($fin);

        if($cmd{"round"} != $data{"round"}){
            print "movefail";
            exit;
        }

        #### if player exist, record move, dir ####
        for(my $i=0; $i < $player_num; $i++){
            if($players[$i]->ok == 1 && $players[$i]->name eq $cmd{"uname"}){
                if($players[$i]->passwd eq $cmd{"passwd"}){

                    if($cmd{"round"} != $players[$i]->seq){
                        print "movefail";
                        exit;
                    }	
                    if(!canMove($players[$i]->x, $players[$i]->y, $cmd{"x"}, $cmd{"y"})){
                        print "movefail";
                        exit;

                    }	

                    #about player	
                    $data{"me"} = $i;	
                    $players[$i]->mtime(time());	

                    # record next step
                    $players[$i]->nx($cmd{"x"});		
                    $players[$i]->ny($cmd{"y"});		
                    $players[$i]->ndir($cmd{"dir"});		
                    $players[$i]->seq($data{"round"} + 1);	


                    open($fo, ">$file");
                    writeFile($fo);
                    close($fo);
                    print "move";	
                    exit;	
                }else{
                    print "movefail";	
                    exit;	
                }

            }	
        }
        flock $fin, 8; # unlock file
        close($fin);

    }
}



sub initGame{
    $data{"session"} = 1;	
    $data{"game"} = $_[0];	
    $data{"round"} = -1;	
    $data{"winner"} = -1;	
    # init 4 players	
    for(my $i=0; $i < $player_num; $i++){	
        $players[$i]->ok(0);
        $players[$i]->seq(0);
        $players[$i]->mtime(0);
        $players[$i]->id($i);
        $players[$i]->name($i);
        $players[$i]->passwd("0");
        $players[$i]->hp(100);
        $players[$i]->hp_dam(0);
        $players[$i]->x(0);
        $players[$i]->y(0);
        $players[$i]->dir(0);
        $players[$i]->nx(5);
        $players[$i]->ny(5);
        $players[$i]->ndir(1);
        $players[$i]->alive(1);
    }
    # the init positions of 4 players	
    $players[0]->x(0);	
    $players[0]->y(0);	
    $players[0]->dir(5);	

    $players[1]->x($battle_size - 1);	
    $players[1]->y($battle_size - 1);	
    $players[1]->dir(1);	

    $players[2]->x(0);	
    $players[2]->y($battle_size - 1);	
    $players[2]->dir(3);	

    $players[3]->x($battle_size - 1);	
    $players[3]->y(0);	
    $players[3]->dir(7);	
}




sub writeFile{
    my $fo = $_[0];	
    printLine( $fo, "session", $data{"session"});
    printLine( $fo, "mtime", time());
    printLine( $fo, "game", $data{"game"});
    printLine( $fo, "round", $data{"round"});
    printLine( $fo, "winner", $data{"winner"});
    for(my $i=0; $i < $player_num; $i++){	
        printLine( $fo, "p_ok_".$i, $players[$i]->ok);
        printLine( $fo, "p_seq_".$i, $players[$i]->seq);
        printLine( $fo, "p_mtime_".$i, $players[$i]->mtime);
        printLine( $fo, "p_id_".$i, $players[$i]->id);
        printLine( $fo, "p_name_".$i, $players[$i]->name);
        printLine( $fo, "p_passwd_".$i, $players[$i]->passwd);
        printLine( $fo, "p_hp_".$i, $players[$i]->hp);
        printLine( $fo, "p_hp_dam_".$i, $players[$i]->hp_dam);
        printLine( $fo, "p_x_".$i, $players[$i]->x);
        printLine( $fo, "p_y_".$i, $players[$i]->y);
        printLine( $fo, "p_dir_".$i, $players[$i]->dir);
        printLine( $fo, "p_nx_".$i, $players[$i]->nx);
        printLine( $fo, "p_ny_".$i, $players[$i]->ny);
        printLine( $fo, "p_ndir_".$i, $players[$i]->ndir);
        printLine( $fo, "p_alive_".$i, $players[$i]->alive);
    }	
}

sub readFile{
    my $fi = $_[0];	
    while(<$fi>){
        chomp;
        my $line = $_;
        if ($line =~ /^([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)$/){
            my @tmp = split(/:/, $line);
            $data{$tmp[0]} = $tmp[1];
        }
    }	
    for(my $i=0; $i < $player_num; $i++){	
        $players[$i]->ok($data{"p_ok_".$i});
        $players[$i]->seq($data{"p_seq_".$i});
        $players[$i]->mtime($data{"p_mtime_".$i});
        $players[$i]->id($data{"p_id_".$i});
        $players[$i]->name($data{"p_name_".$i});
        $players[$i]->passwd($data{"p_passwd_".$i});
        $players[$i]->hp($data{"p_hp_".$i});
        $players[$i]->hp_dam($data{"p_hp_dam_".$i});
        $players[$i]->x($data{"p_x_".$i});
        $players[$i]->y($data{"p_y_".$i});
        $players[$i]->dir($data{"p_dir_".$i});
        $players[$i]->nx($data{"p_nx_".$i});
        $players[$i]->ny($data{"p_ny_".$i});
        $players[$i]->ndir($data{"p_ndir_".$i});
        $players[$i]->alive($data{"p_alive_".$i});
    }	

}
sub printLine{
    my $t = @_;
    if ($t != 3){
        return 0;
    }
    my $fo = $_[0];
    my $s1 = $_[1];
    my $s2 = $_[2];
    my $line = $s1.":".$s2."\n";

    print $fo $line;

    return 1;
}


sub canStart{
    my $tmp = 0;
    for(my $i=0;	$i < $player_num; $i++){
        $tmp += $players[$i]->ok;
    }
    return $tmp >= 2;
}

sub updateOnline{

    my $t = time();
    if($t - $data{"mtime"} >= $session_out){
        $data{"session"} = -100;
        return 0;
    }
    for(my $i=0; $i < $player_num; $i++){
        if ($t - $players[$i]->mtime >= $player_out ){
            $players[$i]->ok(0);
        }
    }
    return 1;

}

sub updateAlive{

    if($data{"round"} < 0){
        return;
    }

    my @onwin = ();

    for(my $i=0;	$i < $player_num; $i++){
        if($players[$i]->hp <= 0){
            $players[$i]->alive(0);
        }else{
            if($players[$i]->ok){
                push(@onwin, $i);
            }
        }
    }

    my $tmp = @onwin;

    if($tmp == 1){
        $data{"winner"} = $onwin[0];
    }else{
        $data{"winner"} = -1;
    }


}

sub updateRound{

    if ($data{"round"} < 0){
        return 0;
    }	

    # don't do anything if any online player not ready
    for(my $i=0;	$i < $player_num; $i++){
        if( $players[$i]->ok && $players[$i]->alive){
            if( $players[$i]->seq >= 0 && $players[$i]->seq <= $data{"round"} ){
                return 0;
            }
        }
    }

    for(my $i=0;	$i < $player_num; $i++){

        ### for each online player ###
        if($players[$i]->ok){

            ### turn to the next direction ###
            $players[$i]->dir($players[$i]->ndir);

            ### move if not crash with others ###	
            if (!isCrash($i)){
                $players[$i]->x($players[$i]->nx);
                $players[$i]->y($players[$i]->ny);
            }	

        }

    }

    for(my $i=0;	$i < $player_num; $i++){

        ### for each online player ###
        if($players[$i]->ok){

            ### hp/damage	###
            my $damage = 0;	
            for(my $j=0;	$j < $player_num; $j++){
                ### skip if compare with self player ###
                if($i == $j){ next; }
                $damage += getDamage(getAttDir($players[$i]->x, $players[$i]->y, $players[$i]->dir, $players[$j]->x, $players[$j]->y, $players[$j]->dir));
            }	

            $players[$i]->hp_dam($damage);
            my $hp = $players[$i]->hp;
            $hp -= $damage;
            if($hp < 0){
                $hp = 0;
                $players[$i]->alive(0);
            }		
            $players[$i]->hp($hp);

        }

    }

    ### go to next round ###

    ### go to next round ###
    $data{"round"}++;
    return 1;
}

###############################################################
# get attack direction from B
#
#  123
#  8A4
#  765
#
# USAGE : getDir(ax, ay, [a direction], bx, by, [B direction])
#
sub getAttDir{
    my $args = @_;
    if ($args < 6){
        return -1;
    }

    my $ax = $_[0];
    my $ay = $_[1];
    my $ad = $_[2];
    my $bx = $_[3];
    my $by = $_[4];
    my $bd = $_[5];

    if(($bx == $ax-1 && $by == $ay-1) 
        || ($bx == $ax && $by == $ay-1) 
        || ($bx == $ax+1 && $by == $ay-1) 
        || ($bx == $ax-1 && $by == $ay) 
        || ($bx == $ax+1) && ($by == $ay) 
        || ($bx == $ax-1 && $by == $ay+1) 
        || ($bx == $ax && $by == $ay+1) 
        || ($bx == $ax+1 && $by == $ay+1) ){
        if(($bd == 1 && $ax == $bx-1 && $ay == $by-1) 
            || ($bd == 2 && $ax == $bx && $ay == $by-1) 
            || ($bd == 3 && $ax == $bx+1 && $ay == $by-1)
            || ($bd == 4 && $ax == $bx+1 && $ay == $by)
            || ($bd == 5 && $ax == $bx+1 && $ay == $by+1)
            || ($bd == 6 && $ax == $bx && $ay == $by+1)
            || ($bd == 7 && $ax == $bx-1 && $ay == $by+1)
            || ($bd == 8 && $ax == $bx-1 && $ay == $by) ){
            if($ad == 1){
                return ((5 + $bd - 1) % 8) + 1;	 
            }elsif ($ad == 2){
                return ((4 + $bd - 1) % 8) + 1;
            }elsif ($ad == 3){
                return ((3 + $bd - 1) % 8) + 1;
            }elsif ($ad == 4){
                return ((2 + $bd - 1) % 8) + 1;
            }elsif ($ad == 5){
                return ((1 + $bd - 1) % 8) + 1;
            }elsif ($ad == 6){
                return ((0 + $bd - 1) % 8) + 1;
            }elsif ($ad == 7){
                return ((7 + $bd - 1) % 8) + 1;
            }elsif ($ad == 8){
                return ((6 + $bd - 1) % 8) + 1;
            }
        }else{
            return 0;
        }		
    }else{
        return 0;
    }	
}

sub canMove{
    my $args = @_;
    if ($args != 4){
        return 0;
    }
    my $ox = $_[0];	
    my $oy = $_[1];	
    my $tx = $_[2];	
    my $ty = $_[3];	

    if($tx >= $ox - 1 && $tx <= $ox + 1 && $ty >= $oy - 1 && $ty <= $oy + 1){
        if($tx >= 0 && $tx < $battle_size && $ty >= 0 && $ty < $battle_size){ 
            return 1;
        }
    }
    return 0;

}

sub getDamage{
    my $args = @_;
    if ($args < 1){
        return 0;
    }
    my @damage = (0, 10, 0, 10, 25, 50, 100, 50, 25);

    return $damage[$_[0]];
}

sub isCrash{
    my $args = @_;
    if ($args != 1){
        return 1;
    }
    my $p = $_[0];	
    for(my $i=0; $i < $player_num; $i++){
        if($p != $i && $players[$i]->ok && $players[$i]->alive){
            if($players[$p]->nx == $players[$i]->nx	&&
                $players[$p]->ny == $players[$i]->ny){
                return 1;
            }
        }
    }

    return 0;
}

######## end of script ###########














