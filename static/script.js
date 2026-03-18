// Fetch years from the API and populate the dropdown
async function loadYears() {
    const yearSelect = document.getElementById('year-select');
    try {
        const response = await fetch('/years');
        if (!response.ok) {
            throw new Error('Failed to fetch years');
        }
        const data = await response.json();
        const years = data.years;

        // Clear the select and add fetched years
        yearSelect.innerHTML = '<option value="">-- Select a Year --</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading years:', error);
        yearSelect.innerHTML = '<option value="">Error loading years</option>';
    }
}

// Handle submit button click
document.getElementById('submit-btn').addEventListener('click', function () {
    const yearSelect = document.getElementById('year-select');
    const selectedYear = yearSelect.value;

    if (!selectedYear) {
        alert('Please select a year');
        return;
    }

    // Show results section
    const resultsSection = document.getElementById('results');
    document.getElementById('results-title').textContent = `Baseball Statistics for ${selectedYear}`;
    document.getElementById('results-message').textContent = `You selected the year ${selectedYear}. Additional statistics and data will be displayed here.`;
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
});

// Load years when page loads
document.addEventListener('DOMContentLoaded', loadYears);
