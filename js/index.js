// If the padtop url parameter was provided, apply a margin to the top of the page so when 
// embedded in the MelStuff page it starts below the header
var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("padtop"))
    document.body.style.paddingTop = urlParams.get("padtop") + "px";

// Populate page with links to hockey streams
const sportsStatsTeamUrl = "http://sportsstats.xyz/www.sportsstats.me/nhl1/";
const scheduleUrl = "https://statsapi.web.nhl.com/api/v1/schedule?teamId=";
const standingsUrl = "https://statsapi.web.nhl.com/api/v1/standings/byDivision";
const timer = ms => new Promise(res => setTimeout(res, ms));

async function setLinks() {
    let gamesDiv = document.querySelector("#canadianTeams");
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
    gamesDiv.appendChild(spn);

    for (let index = 0; index < teamsCdn.length; index++) {
        let team = teamsCdn[index];
        let teamName = team[0];
        let teamId = team[1];
        let spn = document.createElement("span");
        spn.className = "teamGames";
        let html = '<a class="teamLink" href="' + sportsStatsTeamUrl + teamName + '.php" target="_blank">' + teamName + '</a>';

        // Query dates in EST
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
                    
                    // Display home and away teams, and game results if the game is underway or complete
                    let homeTeam = game.teams.home.team;
                    let awayTeam = game.teams.away.team;
                    let isHome = homeTeam.id == teamId
                    let homeScore = game.teams.home.score;
                    let awayScore = game.teams.away.score;
                    let gameState = game.status.detailedState == "Final" ? ((isHome && homeScore > awayScore) || (!isHome && homeScore < awayScore) ? "Win" : "Loss") : game.status.detailedState;
                    let score = " (" + (isHome ? homeScore + "-" + awayScore : awayScore + "-" + homeScore) +  " " + gameState + ")";
                    if (game.status.abstractGameState == 'Preview') score = "";

                    // Use different separator depending on whether team is home or away
                    let separator = isHome ? " vs " : " @ ";
                    let otherTeamName = isHome ? awayTeam.name : homeTeam.name;

                    // Display game time in local time zone
                    let gameTime = new Date(game.gameDate);
                    let today = new Date();
                    let tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                    let day = gameTime.toLocaleDateString([], { weekday: 'long' });
                    if (gameTime.getDate() == today.getDate()) day = "Today";
                    if (gameTime.getDate() == tomorrow.getDate()) day = "Tomorrow";

                    games.push(day + " " + gameTime.toLocaleTimeString([], { hourCycle: "h12", hour: 'numeric', minute: '2-digit' }) + separator + otherTeamName + score);
                }
                html += "     " + games.join("   ---  ");
                html += '<br>';
                spn.innerHTML = html;
                gamesDiv.appendChild(spn);
            })
        await timer(100);
    };

    let standingsTable = document.querySelector("#standings");
    fetch(standingsUrl, { method: 'GET' })
        .then(response => response.json())
        .then(standingsJson => {
            standingsJson.records.forEach(record => {
                if (record.division.name == "Scotia North") {
                    record.teamRecords.forEach(teamRecord => {
                        let tr = document.createElement("tr");
                        tr.className = "teamStandings";
                        tr.innerHTML =  '<td width="150px">' + teamRecord.team.name + "</td>";
                        tr.innerHTML += '<td width="100px">' + teamRecord.points + " points</td>";
                        tr.innerHTML += '<td width="150px">' + teamRecord.gamesPlayed + " games played</td>";
                        standingsTable.appendChild(tr);
                    });                    
                }
            });
        })
}


setLinks();