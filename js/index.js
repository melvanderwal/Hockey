// If the padtop url parameter was provided, apply a margin to the top of the page so when 
// embedded in the MelStuff page it starts below the header
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("padtop"))
    document.body.style.paddingTop = urlParams.get("padtop") + "px";

// Populate page with links to hockey streams
const sportsStatsTeamUrl = "http://sportsstats.xyz/www.sportsstats.me/nhl1/";
const scheduleUrl = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=";
const timer = ms => new Promise(res => setTimeout(res, ms));

async function setLinks() {
    let div = document.querySelector("#canadianTeams");
    let teamsCdn = [
        ["Canucks", 23],
        ["Flames", 20],
        ["Oilers", 22],
        ["Jets", 52],
        ["Leafs", 10],
        ["Senators", 9],
        ["Canadiens", 8]
    ];

    let spn = document.createElement("span");
    spn.className = "teamGames";
    spn.innerHTML = "All game times " + Intl.DateTimeFormat().resolvedOptions().timeZone + "<br>";
    div.appendChild(spn);

    for (let index = 0; index < teamsCdn.length; index++) {
        let team = teamsCdn[index];
        let teamName = team[0];
        let teamId = team[1];
        let spn = document.createElement("span");
        spn.className = "teamGames";
        let html = '<a class="teamLink" href="' + sportsStatsTeamUrl + teamName + '.php" target="_blank">' + teamName + '</a>';

        let offsetLocal = new Date().getTimezoneOffset() / 60;
        let offsetEST = offsetLocal - 4;
        let dateEST = new Date(new Date().getTime() + offsetEST * 3600 * 1000);
        let startDate = dateEST.toISOString().substring(0, 10);
        let endDate = new Date(dateEST);
        endDate.setDate(endDate.getDate() + 7);
        endDate = endDate.toISOString().substring(0, 10);

        let url = scheduleUrl + teamId + "&startDate=" + startDate + "&endDate=" + endDate;
        let games = [];
        fetch(url, { method: 'GET' })
            .then(response => response.json())
            .then(scheduleJson => {
                for (let index = 0; index < scheduleJson.dates.length; index++) {
                    let game = scheduleJson.dates[index].games[0];
                    let homeTeam = game.teams.home.team;
                    let awayTeam = game.teams.away.team;
                    let isHome = homeTeam.id == teamId
                    let homeScore = game.teams.home.score;
                    let awayScore = game.teams.away.score;
                    let gameState = game.status.detailedState == "Final" ? ((isHome && homeScore > awayScore) || (!isHome && homeScore < awayScore) ? "Win" : "Loss") : game.status.detailedState;
                    let score = " (" + (isHome ? homeScore + "-" + awayScore : awayScore + "-" + homeScore) +  " " + gameState + ")";
                    if (game.status.abstractGameState == 'Preview') score = "";
                    let separator = isHome ? " vs " : " @ ";
                    let otherTeamName = isHome ? awayTeam.name : homeTeam.name;
                    let gameTime = new Date(game.gameDate);
                    let day = gameTime.getDate() == new Date().getDate() ? "Today" : gameTime.toLocaleDateString([], { weekday: 'long' });
                    games.push(day + " " + gameTime.toLocaleTimeString([], { hourCycle: "h12", hour: 'numeric', minute: '2-digit' }) + separator + otherTeamName + score);
                }
                html += "     " + games.join("   ---  ");
                html += '<br>';
                spn.innerHTML = html;
                div.appendChild(spn);
            })
        await timer(100);
    };
}


setLinks();