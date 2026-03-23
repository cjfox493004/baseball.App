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
                                playersHtml += `<div class="player-item" data-player-id="${player.playerID}" data-year="${year}" style="cursor: pointer;">${player.firstName} ${player.lastName}</div>`;
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
                        
                        // Add click event listeners to player items
                        document.querySelectorAll('.player-item[data-player-id]').forEach(item => {
                            item.addEventListener('click', async function() {
                                const playerID = this.getAttribute('data-player-id');
                                const year = this.getAttribute('data-year');
                                
                                try {
                                    const response = await fetch(`/player/${playerID}?year=${year}`);
                                    const data = await response.json();
                                    
                                    if (data.error) {
                                        alert('Player not found');
                                        return;
                                    }
                                    
                                    showPlayerCard(data.bio, data.stats, year);
                                } catch (error) {
                                    console.error('Error fetching player details:', error);
                                    alert('Error fetching player details: ' + error.message);
                                }
                            });
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

function showPlayerCard(bio, stats, year) {
    // Create player card modal
    let cardModal = document.getElementById('player-card-modal');
    if (!cardModal) {
        cardModal = document.createElement('div');
        cardModal.id = 'player-card-modal';
        cardModal.className = 'modal';
        document.body.appendChild(cardModal);
    }
    
    // Calculate age if birth year is available
    let age = '';
    if (bio.birthYear) {
        age = ` (${year - bio.birthYear} years old in ${year})`;
    }
    
    // Format birth date
    let birthDate = '';
    if (bio.birthYear && bio.birthMonth && bio.birthDay) {
        birthDate = `${bio.birthMonth}/${bio.birthDay}/${bio.birthYear}`;
    } else if (bio.birthYear) {
        birthDate = bio.birthYear.toString();
    }
    
    let cardHtml = `
        <div class="player-card-panel">
            <div class="player-card-header">
                <button class="close-btn">×</button>
                <h3>${bio.nameFirst} ${bio.nameLast}${age}</h3>
            </div>
            <div class="player-card-content">
                <div class="player-bio">
                    <h4>Biographical Information</h4>
                    <div class="bio-grid">
                        ${birthDate ? `<div class="bio-item"><strong>Birth Date:</strong> ${birthDate}</div>` : ''}
                        ${bio.birthCity || bio.birthState || bio.birthCountry ? `<div class="bio-item"><strong>Birth Place:</strong> ${[bio.birthCity, bio.birthState, bio.birthCountry].filter(Boolean).join(', ')}</div>` : ''}
                        ${bio.height ? `<div class="bio-item"><strong>Height:</strong> ${bio.height}"</div>` : ''}
                        ${bio.weight ? `<div class="bio-item"><strong>Weight:</strong> ${bio.weight} lbs</div>` : ''}
                        ${bio.bats ? `<div class="bio-item"><strong>Bats:</strong> ${bio.bats}</div>` : ''}
                        ${bio.throws ? `<div class="bio-item"><strong>Throws:</strong> ${bio.throws}</div>` : ''}
                        ${bio.debut ? `<div class="bio-item"><strong>MLB Debut:</strong> ${bio.debut}</div>` : ''}
                        ${bio.finalGame ? `<div class="bio-item"><strong>Final Game:</strong> ${bio.finalGame}</div>` : ''}
                    </div>
                </div>
                <div class="player-stats">
                    <h4>${year} Batting Statistics</h4>
                    <canvas id="stats-chart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
    `;
    
    cardModal.innerHTML = cardHtml;
    cardModal.style.display = 'flex';
    
    // Close modal on close button click
    cardModal.querySelector('.close-btn').addEventListener('click', function() {
        cardModal.style.display = 'none';
    });
    
    // Close modal when clicking outside the panel
    cardModal.addEventListener('click', function(e) {
        if (e.target === cardModal) {
            cardModal.style.display = 'none';
        }
    });
    
    // Create chart if stats exist
    if (stats && stats.length > 0) {
        const stat = stats[0]; // Assuming one stat record per year
        
        const ctx = document.getElementById('stats-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Games', 'At Bats', 'Hits', 'Home Runs', 'RBIs', 'Stolen Bases', 'Walks', 'Strikeouts'],
                datasets: [{
                    label: `${year} Stats`,
                    data: [
                        stat.G || 0,
                        stat.AB || 0,
                        stat.H || 0,
                        stat.HR || 0,
                        stat.RBI || 0,
                        stat.SB || 0,
                        stat.BB || 0,
                        stat.SO || 0
                    ],
                    backgroundColor: 'rgba(0, 51, 102, 0.8)',
                    borderColor: 'rgba(0, 51, 102, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}
