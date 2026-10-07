#!/usr/bin/env node
/* Reads pasted group chat picks messages on stdin and prints what each one picked.
   Usage: node tools/parse.js < pasted.txt
   A new message starts at any line containing "picks" (for example "Week 5 picks, Josh").
   Prints JSON: [{name, p:{gameId:code}, tb}] for the current week in state.json. */
const fs=require("fs"),path=require("path");
var TEAMS={ARI:["Cardinals","#97233F","#FFFFFF"],ATL:["Falcons","#A71930","#FFFFFF"],BAL:["Ravens","#241773","#FFFFFF"],BUF:["Bills","#00338D","#FFFFFF"],CAR:["Panthers","#0085CA","#FFFFFF"],CHI:["Bears","#0B162A","#FFFFFF"],CIN:["Bengals","#FB4F14","#111111"],CLE:["Browns","#311D00","#FFFFFF"],DAL:["Cowboys","#003594","#FFFFFF"],DEN:["Broncos","#FB4F14","#0A2343"],DET:["Lions","#0076B6","#FFFFFF"],GB:["Packers","#203731","#FFB612"],HOU:["Texans","#03202F","#FFFFFF"],IND:["Colts","#002C5F","#FFFFFF"],JAC:["Jaguars","#006778","#FFFFFF"],KC:["Chiefs","#E31837","#FFFFFF"],LV:["Raiders","#101010","#C9CED1"],LAC:["Chargers","#0080C6","#FFFFFF"],LA:["Rams","#003594","#FFD100"],MIA:["Dolphins","#008E97","#FFFFFF"],MIN:["Vikings","#4F2683","#FFC62F"],NE:["Patriots","#002244","#FFFFFF"],NO:["Saints","#D3BC8D","#101820"],NYG:["Giants","#0B2265","#FFFFFF"],NYJ:["Jets","#125740","#FFFFFF"],PHI:["Eagles","#004C54","#FFFFFF"],PIT:["Steelers","#FFB612","#101820"],SF:["49ers","#AA0000","#FFFFFF"],SEA:["Seahawks","#002244","#69BE28"],TB:["Buccaneers","#D50A0A","#FFFFFF"],TEN:["Titans","#0C2340","#FFFFFF"],WAS:["Commanders","#5A1414","#FFB612"]};
var ALIAS={ARIZONA:"ARI",CARDINALS:"ARI",CARDS:"ARI",ATLANTA:"ATL",FALCONS:"ATL",BALTIMORE:"BAL",RAVENS:"BAL",BUFFALO:"BUF",BILLS:"BUF",CAROLINA:"CAR",PANTHERS:"CAR",CHICAGO:"CHI",BEARS:"CHI",CINCINNATI:"CIN",CINCY:"CIN",BENGALS:"CIN",CLEVELAND:"CLE",BROWNS:"CLE",DALLAS:"DAL",COWBOYS:"DAL",DENVER:"DEN",BRONCOS:"DEN",DETROIT:"DET",LIONS:"DET",PACKERS:"GB",HOUSTON:"HOU",TEXANS:"HOU",INDIANAPOLIS:"IND",INDY:"IND",COLTS:"IND",JACKSONVILLE:"JAC",JAGUARS:"JAC",JAGS:"JAC",CHIEFS:"KC",RAIDERS:"LV",VEGAS:"LV",CHARGERS:"LAC",BOLTS:"LAC",RAMS:"LA",MIAMI:"MIA",DOLPHINS:"MIA",FINS:"MIA",MINNESOTA:"MIN",VIKINGS:"MIN",VIKES:"MIN",PATRIOTS:"NE",PATS:"NE",SAINTS:"NO",GIANTS:"NYG",JETS:"NYJ",PHILADELPHIA:"PHI",PHILLY:"PHI",EAGLES:"PHI",PITTSBURGH:"PIT",STEELERS:"PIT",NINERS:"SF","49ERS":"SF",SEATTLE:"SEA",SEAHAWKS:"SEA",HAWKS:"SEA",TAMPA:"TB",BUCCANEERS:"TB",BUCS:"TB",TENNESSEE:"TEN",TITANS:"TEN",WASHINGTON:"WAS",COMMANDERS:"WAS"};
var CODEALIAS={JAX:"JAC",LAR:"LA",WSH:"WAS",KAN:"KC",GNB:"GB",NWE:"NE",NOR:"NO",SFO:"SF",TAM:"TB",LVR:"LV"};
var MULTI=[["GREEN BAY","GB"],["NEW ENGLAND","NE"],["NEW ORLEANS","NO"],["KANSAS CITY","KC"],["TAMPA BAY","TB"],["LAS VEGAS","LV"],["SAN FRANCISCO","SF"],["LOS ANGELES",""],["NEW YORK",""]];
function parsePicks(text,wk){
  var out={name:"",p:{},tb:""};
  var lines=String(text||"").split(/\r?\n/);
  var i0=-1;for(var i=0;i<lines.length;i++){if(lines[i].trim()){i0=i;break}}
  if(i0>=0){var m=lines[i0].match(/picks?\s*[,:\-]\s*(.{1,30})$/i);if(m){var nm=m[1].trim();if(nm&&nm.split(/\s+/).length<=3){out.name=nm;lines[i0]=""}}}
  var body=[];
  lines.forEach(function(l){var k=l.match(/(mnf|monday|total|tie ?break)/i);if(k){var num=l.slice(k.index).match(/\d{1,3}/)||l.slice(0,k.index).match(/(\d{1,3})\D*$/);if(num&&!out.tb)out.tb=num[1]||num[0]}body.push(l)});
  var txt=" "+body.join(" ")+" ";
  MULTI.forEach(function(pr){txt=txt.replace(new RegExp("\\b"+pr[0]+"\\b","gi")," "+pr[1]+" ")});
  txt.split(/[^A-Za-z0-9]+/).forEach(function(tk){
    if(!tk)return;var up=tk.toUpperCase(),code=null;
    if(TEAMS[up]&&tk===up)code=up;else if(CODEALIAS[up]&&tk===up)code=CODEALIAS[up];else if(ALIAS[up])code=ALIAS[up];
    if(!code)return;
    for(var j=0;j<wk.games.length;j++){var g=wk.games[j];if(g.away===code||g.home===code){out.p[g.id]=code;break}}
  });
  return out;
}

const S=JSON.parse(fs.readFileSync(path.join(__dirname,"..","state.json"),"utf8"));
const wk=S.weeks[String(S.currentWeek)];
const text=fs.readFileSync(0,"utf8");
const chunks=[];let cur=[];
text.split(/\r?\n/).forEach(l=>{if(/picks?\s*[,:\-]/i.test(l)&&cur.some(x=>x.trim())){chunks.push(cur.join("\n"));cur=[]}cur.push(l)});
if(cur.some(x=>x.trim()))chunks.push(cur.join("\n"));
console.log(JSON.stringify(chunks.map(c=>parsePicks(c,wk)),null,1));
