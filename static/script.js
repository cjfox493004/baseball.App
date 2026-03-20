async function loadYears() {
    const yearSelect = document.getElementById('year-select');
    try {
        const response = await fetch('/years');
        const data = await response.json();
        const years = data.years;

        yearSelect.innerHTML = '<option value="">-- Select a Year --</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadYears();
    
    document.getElementById('submit-btn').addEventListener('click', async function() {
        const yearSelect = document.getElementById('year-select');
        const selectedYear = yearSelect.value;

        if (!selectedYear) {
            alert('Please select a year');
            return;
        }

        try {
            const response = await fetch(`/teams?year=${selectedYear}`);
            const data = await response.json();
            const teams = data.teams;

            const resultsSection = document.getElementById('results');
            document.getElementById('results-title').textContent = `Teams for ${selectedYear}`;
            
            let teamsHtml = '';
            if (teams && teams.length > 0) {
                // Group teams by league, then by division
                const groupedByLeague = {};
                teams.forEach(team => {
                    const league = team.league || 'Unknown League';
                    const division = team.division || 'Unknown Division';
                    
                    if (!groupedByLeague[league]) {
                        groupedByLeague[league] = {};
                    }
                    if (!groupedByLeague[league][division]) {
                        groupedByLeague[league][division] = [];
                    }
                    groupedByLeague[league][division].push(team);
                });

                // Create HTML for each league group
                Object.keys(groupedByLeague).sort().forEach(league => {
                    teamsHtml += `
                        <div class="league-group">
                            <div class="league-header">${league}</div>
                    `;
                    
                    // Create division groups within each league
                    Object.keys(groupedByLeague[league]).sort().forEach(division => {
                        teamsHtml += `
                            <div class="division-group">
                                <div class="division-header">${division}</div>
                                <div class="teams-list">
                        `;
                        
                        groupedByLeague[league][division].forEach(team => {
                            teamsHtml += `
                                <div class="team-card" data-team-id="${team.teamID}" data-year="${selectedYear}">
                                    <div class="team-name" style="cursor: pointer;">${team.name}</div>
                                </div>
                            `;
                        });
                        
                        teamsHtml += `
                                </div>
                            </div>
                        `;
                    });
                    
                    teamsHtml += `
                        </div>
                    `;
                });
            } else {
                teamsHtml = '<div class="team-card">No teams found</div>';
            }
            
            document.getElementById('results-message').innerHTML = teamsHtml;
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
            // Add click event listeners to team cards
            document.querySelectorAll('.team-card').forEach(card => {
                card.addEventListener('click', async function() {
                    const teamID = this.getAttribute('data-team-id');
                    const year = this.getAttribute('data-year');
                    
                    try {
                        const response = await fetch(`/players?year=${year}&teamID=${teamID}`);
                        const data = await response.json();
                        const players = data.players;
                        
                        // Show players in a modal or panel
                        let playersHtml = '<div class="players-panel">';
                        playersHtml += '<div class="players-header">';
                        playersHtml += `<button class="close-btn">×</button>`;
                        playersHtml += '<h3>Players</h3>';
                        playersHtml += '</div>';
                        playersHtml += '<div class="players-list">';
                        
                        if (players && players.length > 0) {
                            players.forEach(player => {
                                playersHtml += `<div class="player-item">${player.firstName} ${player.lastName}</div>`;
                            });
                        } else {
                            playersHtml += '<div class="player-item">No players found</div>';
                        }
                        
                        playersHtml += '</div></div>';
                        
                        // Create or update modal
                        let modal = document.getElementById('players-modal');
                        if (!modal) {
                            modal = document.createElement('div');
                            modal.id = 'players-modal';
                            modal.className = 'modal';
                            document.body.appendChild(modal);
                        }
                        
                        modal.innerHTML = playersHtml;
                        modal.style.display = 'flex';
                        
                        // Close modal on close button click
                        modal.querySelector('.close-btn').addEventListener('click', function() {
                            modal.style.display = 'none';
                        });
                        
                        // Close modal when clicking outside the panel
                        modal.addEventListener('click', function(e) {
                            if (e.target === modal) {
                                modal.style.display = 'none';
                            }
                        });
                    } catch (error) {
                        console.error('Error fetching players:', error);
                        alert('Error fetching players: ' + error.message);
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            alert('Error fetching teams: ' + error.message);
        }
    });
});
