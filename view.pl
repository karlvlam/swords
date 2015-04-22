#!/usr/local/bin/perl -w

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

my $args = @ARGV;
if ($args == 0){
    print "Error : game omitted!\n";
    exit;
}
my $file = $data_dir.myHash($ARGV[0]);

open(my $fin, "<$file") || die "Error: $file cannot be read!\n";

readFile($fin);

while (1){
    system clear;
    print "Game :\t".$data{"game"}."\n";
    print "Round :\t".$data{"round"}."\n";

    for(my $i=0; $i < $player_num; $i++){
        #print $data{"p_name_".$i}." :\t\t\t";
        print $i." :\t";
        print $data{"p_seq_".$i}."\t";
        print $data{"p_nx_".$i}."\t";
        print $data{"p_ny_".$i}."\t";
        print $data{"p_ndir_".$i}."\n";
    }
    sleep 3;
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






######## end of script ###########














